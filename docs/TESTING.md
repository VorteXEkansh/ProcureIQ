# Testing

## Unit and integration

Vitest covers:

- deterministic data volume, reproducibility and referential links;
- ABC, Pareto, concentration/HHI, PPV and spend breakdown;
- supplier weights, scoring, operational risk and RFQ normalization;
- TCO, carrying cost, quality cost, should-cost and negotiation break-even;
- savings overlap, recommendation evidence and scenario deltas;
- optimizer demand balance, capacity, exclusions, concentration, objective and infeasibility;
- INR lakh/crore and exact formatting;
- health, TCO, spend and optimizer Route Handlers, including invalid, malformed and oversized bodies.

Run:

```bash
npm run test
```

## End to end

Playwright tests the public landing page, workspace opening, spend filter, supplier profile, comparison, should-cost mutation, RFQ evaluation, optimization, scenario, local import, backup export, guided demo, methodology, settings and reset recovery. Projects include desktop Chromium and a Pixel 7 mobile profile.

```bash
npx playwright install chromium
npm run test:e2e
```

## Release gates

`npm run test:all` runs lint, strict typecheck, Vitest and production build. Playwright is separate because it manages a real dev server and browser binary.
