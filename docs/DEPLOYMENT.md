# Deployment

## Architecture

Deploy the repository root as one Next.js application. The UI and Route Handlers share the same deployment. Do not add a separate backend, database, KV, Blob, queue or paid monitoring service for core use.

## Local release gate

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm audit --omit=dev
```

## Vercel

No environment variables are required.

```bash
npx vercel@59.5.0 whoami
npx vercel@59.5.0 --prod --yes
```

After deployment verify:

1. `/` and `/workspace/overview` render.
2. `/api/health` returns `{ status: "ok", service: "ProcureIQ", version: "1.0.0" }`.
3. POST `/api/analyze/tco` returns a calculated result for a valid payload.
4. Spend filters, supplier profile/comparison, should-cost, RFQ, optimizer and scenario flows work.
5. Local import/export, guided demo, mobile navigation and reset recovery work.

## Cost and secrets

- AI APIs: none.
- External paid APIs: none.
- Hosted database: none.
- Required API keys: none.
- Required environment variables: none.
- Paid services required for core use: none.
