import Link from "next/link";
import { ArrowUpRight, Plus, MapPin } from "lucide-react";

export function FieldSketch() {
  return (
    <svg
      viewBox="0 0 380 220"
      fill="none"
      aria-hidden="true"
      className="field-sketch"
    >
      <g stroke="#214B3A" strokeWidth="1" opacity=".2">
        <path d="M-30 160C40 90 79 183 153 113S268 33 403 78" />
        <path d="M-26 175C43 105 88 194 161 127S273 49 403 92" />
        <path d="M-20 189C47 121 96 208 170 141S279 65 410 108" />
        <path d="M-12 205C56 139 102 226 181 155S288 82 420 125" />
        <path d="M-6 220C65 154 117 238 192 170S299 99 425 142" />
        <path d="M-5 144C59 74 73 161 142 99S257 17 396 62" />
        <path d="M-3 127C58 60 67 143 131 84S246 0 389 46" />
      </g>
      <path
        d="M32 224C91 150 125 176 165 145S203 70 235 45 288 40 327-7"
        stroke="#97B7C2"
        strokeWidth="15"
        opacity=".55"
      />
      <path
        d="M32 224C91 150 125 176 165 145S203 70 235 45 288 40 327-7"
        stroke="#6B939B"
        strokeWidth="1"
      />
      <path
        d="m20 68 77 5 42 43 49-8 24 42 134 20"
        stroke="#FCFBF8"
        strokeWidth="7"
      />
      <path
        d="m20 68 77 5 42 43 49-8 24 42 134 20"
        stroke="#BAC6BA"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <g stroke="#54775D" strokeWidth="1.3" strokeLinecap="round">
        <path d="M66 44v34m-10-10 10-12 10 12m-17-9 7-9 7 9M286 110v31m-10-11 10-11 10 11m-17-9 7-9 7 9M310 118v25m-8-8 8-10 8 10" />
      </g>
      <circle cx="145" cy="112" r="16" fill="#DDE8DF" />
      <circle cx="145" cy="112" r="9" fill="#214B3A" />
      <circle cx="145" cy="112" r="3" fill="#F7F4EE" />
      <g stroke="#214B3A" opacity=".55">
        <path d="M342 30v23m-4-18 4-5 4 5" />
        <path d="M24 27h12m-6-6v12M337 193h12m-6-6v12" strokeWidth=".8" />
      </g>
      <text x="337" y="23" fill="#54775D" fontSize="9" fontFamily="sans-serif">
        N
      </text>
      <text
        x="43"
        y="188"
        fill="#54775D"
        fontSize="9"
        fontFamily="sans-serif"
        letterSpacing="2"
      >
        PAY ATTENTION. LEAVE A NOTE.
      </text>
    </svg>
  );
}

export function Welcome() {
  return (
    <section className="welcome">
      <div className="welcome-copy">
        <p className="eyebrow">
          <span className="tiny-line" />
          Your neighborhood field journal
        </p>
        <h1>
          See what may be
          <br className="desktop-break" /> happening nearby.
        </h1>
        <p className="welcome-description">
          An unfamiliar smell. A hazy evening. A change in the water. Keep a
          record of what you notice, and explore what others may be noticing,
          too.
        </p>
        <Link href="/observe" className="button button-primary record-button">
          <Plus size={20} strokeWidth={1.7} aria-hidden="true" />
          Record observation
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <p className="action-hint">
          A small observation is a good place to start.
        </p>
      </div>
      <div className="field-note">
        <div className="field-note-heading">
          <span>FIELD NOTES</span>
          <span>001 / DALLAS</span>
        </div>
        <FieldSketch />
        <div className="field-note-caption">
          <span>The everyday is worth noticing.</span>
          <MapPin size={15} strokeWidth={1.5} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
