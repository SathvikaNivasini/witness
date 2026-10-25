# Witness

A calm environmental field journal for the Dallas pilot of the Congressional App Challenge project. Built with Next.js App Router, React, TypeScript, Tailwind CSS, and Lucide. The app connects the repository’s trained matching model and Supabase submission backend to the designed frontend. The notebook saves locally; cloud submission is a separate, optional action and requires project configuration. There is no account sign-in or automatic sync.

## Run locally

Use Node.js 24 LTS (the built-in test runner reads TypeScript directly).

```sh
npm install
npm run dev
```

Open http://localhost:3000. Inter and Fraunces are downloaded by `next/font` during development/build, then served from this app. The initial compile needs access to Google Fonts.

```sh
npm run lint
npm test
npm run build
npm start
```

## Working flows

- Home, Map, Observe, Activity, and Profile have real routes and responsive navigation.
- Observe has three steps, keyboard-accessible category and intensity radios, validation, approximate device location or a manual fallback, an optional photo up to 1 MB, review, and confirmed local saving.
- Drafts persist after 650 ms of inactivity. The saved status appears only after the browser accepts the write. Back navigation retains the fields. Storage errors leave the form available for retry.
- Activity lists only records created in this browser. Observation details include the saved photo and deletion. Empty Activity does not contain fabricated personal records.
- Saved observation details offer **Submit to Witness** when Supabase is configured. An acknowledged insert is marked submitted; missing configuration, validation failures, database policy rejection, and uncertain network outcomes are shown explicitly. Photos stay local.
- The schematic Dallas map supports category filters, selectable markers, a preview sheet, expandable details, and event timelines. It is explicitly illustrative and not to scale; it is not a geographic tile map.
- A recurring example has a lavender timeline with native expandable summaries.
- Possible matches call the real `/api/matches` backend, which runs `matching/scoreCandidates.ts` with the existing learned weights. The screen explains category, distance, time, and description overlap, with loading, failure, and retry states. Link/keep-separate decisions persist and related demo events appear in Activity. The model is synthetic-data research, not source verification.
- Profile saves a local display name, switches demo data on/off, exports the notebook as JSON, and clears local data after confirmation.
- Focus states, a skip link, semantic controls, reduced-motion support, and mobile safe-area spacing are included.

## Data and privacy

`src/lib/demo-data.ts` contains **all simulated community reports, events, and the recurring pattern**, using fixed October 2026 dates. These do not describe real environmental incidents. Demo mode is on initially, is labeled throughout, and can be disabled in Profile to see the honest empty states.

User records, drafts, settings, photos, connection choices, and submission status are persisted in `localStorage` under `witness.local.v1`. There is no authentication or cross-device sync. Opening a demo comparison sends only the observation’s description, time, and rounded coordinates to the same app’s matching endpoint. Photos, display names, place labels, and connection history are excluded. The matching endpoint processes the comparison without storing the note. Choosing **Submit to Witness** sends category, intensity, notes, and rounded coordinates through the app to Supabase; database access is controlled by the project’s policies. This is a guest submission, not an account backup. Clearing browser data or deleting a local note does not delete any database copy. JSON export provides a manual notebook backup; import is not implemented. Storage denial, corrupt records, and quota failures are surfaced instead of claiming success.

Raw device coordinates are rounded to a roughly 2 km grid before entering form state or storage. Only the rounded area is retained. A manually entered location is saved as typed, so the form asks for a neighborhood rather than an address. Photos remain original files and may contain metadata; they stay local.

Demo comparisons use the existing `lr-v1-synthetic` model, unchanged learned weights, category-specific distance/time scales, and model cutoff. Compatible Odor/Smoke categories are supported. Multiple qualifying notes are grouped into one result per event. Device coordinates are rounded again on the server. Recognized manual Dallas area names can supply a coarse area center; other manually entered places get no fabricated coordinates or distance. Demo dates are fixed, so observations far from those dates correctly get no close matches. Rounding can reduce matching accuracy. A saved link is a personal demo choice, never proof of a common cause or source.

## Matching backend

The frontend and backend run together with `npm run dev`, or `npm run build` followed by `npm start`. No separate server, API key, or Python installation is needed to serve comparisons.

- `GET /api/matches` reports the loaded model version and synthetic-data limitation.
- `POST /api/matches` accepts `category`, `description`, `occurredAt` (ISO timestamp with timezone), and `location` with approximate `latitude`/`longitude`. The five category IDs are `odor`, `smoke`, `water`, `dust`, and `noise`.
- Responses contain `status`, `matches`, `algorithmVersion`, and `dataNote`. Match details include the event ID, model score, component scores, explanation, approximate distance, and time gap. Model scores are not environmental certainty estimates and are not displayed as confidence percentages.
- Requests are limited to 8 KB. Invalid inputs return 400, oversized requests 413, unsupported content types 415, and unexpected service failures 503. Comparison responses use `Cache-Control: no-store`.
- Existing Python training scripts, synthetic CSV data, learned weights, and reference outputs are preserved under `matching/`. Its test now uses Node’s existing test runner, avoiding another test-library dependency. See [the model notes](matching/README.md).

For a repeatable positive demo, record an **Odor** observation at **Trinity corridor**, dated **October 22, 2026 at 5:50 pm Dallas time**, with a description such as “A sharp smell near the trail.” Open demo comparisons to exercise the real API against the simulated event. Current observations will often have no matches because the example dates are fixed.

## Supabase submission backend

The original root `app/actions.ts` submission logic is integrated under `src/app/actions.ts` and `src/lib/server/submit-observation.ts`. The JSON route and server action use the same validation and insert service. The prototype root `app/` is replaced by `src/app/` so Next.js serves the designed frontend. The canonical matching model remains under `matching/`.

1. Copy `.env.example` to `.env.local` and configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` using the existing project's public/anon key. Keep `.env.local` out of Git; never use a service-role key. Restart the dev server after changing configuration.
2. Inspect the existing project's `public.observations` table. The inherited insert contract requires `category`, `intensity`, `notes`, `reported_timing`, `private_latitude`, `private_longitude`, and nullable `owner_id`. No schema or migration was included in the repository, so the existence, types, constraints, and policies of the live table must be verified against the actual project.
3. Confirm the existing row-level security policies support the intended guest insert and protect any sensitive columns. The app uses the public key and does not bypass RLS. If the project requires authenticated users, guest submission will be rejected until an account flow is implemented.
4. Save a current observation with a recognized approximate area, then open its details and choose **Submit to Witness**. Confirm the resulting row in the project dashboard before treating the integration as live-verified.

`GET /api/observations` reports configuration presence only, without exposing credentials; it does not prove the table exists or that a write will be allowed. `POST /api/observations` accepts the five existing database category labels, numeric intensity 1–5, notes of 5–500 characters, approximate latitude/longitude, and an ISO `occurredAt`. Since the inherited table contract stores `reported_timing: "Now"`, submissions are restricted to the last 15 minutes (with one minute of future clock tolerance). Older and longer notes remain usable locally. UI intensity maps to 1, 3, or 5. Missing coordinates are rejected rather than replaced with `(0, 0)`, and the server rounds coordinates again. Photos and notebook metadata are excluded.

Submission succeeds only after Supabase acknowledges the insert. The browser remembers a pending attempt before sending. Definite validation/policy failures allow retry; transport failures retain an unconfirmed status to discourage duplicate writes. This is not database-level idempotency: guest submissions currently have no remote status lookup, account history, or deletion control. Schema-backed idempotency and an authenticated management flow require a verified project schema.

The Supabase URL/key and connected project were unavailable during implementation. Missing-configuration behavior, the inherited row mapping, validation, policy errors, and uncertain outcomes are tested with an injected client; those tests do not establish a live database connection. See [Supabase client configuration](https://supabase.com/docs/reference/javascript/initializing) and [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Organization

- `src/app/`: route pages, metadata, global styles, and error states.
- `src/components/`: existing `home`, `layout`, `ui`, `observations`, `events`, `maps`, and `patterns` folders.
- `src/lib/`: domain types, categories, demo fixtures, matching, date formatting, storage, and the shared client notebook store.
- `src/lib/server/match-observation.ts`: validated adapter for the existing trained matching model.
- `src/lib/api-client.ts`: browser request contract; excludes photos and private notebook metadata.
- `matching/`: existing model, dataset, training scripts, and Python-reference parity tests.
- `src/lib/server/supabase.ts` and `submit-observation.ts`: lazy Supabase configuration, validation, and the inherited database insert contract.
- `src/app/api/observations/route.ts` and `src/app/actions.ts`: JSON and FormData submission entry points.
- `tests/`: notebook persistence/privacy checks, submission/error checks, and matching integration checks. `npm test` also runs the model parity suite.

### Files implemented

The existing component folders were already correctly located under `witness/src/components/`; their empty files were filled in place.

| Location                       | Files                                                                                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                     | Updated `layout.tsx`, `page.tsx`, and `globals.css`; added `icon.svg`, `error.tsx`, and `not-found.tsx`.                                                                                                               |
| Routes under `src/app/`        | Added `map/page.tsx`, `observe/page.tsx`, `activity/page.tsx`, `profile/page.tsx`, `events/[id]/page.tsx`, `patterns/[id]/page.tsx`, `observations/[id]/page.tsx`, and `observations/[id]/matches/page.tsx`.           |
| `src/components/home/`         | `welcome.tsx`, `reports.tsx`, `prompt.tsx`.                                                                                                                                                                            |
| `src/components/layout/`       | `header.tsx`, `bottomnav.tsx`, `demo-notice.tsx`, `demo-gate.tsx`, `profile.tsx`.                                                                                                                                      |
| `src/components/ui/`           | `button.tsx`, `input.tsx`, `card.tsx`, `badge.tsx`, `empty-state.tsx`, `page-heading.tsx`.                                                                                                                             |
| `src/components/observations/` | `observation_form.tsx`, `category_selector.tsx`, `intensity_selector.tsx`, `location_status.tsx`, `observation_card.tsx`, `observation_review.tsx`, `save_confirmation.tsx`, `observation-detail.tsx`, `activity.tsx`. |
| `src/components/events/`       | `eventcard.tsx`, `event-timeline.tsx`, `matchcard.tsx`, `possible-matches.tsx`.                                                                                                                                        |
| `src/components/maps/`         | `eventmap.tsx`, `mapfilters.tsx`.                                                                                                                                                                                      |
| `src/components/patterns/`     | `patterncard.tsx`, `patterntimeline.tsx`.                                                                                                                                                                              |
| `src/lib/`                     | `types.ts`, `categories.ts`, `demo-data.ts`, `format.ts`, `matching.ts`, `storage.ts`, `local-store.ts`.                                                                                                               |
| Project support                | Added `tests/notebook.test.mjs` and the `npm test` script; updated `README.md`, `.gitignore`, `eslint.config.mjs`, and `next.config.ts`. Existing dependency changes were retained.                                    |

## Design references

The backend integration also adds `src/app/api/matches/route.ts`, `src/lib/api-client.ts`, `src/lib/server/match-observation.ts`, `tests/backend-integration.test.mjs`, and `matching/README.md`. It connects the existing files in `matching/`, adapts their parity test to Node, and updates `tsconfig.json` and `.gitattributes` for TypeScript imports and unchanged CSV bytes.

The implementation prioritizes necessary content, a clear primary action, feedback near its trigger, specific form errors, and optional motion:

- [NN/g: Aesthetic and minimalist design](https://www.nngroup.com/articles/aesthetic-minimalist-design/)
- [NN/g: Microinteractions](https://www.nngroup.com/articles/microinteractions/)
- [GOV.UK: Error messages](https://design-system.service.gov.uk/components/error-message/)
- [Apple: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [web.dev: Accessible responsive design](https://web.dev/learn/design/accessibility/)

## Next frontend work

Verify the connected Supabase schema and policies, then add authenticated history and deletion if the project requires them. Test with Dallas residents and assistive technology, validate the synthetic matching model against appropriate real data, and add real event sources before presenting community data as live. Photo uploads would need safe metadata processing and moderation. A geographic basemap and notebook import are useful later additions.
