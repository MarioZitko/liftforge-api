# Phase <N> — <short phase name>

<One or two sentences: what this phase delivers and why it's being done now.>

## Reconciliation notes — read first

<Delete this section if nothing has drifted since these tickets were written. Otherwise: state
what changed and why, so a session picking this up cold doesn't act on a stale assumption.>

## Build order

<e.g. `Issue 80` → (`Issue 81` ‖ `Issue 82`) → `Issue 83` last. Omit if tickets are independent.>

---

## <N> - [BE] - <ticket title>

**Why:** <1-3 sentences of motivation/context.>

**Depends on:** <another issue in this phase, a liftforge-web ticket, or "none".>

**Module pattern:** <"new domain — proper @Module" | "extends the loose <name> module — follow its
existing pattern">

### Files to touch

- `src/modules/<name>/<name>.service.ts` — <what changes>
- `src/modules/<name>/dto/create-<name>.dto.ts` — new/changed, <shape>

### Endpoints

| Verb | Route | Body/Query | Returns |
|---|---|---|---|
| GET | `/<resource>` | | `<Name>Dto[]` |

### Ownership / RBAC

<State explicitly: does this endpoint need a coach/client ownership check? Which roles?>

### Definition of Done

- [ ] <concrete, verifiable condition>
- [ ] Ownership check in place if the resource is coach/client-scoped
- [ ] Multi-write sequences wrapped in `$transaction` if applicable
- [ ] `.spec.ts` provides real or deliberately-mocked dependencies
- [ ] `npm run lint` clean (verify it actually runs on your checkout first — see
  [`.claude/docs/04-refactor-backlog.md`](../.claude/docs/04-refactor-backlog.md) item 4)

---

_(repeat `## Issue <N> — ...` per ticket)_
