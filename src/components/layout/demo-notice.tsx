"use client";

import Link from "next/link";
import { useLocalData } from "@/lib/local-store";
import { HardDrive } from "lucide-react";

export function DemoNotice() {
  const { settings } = useLocalData();
  return (
    <div className="demo-notice">
      <HardDrive size={13} aria-hidden="true" />
      <span>
        Local notebook<span className="notice-divider">·</span>
        {settings.showDemo
          ? "Exploring with demo data"
          : "Your own observations"}
      </span>
      <Link href="/profile#privacy">
        About your data <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
