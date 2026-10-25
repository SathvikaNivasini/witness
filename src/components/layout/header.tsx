import Link from "next/link";
import { Suspense } from "react";
import { Navigation } from "./bottomnav";

export function WitnessMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? 23 : 31}
      height={small ? 23 : 31}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 17C7 6 23 3 29 6c0 14-9 23-18 19C5 23 5 15 12 12c4-2 8 0 8 4 0 3-3 5-6 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 28 22 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Witness home">
          <WitnessMark />
          <span>
            witness<span className="brand-period">.</span>
          </span>
        </Link>
        <Suspense>
          <Navigation placement="header" />
        </Suspense>
        <span className="pilot-label">
          <span />
          Dallas pilot
        </span>
      </div>
    </header>
  );
}
