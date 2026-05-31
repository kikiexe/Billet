You are a senior TypeScript engineer reviewing the Billet decentralized ticketing platform.
The project has two packages: `frontend/` (Next.js 16 App Router + wagmi + viem) and `indexer/` (Ponder blockchain indexer).

Before writing any code, read `node_modules/next/dist/docs/` for breaking changes. Heed all deprecation notices.

## OBJECTIVES

Clean and refactor all code while preserving exact functionality and all on-chain logic.

## TASKS (in order of priority)

### 1. Remove Dead Code

- Remove unused imports across all files
- In `creator/page.tsx`: remove `useEffect`, `TrendingUp`, `Activity`, `ArrowRight`, `CheckCircle2`, `ShieldAlert` if unused
- In `gatekeeper/page.tsx`: remove unused `TOKEN_IDS` constant (it's redeclared inside the component)
- In `src/services/gatekeeper.ts`: this file duplicates logic already in `useMyTickets.ts` — flag it if unused by any component
- Remove `test-viem.ts` from root (it contains a hardcoded Alchemy API key — security risk)

### 2. Fix TypeScript Issues

- Replace all `any` types with proper types or `unknown`
  - `creator/page.tsx` line: `const err = error as any` → use `ContractError` interface from `useHandleError.ts`
  - `gatekeeper/page.tsx`: `details[5]` array indexing on `any` result — type properly
  - `TicketCard.tsx`: `error: any` in catch blocks
- Add explicit return types to all exported functions and hooks
- In `useListings.ts`: the `parseEventTitle` function return type is already typed — verify `ParsedEventInfo` usage is consistent
- In `gatekeeper/page.tsx`: `isCreator` derivation uses `as any` — replace with proper typed access via `eventDetails` result tuple

### 3. Reduce Complexity

- `creator/page.tsx` is 370+ lines — extract:
  - `<RevenueCalculator />` component (calculator section)
  - `<FeaturePanel />` component (features grid)
  - `<EventLaunchForm />` component (the form)
  - Keep `TicketClass` interface at the top of the file or in a shared `types/` file
- `gatekeeper/page.tsx` — extract `<HolderRow />` component for the per-holder check-in row
- `page.tsx` (home) — extract `<EventCard />` inline card rendering into a shared component (note: `EventCard` already exists in `components/events/` — the home page duplicates it inline, consolidate)

### 4. Eliminate Duplication

- `groupListingsByEvent` is duplicated in `src/app/page.tsx` AND `src/app/events/page.tsx` — extract to `src/lib/groupListings.ts` and import in both
- `TOKEN_IDS = [1, 2, 3]` is declared in both `gatekeeper/page.tsx` and `useMyTickets.ts` — move to a shared constant in `src/config/constants.ts`
- `MARKETPLACE_ADDRESS`, `NFT_ADDRESS` casting pattern is repeated — already in `contracts.ts`, ensure no inline redeclarations

### 5. Standardize Formatting

- Enforce consistent 2-space indentation
- Remove all trailing comments like `// Ticket dihapus` and `// Tambahkan import Image` (stale dev notes in `Footer.tsx`)
- Remove commented-out code blocks
- In `Navbar.tsx`: the comment block "navLinks dibiarkan utuh..." is explanatory prose — move to a proper JSDoc or remove

### 6. Improve Readability

- Add JSDoc to exported hooks: `useListings`, `useMyTickets`, `useBuyTicket`, `useHandleContractError`
- In `useListings.ts`: the N+1 RPC notice comment is good — keep it but move it to JSDoc format on the function
- `parseEventTitle` in `useListings.ts` — the comment explaining the format string is good, keep it
- `Grainient.tsx` GLSL shader code — add a single comment block at the top explaining what it does; don't comment individual shader lines

### 7. Flag Risks (DO NOT CHANGE, only add `// ⚠️ REVIEW:` comments)

- `test-viem.ts`: hardcoded Alchemy API key `IRm0znUyu95uZVbyEupxv` — flag as security risk, this file must be deleted or added to `.gitignore`
- `creator/page.tsx` `handleLaunchEvent`: `royaltyBps: 500n` is hardcoded — flag that this should be configurable
- `gatekeeper/page.tsx`: `TOKEN_IDS = [1, 2, 3]` — hardcoded token IDs, flag for dynamic fetching in production
- `useListings.ts` `maxId = 20` default — flag that this will miss listings beyond ID 20 as platform scales
- `BuyTicketDialog.tsx`: `window.location.reload()` in `TicketCard.tsx` — flag as anti-pattern, should use query invalidation instead
- `TicketCard.tsx`: `console.error(error)` — flag for removal in production (use structured logging)

## NEXT.JS APP ROUTER SPECIFIC

- Verify all pages using `useState`/`useEffect` have `"use client"` — they do, confirm no violations
- Check `layout.tsx`: `VT323` and `Press_Start_2P` fonts are loaded but search for their usage — if only used in one component, move font loading closer to that component
- `next.config.ts` is empty — flag if any config is needed (image domains, etc.)

## PONDER INDEXER SPECIFIC

- `indexer/src/TicketMarketplace.ts`: handler logic is clean, no changes needed
- `indexer/src/TicketNFT.ts`: handler logic is clean, no changes needed
- `indexer/ponder.config.ts`: fallback addresses are hardcoded — flag with `// ⚠️ REVIEW:` that these should always come from env in production
- `indexer/src/api/index.ts`: double-mounting graphql at both `/graphql` and `/` — flag if intentional or dead route

## CONSTRAINTS

- Do NOT change any smart contract interaction logic (ABI calls, parseUnits, keccak256 hashing of NIK)
- Do NOT change any wagmi hook call patterns
- Do NOT change UI copy, class names, or design tokens
- Do NOT refactor the GLSL shader in `Grainient.tsx`
- Preserve all exported function/hook names and their signatures
- If a change risks breaking on-chain behavior, flag with `// ⚠️ REVIEW:` instead of modifying

## OUTPUT FORMAT

For each file modified:

1. **Filename** (relative path from repo root)
2. **Changes made** (bullet points with reasoning)
3. **Cleaned code** (full file)

For risk flags only: show filename + the flagged line with `// ⚠️ REVIEW:` comment inline.

Final summary table:
| File | Changes Made | Risk Flags |
|------|-------------|------------|

## INPUT

Stack: TypeScript, Next.js 16 (App Router), wagmi v3, viem v2, Ponder ~0.16, Tailwind v4, shadcn/ui
Chain: Base Sepolia (testnet)
