# Nilam — National Digital Platform for Research & Policy Innovation in Land Governance

Smart India Hackathon prototype. One platform, three portals, one connected chain:

```
DATA → RESEARCH → EVIDENCE → POLICY → SIMULATION → PILOT → EVALUATION → KNOWLEDGE
```

> **DEMO PROTOTYPE.** All figures, maps, parcels and records are synthetic unless a record carries the
> *Official programme · summary* badge (a real programme/law, summarised – verify against the official source).
> Nothing here is an official cadastral boundary or a basis for real decisions.

---

## 1. Setup

Requires Node.js 18.17+ (tested on 22).

```bash
npm install
npm run dev                      # http://localhost:3000
# production
npm run build && npm start       # http://localhost:3000
```

Everything is client-side demo data; no database or API keys. User actions (scenarios, pilots, readings, case studies,
applications, consultation responses…) are saved in the browser's `localStorage`. *Data & methods → Reset demo data* clears them.

## 2. Demo credentials (password for all: `demo123`)

| Email | Portals |
|---|---|
| `admin@landintel.demo` | Government, Research, Public (best for the demo – use "Switch portal") |
| `officer@landintel.demo` | Government & Policy |
| `researcher@landintel.demo` | Research & Academia |
| `citizen@landintel.demo` | Public & Citizen |

The login page also has quick-fill buttons and a *Continue as guest* option for the public portal.

## 3. The three portals

| | Government | Research | Public |
|---|---|---|---|
| Experience | Dense, dark decision-support console | Light academic workspace with an "active project" switcher | Top-nav, large type, plain-language |
| Route base | `/portal/government/…` | `/portal/researcher/…` | `/portal/public/…` |

All routes follow `/portal/<role>/<module>` and `/portal/<role>/<module>/<record-id>`. Every portal also has
`/search?q=…` and `/about` (Data & methods). Breadcrumbs, the sidebar/top-nav and the in-app **Guide** are on every page.

### Government — 11 modules
| Route | Module | What you do |
|---|---|---|
| `overview` | Command Centre | National/state indicators, policy pipeline, alerts |
| `problems`, `problems/PP-xxx` | Policy Problems | Frame a problem; tabs for evidence, datasets, policies, baseline, objectives, interventions, lifecycle |
| `evidence` | Evidence Explorer | Search research/policy/literature/datasets; add to a problem |
| `simulator`, `simulator/SIM-xxx` | Policy Simulator | Move levers, see indicator paths, save/compare scenarios, plan a pilot |
| `pilots`, `pilots/PL-xxx` | Pilot & Evaluation | KPIs, record readings, conclude evaluation, publish case study |
| `programmes`, `programmes/PRG-xx` | Programme Monitor | DILRMP, ULPIN/Bhu-Aadhaar, NAKSHA, SVAMITVA, … by state |
| `gis` | GIS Intelligence | Map hotspots, compare areas, create a problem from a finding |
| `datasets`, `datasets/DS-xx` | Data Catalogue | Metadata, quality, access, linked work |
| `cases`, `cases/CS-xx` | Case Studies | Problem → intervention → outcome → lessons |
| `innovation`, `innovation/OP-xx` | Innovation Hub | Challenges and grants; review applications |
| `reports`, `reports/RPT-xx` | Reports & Briefs | Generate/print evidence briefs; consultation outcomes |

### Research — 9 modules
`overview` (Research Home) · `projects` (Research Workspace) · `datasets` (Dataset Discovery) · `library` (Literature & Policy) ·
`gis` (GIS Workspace – layer correlation, save analysis to project) · `gaps` (Research Gap Finder → start project) ·
`collab` (teams, reviews, threads) · `grants` (apply to grants/challenges) · `publish` (publications & case studies).

### Public — 8 modules
`overview` (Knowledge Home) · `atlas` (Land Atlas) · `research` (Research Library) · `policy` (Policy Explainers) ·
`insights` (State & District Insights, `insights/TN`) · `data` (Public Data, downloads) · `consultations` (read & respond) · `schemes` (Land Programmes).

## 4. GIS

* **Schematic map, not a survey map.** States/UTs are a tile cartogram (each tile = one State/UT, not to scale); six focus states
  (TN, MH, UP, KL, GJ, OD) drill into schematic district tiles. No official boundaries are drawn.
* Search any State/district/"Kolathur"; pick a layer from a plain-language list (each explains *what it shows* and *why it matters*);
  legend; click a tile for statistics, rank, national benchmark, a one-line insight, and **related datasets, research and policies**.
* Region layers: Record of Rights digitisation, cadastral map coverage, mutation backlog, land-use conversion, urban expansion,
  climate vulnerability, land disputes. Parcel layers (demo village *Kolathur*, IDs `DEMO-TN-CGL-xxxx`): land use, mutation status, dispute, flood exposure.
* Government: *Create policy problem from this finding*. Research: correlate two layers and save to a project. Public: simplified layers and explainers.
* URL params make any view linkable: `?region=TN&drill=1&layer=mutation`, `?region=TN-CGL&view=parcels&pl=p_flood&parcel=…`.

## 5. Data structure & the relationship graph

Source: `lib/data/*` (typed in `lib/types.ts`). `lib/registry.ts` merges seed data with records created in the UI and exposes
`getEntity`, `related`, `lifecycle`, `search`, `hrefFor` (maps any record id to the right route for the current role).

| Prefix | Record | Count | Prefix | Record | Count |
|---|---|---|---|---|---|
| `DS-` | Dataset | 14 | `PL-` | Pilot | 5 |
| `RP-` | Research project | 8 | `CS-` | Case study | 6 |
| `LIT-` | Literature | 13 | `OP-` | Opportunity | 6 |
| `POL-` | Policy / law | 9 | `ART-` | Explainer article | 6 |
| `PRG-` | Programme | 5 | `CN-` | Consultation | 3 |
| `PP-` | Policy problem | 6 | `GAP-` | Research gap | 8 |
| `SIM-` | Simulation | 6 | `TM-` / `PUB-` / `RPT-` | Team / publication / brief | 3 / 6 / 2 |

Links: problem ↔ datasets, research, policies, GIS region+layer, simulation, pilots · simulation → scenarios → pilot → evaluation → case study →
brief · research ↔ datasets, policies, publications · gap → project · consultation ↔ programme/policy. `npm run check:data` verifies that all 106 seed
records cross-reference correctly. Every record has `provenance: 'demo' | 'official-reference'`.

### Simulation method
`value(t) = baseline + Σ effect × (lever − default) × (1 − e^(−t/τ))`, clamped to a valid range. Linear, illustrative, with assumptions and
limitations listed on each page. It is a way to compare options transparently, **not a forecast**.

## 6. Verification scripts

With a server running (`npm start`), and Playwright + Chromium available (`npm i -g playwright`):

```bash
npm run check:data                                  # data integrity (no server needed)
npx tsc --noEmit                                    # type check
BASE=http://localhost:3000 node scripts/crawl.mjs   # visits every route and link, reports 404s/console errors
BASE=http://localhost:3000 node scripts/buttons.mjs # clicks every control; reports ones with no effect
BASE=http://localhost:3000 node scripts/mobile.mjs  # 390px and 768px overflow check
BASE=http://localhost:3000 node scripts/flow.mjs    # login → simulate → pilot → evaluation → case → brief
```
Set `CHROMIUM_PATH` if Playwright cannot find a browser. In `buttons.mjs`, already-active filter tabs and empty-search submits may be listed; those are intentional no-ops.

Last run: type check clean, production build OK, data check OK (106 records), link crawl 638 pages with no broken links/console errors, no horizontal overflow at 390/768px, full workflow passes.

## 7. SIH demo flow (≈8 minutes)

See `docs/SIH-DEMO-SCRIPT.md` for the spoken script. In short:

1. **Login** as `admin@landintel.demo` → **select Government**.
2. **Command Centre** → open *PP-024 Mutation delay* in **Policy Problems**; show the lifecycle bar and evidence tabs.
3. **Evidence** tab → open linked research (RP-02) and dataset (DS-03); **Add** more evidence from Evidence Explorer.
4. **View on map** → GIS opens on the problem's region/layer; read the insight; click a district; see related datasets/research/policies.
5. **Policy Simulator** → pick a preset option, move levers, **Save scenario**, compare with baseline.
6. **Plan pilot** → pilot opens with KPIs → **Record readings** for two months → **Conclude** evaluation.
7. **Publish as case study** → **Generate evidence brief** (printable).
8. **Switch portal → Research**: *Research Gap Finder* → start project → add dataset → *GIS Workspace* correlation → save analysis → publication.
9. **Switch portal → Public**: *Knowledge Home* → *Land Atlas* → *Policy Explainer* → *State Insights* → *Public Consultations* → submit a response.

## 8. Project layout

```
app/                 Next.js App Router (login, /portal/[role]/[module]/[id])
components/shell     Portal shells, guard, breadcrumbs, search, guide
components/ui        Shared UI + charts
components/gis       Tile map and GIS explorer
components/views     Problem, simulator, pilot, records, opportunity, consultation views
components/modules   Per-portal module pages
lib/                 types, registry, store, auth, geo, sim, actions, brief, data/*
scripts/             check-data, crawl, buttons, mobile, flow
docs/                SIH demo script
```

## 9. Known limitations (be upfront in the demo)
* Synthetic data and a schematic map; no live government APIs (DILRMP/NAKSHA/Bhu-Aadhaar integration is the stated next phase).
* Programme headline numbers are reference figures to verify before citing.
* Login is a client-side demo, not real authentication; state lives in the browser.
