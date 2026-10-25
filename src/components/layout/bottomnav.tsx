"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Map, CirclePlus, BookOpen, UserRound } from "lucide-react";

const destinations = [
  { href: "/", label: "Home", icon: House },
  { href: "/map", label: "Map", icon: Map },
  { href: "/observe", label: "Observe", icon: CirclePlus },
  { href: "/activity", label: "Activity", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function Navigation({ placement }: { placement: "header" | "bottom" }) {
  const pathname = usePathname();
  const current = pathname.startsWith("/events")
    ? "/map"
    : pathname.startsWith("/observations")
      ? "/activity"
      : pathname.startsWith("/patterns")
        ? "/"
        : pathname;
  return (
    <nav
      aria-label={
        placement === "header" ? "Main navigation" : "Mobile navigation"
      }
      className={`${placement}-navigation`}
    >
      {destinations.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={
            current === href || (href !== "/" && current.startsWith(href))
              ? "page"
              : undefined
          }
        >
          <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
