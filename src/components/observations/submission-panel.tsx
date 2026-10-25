"use client";

import { useEffect, useState } from "react";
import { Check, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestSubmission } from "@/lib/api-client";
import { updateSubmission } from "@/lib/local-store";
import { formatDate } from "@/lib/format";
import type { Observation } from "@/lib/types";

export function SubmissionPanel({ observation }: { observation: Observation }) {
  const [configuration, setConfiguration] = useState<
    "loading" | "ready" | "missing" | "error"
  >("loading");
  const [attempt, setAttempt] = useState(0);
  const [sending, setSending] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState("");
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/observations", {
      cache: "no-store",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || typeof result.configured !== "boolean")
          throw new Error();
        setConfiguration(result.configured ? "ready" : "missing");
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfiguration("error");
      });
    return () => controller.abort();
  }, [attempt]);

  async function submit() {
    if (sending || observation.submission || confirmedAt || uncertain) return;
    setMessage("");
    const attemptedAt = new Date().toISOString();
    try {
      // Remember the attempt before sending, so reloading cannot silently duplicate it.
      updateSubmission(observation.id, { status: "pending", attemptedAt });
    } catch (issue) {
      setMessage(
        issue instanceof Error
          ? issue.message
          : "The submission could not be prepared. Nothing was sent.",
      );
      return;
    }
    setSending(true);
    try {
      const result = await requestSubmission(observation);
      if (result.success) {
        setConfirmedAt(result.submittedAt);
        try {
          updateSubmission(observation.id, {
            status: "submitted",
            attemptedAt,
            submittedAt: result.submittedAt,
          });
        } catch {
          setMessage(
            "Your submission arrived, but this browser couldn’t remember its status. Avoid submitting it again.",
          );
        }
      } else {
        setMessage(result.error);
        if (result.outcome === "unknown") setUncertain(true);
        else {
          try {
            updateSubmission(observation.id, undefined);
          } catch {
            setMessage(
              `${result.error} This browser couldn’t clear the pending status.`,
            );
          }
        }
      }
    } catch {
      setUncertain(true);
      setMessage(
        "Witness couldn’t confirm whether the submission arrived. Avoid submitting it again until its status is checked.",
      );
    } finally {
      setSending(false);
    }
  }

  const submittedAt = confirmedAt || observation.submission?.submittedAt;
  const pending = uncertain || observation.submission?.status === "pending";
  const hasArea =
    observation.location.latitude !== undefined &&
    observation.location.longitude !== undefined;
  return (
    <section
      className="settings-section cloud-submission"
      aria-labelledby="submission-title"
    >
      <h2 id="submission-title">Submit to Witness</h2>
      {submittedAt ? (
        <p className="settings-status" role="status">
          <Check size={16} aria-hidden="true" /> Submitted{" "}
          {formatDate(submittedAt, true)}.
        </p>
      ) : sending ? (
        <p role="status">Submitting your observation…</p>
      ) : pending ? (
        <p role="status">
          Submission unconfirmed. This note has a pending attempt; check with
          the project owner before sending it again.
        </p>
      ) : configuration === "loading" ? (
        <p role="status">Checking whether submissions are available…</p>
      ) : configuration === "missing" ? (
        <p>
          Cloud submissions aren’t set up here yet. Your saved note is available
          in this browser.
        </p>
      ) : configuration === "error" ? (
        <>
          <p>
            Submission availability couldn’t be checked. Your local note is
            safe.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setConfiguration("loading");
              setAttempt((value) => value + 1);
            }}
          >
            Check again
          </Button>
        </>
      ) : (
        <>
          <p>
            Send this note’s category, intensity, description, and approximate
            coordinates to the Witness database as a guest. Your photo and
            display name stay here. The project’s database rules control access
            to submitted notes.
          </p>
          <p className="field-hint">
            The current backend accepts notes from the last 15 minutes, with up
            to 500 characters and a known approximate area. Saving locally works
            for older or longer notes too.
          </p>
          {!hasArea ? (
            <p>
              A known approximate area is needed to submit. This note remains in
              your local notebook.
            </p>
          ) : observation.description.trim().length > 500 ? (
            <p>
              This note is over the submission limit of 500 characters. It
              remains in your local notebook.
            </p>
          ) : (
            <Button onClick={submit}>
              <CloudUpload size={17} aria-hidden="true" /> Submit to Witness
            </Button>
          )}
        </>
      )}
      {(submittedAt || pending) && (
        <p className="field-hint">
          Removing this note or clearing browser data does not delete a
          submitted database copy. Guest submissions have no account-based
          history or deletion control in this app.
        </p>
      )}
      {message && (
        <p className="error-panel" role="alert">
          {message}
        </p>
      )}
    </section>
  );
}
