# ProcureIQ Architecture

## Design objective

ProcureIQ is a single full-stack application that remains useful at ₹0 ongoing cost for normal portfolio demonstration. The core product uses no secrets, paid APIs, hosted database or remote optimization service.

## Runtime flow

```text
Browser action
  ├─ React workspace and visualizations
  ├─ deterministic demo generator
  ├─ local CSV/XLSX parsing
  └─ IndexedDB persistence
        ↓ explicit analytical request
Next.js Route Handler
  ├─ body-size enforcement
  ├─ Zod schema validation
  └─ safe structured errors
        ↓
Procurement domain function
  ├─ analytics
  ├─ cost models
  ├─ supplier evaluation
  ├─ constrained allocation
  └─ scenario simulation
        ↓
Structured response → React decision view
```

## Application layers

### Presentation

`src/app` provides App Router pages, public documentation and stateless API route handlers. `src/components` contains the shell, modules, charts, brand and reusable UI. Workspace pages are routed through `/workspace/[module]` and validated against a fixed module registry.

### State and persistence

`WorkspaceProvider` owns one `WorkspaceSnapshot`. Dexie stores that snapshot in the browser’s IndexedDB. Persistence includes the dataset, saved should-cost models, saved scenarios, opportunity statuses and analytical settings. A JSON backup can restore the same object. UI-only sidebar state uses versioned localStorage.

### Domain

`src/domain/procurement` has framework-independent deterministic functions. React components do not contain the underlying procurement formulas. Inputs and outputs are strict TypeScript structures from `src/types/procurement.ts`.

### Backend

Route handlers under `src/app/api` expose health, spend, supplier, TCO, should-cost, RFQ, optimization, negotiation, scenario and reporting capabilities. They are stateless and share domain functions with the frontend.

### Data

`src/data/demo/generate.ts` builds a fixed-seed linked dataset. Generation is cached per runtime for UI responsiveness, while tests call the non-cached generator to prove reproducibility.

## Security boundaries

- 1 MB analytical API request limit and 5 MB local tabular import limit.
- Zod schemas reject invalid, missing and out-of-range fields.
- Imported CSV/XLSX is treated as data; there is no `eval` or executable template path.
- User-controlled values are rendered as React text, which is escaped by default.
- Downloadable HTML report values pass through explicit HTML escaping.
- Security headers disable framing, MIME sniffing and unused browser permissions.
- Production dependency audit is part of the release gate.

## Performance

- Demo data is generated once and cached.
- Domain calculations use maps/grouping rather than repeated full-array scans where materially useful.
- Heavy XLSX parsing is dynamically imported only on spreadsheet upload.
- Tables show bounded analytical slices and scroll on narrow viewports.
- Charts live inside client-only reusable components.

## Deployment

Next.js UI and Route Handlers deploy in one Vercel project. The absence of a production database or runtime secret keeps preview and production environments equivalent for core use.
