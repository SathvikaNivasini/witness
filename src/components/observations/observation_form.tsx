"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ImagePlus,
  LoaderCircle,
  X,
} from "lucide-react";
import { ObservationReview } from "./observation_review";
import { SaveConfirmation } from "./save_confirmation";
import { CategorySelector } from "./category_selector";
import { IntensitySelector } from "./intensity_selector";
import { LocationStatus } from "./location_status";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Textarea } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import {
  clearDraft,
  saveDraft,
  saveObservation,
  useLocalData,
} from "@/lib/local-store";
import { localDateTime } from "@/lib/format";
import type { Observation, ObservationDraft } from "@/lib/types";

const steps = ["What happened?", "Add details", "Review"];
const newDraft = (): ObservationDraft => ({
  category: "",
  description: "",
  intensity: "noticeable",
  occurredAt: localDateTime(),
  location: { label: "", method: "manual" },
  step: 0,
});
type Errors = Partial<
  Record<"category" | "description" | "occurredAt" | "location", string>
>;

export function ObservationExperience() {
  const local = useLocalData();
  if (!local.ready) return <LoadingState />;
  if (local.error)
    return (
      <div className="error-panel" role="alert">
        <h2>Your notebook needs attention.</h2>
        <p>{local.error}</p>
        <Link href="/profile#privacy" className="text-link">
          Open storage settings
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  return (
    <ObservationForm
      initialDraft={local.draft}
      showDemo={local.settings.showDemo}
    />
  );
}

function ObservationForm({
  initialDraft,
  showDemo,
}: {
  initialDraft: ObservationDraft | null;
  showDemo: boolean;
}) {
  const [draft, setDraft] = useState<ObservationDraft>(
    () => initialDraft ?? newDraft(),
  );
  const [changed, setChanged] = useState(false);
  const [draftStatus, setDraftStatus] = useState(initialDraft ? "saved" : "");
  const [draftError, setDraftError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Observation | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function update(patch: Partial<ObservationDraft>) {
    setDraft((value) => ({ ...value, ...patch }));
    setChanged(true);
    setDraftStatus("pending");
    setSaveError("");
    setErrors((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(patch)) delete next[key as keyof Errors];
      return next;
    });
  }

  useEffect(() => {
    if (!changed || saved) return;
    draftTimer.current = setTimeout(() => {
      try {
        saveDraft(draft);
        setDraftStatus("saved");
        setDraftError("");
      } catch (error) {
        setDraftStatus("error");
        setDraftError(
          error instanceof Error
            ? error.message
            : "Your draft couldn't be saved.",
        );
      }
    }, 650);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [draft, changed, saved]);

  function validate(all = false) {
    const next: Errors = {};
    if ((draft.step === 0 || all) && !draft.category)
      next.category = "Choose a category for your observation.";
    if (draft.step === 1 || all) {
      if (draft.description.trim().length < 5)
        next.description =
          "Add a few words about what you noticed (at least 5 characters).";
      const date = Date.parse(draft.occurredAt);
      if (!Number.isFinite(date))
        next.occurredAt = "Choose when you noticed the condition.";
      else if (date > Date.now() + 60_000)
        next.occurredAt = "Choose a time in the past or the present.";
      if (draft.location.label.trim().length < 2)
        next.location = "Enter a general area or use approximate location.";
    }
    setErrors(next);
    if (Object.keys(next).length)
      requestAnimationFrame(() => errorSummary.current?.focus());
    return Object.keys(next).length === 0;
  }

  function changeStep(step: number) {
    update({ step });
    setErrors({});
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || readingPhoto) return;
    if (!validate(draft.step === 2)) return;
    if (draft.step < 2) {
      changeStep(draft.step + 1);
      return;
    }
    setSaving(true);
    setSaveError("");
    if (draftTimer.current) clearTimeout(draftTimer.current);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    try {
      const observation: Observation = {
        id: crypto.randomUUID(),
        category: draft.category as Observation["category"],
        description: draft.description.trim(),
        intensity: draft.intensity,
        occurredAt: new Date(draft.occurredAt).toISOString(),
        savedAt: new Date().toISOString(),
        location: { ...draft.location, label: draft.location.label.trim() },
        ...(draft.photo ? { photo: draft.photo } : {}),
        connections: {},
      };
      saveObservation(observation);
      setSaved(observation);
      requestAnimationFrame(() =>
        document.getElementById("save-confirmation")?.focus(),
      );
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Your observation couldn't be saved. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function attachPhoto(file?: File) {
    setPhotoError("");
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.type,
      )
    ) {
      setPhotoError("Choose a JPG, PNG, WebP, or AVIF photo.");
      return;
    }
    if (file.size > 1_000_000) {
      setPhotoError(
        "Choose a photo smaller than 1 MB for this local notebook.",
      );
      return;
    }
    setReadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      update({ photo: String(reader.result) });
      setReadingPhoto(false);
    };
    reader.onerror = () => {
      setPhotoError("That photo couldn't be opened. Please choose it again.");
      setReadingPhoto(false);
    };
    reader.readAsDataURL(file);
  }

  function discard() {
    if (
      !window.confirm(
        "Discard this draft? Your saved observations will stay in your notebook.",
      )
    )
      return;
    try {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      clearDraft();
      setDraft(newDraft());
      setChanged(false);
      setDraftStatus("");
      setDraftError("");
      setErrors({});
      setPhotoError("");
      setSaveError("");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Your draft couldn't be removed.",
      );
    }
  }

  if (saved)
    return (
      <SaveConfirmation
        observation={saved}
        showDemo={showDemo}
        onNew={() => {
          setSaved(null);
          setDraft(newDraft());
          setChanged(false);
          setDraftStatus("");
          setDraftError("");
          setPhotoError("");
          setErrors({});
          setSaveError("");
        }}
      />
    );

  return (
    <form className="observation-form" onSubmit={submit} noValidate>
      <ol className="form-progress" aria-label="Observation progress">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={draft.step === index ? "step" : undefined}
            data-complete={draft.step > index}
          >
            <span>
              {draft.step > index ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <div className="form-step-heading">
        <h2 ref={heading} tabIndex={-1}>
          {draft.step === 0
            ? "Start with what you noticed."
            : draft.step === 1
              ? "A few details tell the story."
              : "Does this look right?"}
        </h2>
        <p>
          {draft.step === 0
            ? "You don’t need to know the cause to make a note."
            : draft.step === 1
              ? "Write what you experienced, in your own words."
              : "Take a moment to check your note before saving."}
        </p>
      </div>
      {Object.keys(errors).length > 0 && (
        <div
          className="error-panel"
          ref={errorSummary}
          tabIndex={-1}
          role="alert"
        >
          <strong>A couple of things to check</strong>
          <ul>
            {Object.entries(errors).map(([key, value]) => (
              <li key={key}>
                <a href={`#${key === "category" ? "category-odor" : key}`}>
                  {value}
                </a>
              </li>
            ))}
          </ul>
          {draft.step === 2 && (
            <Button
              variant="text"
              onClick={() => changeStep(errors.category ? 0 : 1)}
            >
              Go back and edit
            </Button>
          )}
        </div>
      )}
      {draft.step === 0 && (
        <CategorySelector
          value={draft.category}
          onChange={(category) => update({ category })}
          error={errors.category}
        />
      )}
      {draft.step === 1 && (
        <div className="form-fields">
          <div>
            <label htmlFor="description">What was it like?</label>
            <p className="field-hint" id="description-hint">
              For example, “A sharp smell near the trail, noticeable for about
              ten minutes.”
            </p>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe what you noticed…"
              value={draft.description}
              maxLength={1000}
              onChange={(event) => update({ description: event.target.value })}
              aria-invalid={!!errors.description}
              aria-describedby={`description-hint${errors.description ? " description-error" : ""}`}
            />
            <div className="input-caption">
              <FieldError id="description-error">
                {errors.description}
              </FieldError>
              <span>{draft.description.length}/1000</span>
            </div>
          </div>
          <IntensitySelector
            value={draft.intensity}
            onChange={(intensity) => update({ intensity })}
          />
          <div>
            <label htmlFor="occurredAt">When did you notice it?</label>
            <p className="field-hint" id="time-hint">
              Use your device’s local date and time.
            </p>
            <Input
              id="occurredAt"
              name="occurredAt"
              type="datetime-local"
              value={draft.occurredAt}
              max={localDateTime()}
              onChange={(event) => update({ occurredAt: event.target.value })}
              aria-invalid={!!errors.occurredAt}
              aria-describedby={`time-hint${errors.occurredAt ? " time-error" : ""}`}
            />
            <FieldError id="time-error">{errors.occurredAt}</FieldError>
          </div>
          <LocationStatus
            value={draft.location}
            onChange={(location) => update({ location })}
            error={errors.location}
          />
          <div className="photo-field">
            <label htmlFor="photo">
              Add a photo <span className="optional">Optional</span>
            </label>
            <p className="field-hint" id="photo-hint">
              JPG, PNG, WebP, or AVIF, up to 1 MB. Stored on this browser only.
            </p>
            <input
              ref={fileInput}
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => attachPhoto(event.target.files?.[0])}
              aria-describedby={`photo-hint${photoError ? " photo-error" : ""}`}
              disabled={readingPhoto}
            />
            {readingPhoto && (
              <p role="status" className="field-hint">
                Opening photo…
              </p>
            )}
            {draft.photo ? (
              <div className="photo-preview">
                <Image
                  src={draft.photo}
                  alt="Photo attached to your observation"
                  width={640}
                  height={400}
                  unoptimized
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    update({ photo: undefined });
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                >
                  <X size={15} aria-hidden="true" />
                  Remove photo
                </Button>
              </div>
            ) : (
              <span className="photo-hint-icon">
                <ImagePlus size={16} aria-hidden="true" />A photo is helpful,
                but a few words are enough.
              </span>
            )}
            <FieldError id="photo-error">{photoError}</FieldError>
          </div>
        </div>
      )}
      {draft.step === 2 && (
        <ObservationReview draft={draft} onEdit={() => changeStep(1)} />
      )}
      {(saveError || draftError) && (
        <div className="error-panel" role="alert">
          {saveError || draftError}
        </div>
      )}
      <div className="form-actions">
        {draft.step > 0 ? (
          <Button
            variant="secondary"
            onClick={() => changeStep(draft.step - 1)}
            disabled={saving}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </Button>
        ) : (
          <Button variant="text" onClick={discard}>
            Discard draft
          </Button>
        )}
        <Button type="submit" disabled={saving || readingPhoto}>
          {saving ? (
            <LoaderCircle size={17} className="spin" aria-hidden="true" />
          ) : draft.step === 2 ? (
            <Check size={17} aria-hidden="true" />
          ) : null}
          {saving
            ? "Saving…"
            : draft.step === 2
              ? "Save observation"
              : draft.step === 0
                ? "Add details"
                : "Review observation"}
          {draft.step < 2 && <ArrowRight size={16} aria-hidden="true" />}
        </Button>
      </div>
      <p className="draft-status" role="status">
        {draftStatus === "saved" && (
          <>
            <CheckCheck size={14} aria-hidden="true" />
            Draft saved in this browser
          </>
        )}
        {draftStatus === "pending" && "Saving draft…"}
        {draftStatus === "error" && "Draft not saved"}
      </p>
    </form>
  );
}
