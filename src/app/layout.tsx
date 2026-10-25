import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Navigation } from "@/components/layout/bottomnav";
import { DemoNotice } from "@/components/layout/demo-notice";
import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Witness — A neighborhood field journal",
    template: "%s · Witness",
  },
  description:
    "Notice and record environmental conditions. Explore possible connections, with privacy in mind. Dallas pilot, local demo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Header />
        <div className="app-container">
          <DemoNotice />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <footer className="app-footer">
            <span>
              <LockKeyhole size={14} aria-hidden="true" />A little more
              awareness. A little less guesswork.
            </span>
            <Link href="/profile#privacy">Your privacy comes first</Link>
          </footer>
        </div>
        <Suspense>
          <Navigation placement="bottom" />
        </Suspense>
      </body>
    </html>
  );
}
