"use client";

import { useState, type FormEvent } from "react";
import { Download, LockKeyhole, UserRound, Trash2, Check } from "lucide-react";
import {
  resetLocalData,
  updateSettings,
  useLocalData,
} from "@/lib/local-store";
import { readLocalData } from "@/lib/storage";
import { PageHeading } from "@/components/ui/page-heading";
import { LoadingState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Profile() {
  const data = useLocalData();
  if (!data.ready) return <LoadingState />;
  return <ProfileSettings />;
}

function ProfileSettings() {
  const { observations, settings, error: storageError } = useLocalData();
  const [name, setName] = useState(settings.name);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      updateSettings({ name: name.trim() });
      setStatus("Profile saved in this browser.");
      setError("");
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : "Your profile couldn't be saved.",
      );
    }
  }
  function toggleDemo(showDemo: boolean) {
    try {
      updateSettings({ showDemo });
      setError("");
      setStatus(
        showDemo ? "Demo examples are visible." : "Demo examples are hidden.",
      );
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : "Your preference couldn't be saved.",
      );
    }
  }
  function exportData() {
    try {
      const data = readLocalData(window.localStorage);
      const url = URL.createObjectURL(
        new Blob(
          [
            JSON.stringify(
              { exportedAt: new Date().toISOString(), ...data },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "witness-notebook.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Export prepared. Check your browser’s downloads.");
      setError("");
    } catch {
      setError(
        "Your notebook couldn't be exported. Your saved data has been left untouched.",
      );
    }
  }
  function reset() {
    if (
      !window.confirm(
        "Remove all observations, photos, your draft, saved name, and connection decisions from this browser? This cannot be undone. Submitted database copies will not be deleted.",
      )
    )
      return;
    try {
      resetLocalData();
      setName("");
      setError("");
      setStatus("Local notebook cleared. You can start fresh.");
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : "Your data couldn't be removed.",
      );
    }
  }

  return (
    <div className="narrow-page">
      <PageHeading
        eyebrow="Make yourself at home"
        title="Your notebook, your choices."
        description="A few simple settings, with privacy at the center."
      />
      <div className="profile-identity">
        <span className="profile-avatar">
          <UserRound size={27} strokeWidth={1.3} aria-hidden="true" />
        </span>
        <div>
          <h2>{settings.name || "Your local notebook"}</h2>
          <p>No account connected · This browser only</p>
        </div>
      </div>
      {storageError && (
        <div className="error-panel" role="alert">
          {storageError}
        </div>
      )}
      <section className="settings-section">
        <h2>A personal touch</h2>
        <form onSubmit={saveName} className="name-form">
          <label htmlFor="display-name">
            Display name <span className="optional">Optional</span>
          </label>
          <Input
            id="display-name"
            name="displayName"
            autoComplete="nickname"
            maxLength={60}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setStatus("");
            }}
            placeholder="What should we call you?"
            disabled={!!storageError}
          />
          <Button variant="secondary" type="submit" disabled={!!storageError}>
            Save name
          </Button>
        </form>
      </section>
      <section className="settings-section">
        <h2>Explore the demo</h2>
        <label className="setting-toggle">
          <span>
            <strong>Show example reports and patterns</strong>
            <small>
              Simulated Dallas events help you try the map and connections. Your
              own Activity always starts empty.
            </small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={settings.showDemo}
            onChange={(event) => toggleDemo(event.target.checked)}
            disabled={!!storageError}
          />
          <span className="switch-track" aria-hidden="true">
            <span />
          </span>
        </label>
      </section>
      <section className="settings-section privacy-section" id="privacy">
        <div className="section-heading">
          <h2>Your data, explained.</h2>
          <LockKeyhole size={19} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <dl className="privacy-list">
          <div>
            <dt>Your notebook starts here.</dt>
            <dd>
              Your notes, photos, draft, name, and connection choices stay in
              this browser’s local storage. There is no sign-in or automatic
              sync. On a saved note, you can choose “Submit to Witness” when
              cloud submissions are available. This sends its description,
              category, intensity, and approximate coordinates to the project
              database as a guest. Database rules control access. Clearing local
              data does not delete submitted copies. Demo comparisons send only
              your description, observation time, and rounded area to this app’s
              matching endpoint; the endpoint computes a result without storing
              your note.
            </dd>
          </div>
          <div>
            <dt>A general area is enough.</dt>
            <dd>
              Device coordinates are rounded to a roughly 2 km grid before
              they’re saved. When typing a location, use a neighborhood or park
              instead of an address.
            </dd>
          </div>
          <div>
            <dt>Photos stay with your note.</dt>
            <dd>
              Photos are stored as you select them, on this browser only.
              Original files can contain metadata. Photos are excluded from both
              comparisons and cloud submissions.
            </dd>
          </div>
          <div>
            <dt>Keep a copy of what matters.</dt>
            <dd>
              Private browsing, clearing site data, or changing devices can
              remove access to your notebook. Export a copy to keep a backup.
            </dd>
          </div>
        </dl>
        <div className="data-actions">
          <Button
            variant="secondary"
            onClick={exportData}
            disabled={!!storageError}
          >
            <Download size={16} aria-hidden="true" />
            Export notebook
          </Button>
          <span>
            {observations.length} saved{" "}
            {observations.length === 1 ? "observation" : "observations"}
          </span>
        </div>
        <Button variant="danger" onClick={reset}>
          <Trash2 size={15} aria-hidden="true" />
          Clear local data
        </Button>
      </section>
      <p className="settings-status" role="status">
        {status && (
          <>
            <Check size={15} aria-hidden="true" />
            {status}
          </>
        )}
      </p>
      {error && (
        <p className="error-panel" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
