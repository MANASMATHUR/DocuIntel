# Contributing to DocuIntel

Thanks for your interest in contributing!

## Development Setup

```bash
cd nextjs-app
cp .env.example .env.local
# Fill in MONGODB_URI, OPENAI_API_KEY, JWT_SECRET at minimum
npm install
npm run dev
```

## Before Submitting a PR

1. Run lint: `npm run lint`
2. Run typecheck: `npx tsc --noEmit`
3. Run build: `npm run build`
4. Keep changes focused — one feature or fix per PR

## Code Conventions

- TypeScript strict mode; prefer explicit types on public APIs
- Server Components for data loading; client islands for interactivity
- Use TanStack Query for shared client-side data (`useUser`, `useCases`)
- Validate API inputs with Zod
- Auth: never trust client-supplied `X-User-Id` headers

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.
