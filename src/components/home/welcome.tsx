import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Plus } from "lucide-react";

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
      <figure className="welcome-illustration">
        <Image
          src="/images/neighborhood-observation.webp"
          alt="Illustration of someone recording an observation on their phone beside a tree-lined creek."
          width={1200}
          height={900}
          sizes="(max-width: 720px) calc(100vw - 44px), (max-width: 1000px) 42vw, 450px"
          loading="eager"
          className="welcome-illustration-image"
        />
        <figcaption>A moment outside. A note worth keeping.</figcaption>
      </figure>
    </section>
  );
}
