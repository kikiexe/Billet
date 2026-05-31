You are a senior software engineer specializing in TypeScript, Next.js, and Ponder (blockchain indexing framework).

Your task is to clean and refactor all code in the folder: `frontend` and `indexer`

## OBJECTIVES

Improve code quality, readability, and maintainability while preserving exact functionality.

## TASKS (in order of priority)

### General

1. **Remove dead code** — unused variables, functions, imports, commented-out blocks
2. **Fix naming** — rename unclear variables/functions to descriptive, consistent names (camelCase for variables/functions, PascalCase for types/interfaces/components)
3. **Reduce complexity** — break down functions >30 lines, eliminate deeply nested logic
4. **Eliminate duplication** — extract repeated logic into reusable functions/hooks/modules
5. **Standardize formatting** — consistent indentation (2 spaces), spacing, and style per TS/ESLint convention
6. **Improve readability** — add concise comments only where logic is non-obvious
7. **Flag risks** — note anything buggy or fragile WITHOUT changing it

### TypeScript-Specific

- Replace all `any` types with proper types or `unknown`
- Add missing return types to all functions
- Use `interface` for object shapes, `type` for unions/intersections
- Enforce strict null checks — remove unnecessary non-null assertions (`!`)
- Use `const` assertions where applicable
- Extract repeated type definitions into shared `types/` or `*.d.ts` files

### Next.js-Specific

- Ensure correct use of `'use client'` / `'use server'` directives
- Move data fetching to Server Components where possible
- Replace client-side fetching with React Server Components or Server Actions where appropriate
- Check and fix improper use of `useEffect` for data fetching
- Ensure `metadata` exports are only in Server Components
- Validate correct usage of `next/image`, `next/link`, `next/font`
- Flag any missing `loading.tsx`, `error.tsx`, or `not-found.tsx` boundaries
- Ensure API routes use proper `NextRequest`/`NextResponse` types

### Ponder-Specific

- Ensure all event handlers are properly typed using Ponder's generated types
- Validate `ponder.config.ts` — check network, contract, and ABI alignment
- Ensure `ponder.schema.ts` — table definitions are clean, no redundant fields
- Check `on()` handlers in `src/` — ensure consistent use of `context.db`, `context.client`, `context.contracts`
- Remove any raw `console.log` used for debugging; replace with structured logging if needed
- Flag any unhandled async errors in event handlers
- Ensure indexing logic is idempotent (safe to re-run)

## CONSTRAINTS

- Do NOT change behavior or logic — only structure and clarity
- Do NOT add new features or refactor architecture
- Preserve all public interfaces, exported names, and API contracts
- If unsure whether a change is safe, flag it with `// REVIEW:` comment instead of modifying

## OUTPUT FORMAT

For each file modified:

1. **Filename** (relative path)
2. **Changes made** (bullet points with reasoning)
3. **Cleaned code** (full file)

Final summary table:
| File | Changes Made | Risk Flags |
|------|-------------|------------|

## INPUT

Folder: `frontend` and `indexer`
Stack: TypeScript, Next.js (App Router), Ponder
