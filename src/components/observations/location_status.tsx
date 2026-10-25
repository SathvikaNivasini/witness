"use client";

import { useState } from "react";
import { LocateFixed, LockKeyhole, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input } from "@/components/ui/input";
import { generalizeLocation, manualLocation } from "@/lib/matching";
import type { ApproximateLocation } from "@/lib/types";

export function LocationStatus({
  value,
  onChange,
  error,
}: {
  value: ApproximateLocation;
  onChange: (value: ApproximateLocation) => void;
  error?: string;
}) {
  const [status, setStatus] = useState("");
  const [locating, setLocating] = useState(false);

  function locate() {
    if (!navigator.geolocation) {
      setStatus(
        "This browser doesn't offer location access. Enter an area below instead.",
      );
      return;
    }
    setLocating(true);
    setStatus("Finding your approximate area…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(
          generalizeLocation(
            position.coords.latitude,
            position.coords.longitude,
          ),
        );
        setLocating(false);
        setStatus(
          "Approximate area added. Exact coordinates have been discarded.",
        );
      },
      (issue) => {
        setLocating(false);
        setStatus(
          issue.code === 1
            ? "Location access wasn't allowed. You can enter a neighborhood below."
            : "We couldn't find your location. Try again or enter an area below.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="location-field">
      <label htmlFor="location">Where were you?</label>
      <p className="field-hint" id="location-hint">
        A neighborhood, park, or general area is enough. Leave out your street
        address.
      </p>
      <Button variant="secondary" onClick={locate} disabled={locating}>
        {locating ? (
          <LoaderCircle className="spin" size={17} aria-hidden="true" />
        ) : (
          <LocateFixed size={17} aria-hidden="true" />
        )}
        {locating ? "Finding your area…" : "Use approximate location"}
      </Button>
      <p className="location-status" role="status">
        {status}
      </p>
      <Input
        id="location"
        name="location"
        placeholder="Or enter an area, e.g. Trinity corridor"
        value={value.label}
        list="dallas-areas"
        maxLength={100}
        onChange={(event) => {
          onChange(manualLocation(event.target.value));
          setStatus("");
        }}
        aria-invalid={!!error}
        aria-describedby={`location-hint location-privacy${error ? " location-error" : ""}`}
      />
      <datalist id="dallas-areas">
        <option value="Trinity corridor" />
        <option value="West Dallas" />
        <option value="East Dallas" />
        <option value="White Rock" />
        <option value="South Dallas" />
      </datalist>
      <FieldError id="location-error">{error}</FieldError>
      <p id="location-privacy" className="privacy-hint">
        <LockKeyhole size={13} aria-hidden="true" />
        Device locations are rounded to a roughly 2 km area before saving.
      </p>
    </div>
  );
}
