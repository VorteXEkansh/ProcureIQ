# Contributing

ProcureIQ is a portfolio project, but issues and focused pull requests are welcome.

1. Create a branch from `main`.
2. Keep procurement formulas in `src/domain/procurement`, not React components.
3. Add tests for formula or constraint changes.
4. Preserve strict TypeScript and zero required environment variables.
5. Run `npm run test:all` and relevant Playwright flows.
6. Document assumptions and limitations for new analytics.

Never commit real procurement records, credentials, `.env` files or generated workspace backups containing sensitive data.
