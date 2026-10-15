# Instructions.md — Conventions for AI agents (reusable across projects)

> Read this **first** at the start of any session. This repo is "AI-first": the agent is the primary author and maintainer of the code, not a human.
>
> This file is project-neutral. It says **how** to organize, document, comment and keep continuity. It deliberately does **not** say **what** the folders are: that comes from the business of the project and the direction the user gives. Copy this file between projects unchanged.

## How this file fits with the others

| File                                           | Holds                                                                   | Changes                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| `instructions.md` (this file)                  | Conventions that hold in every project                                  | Rarely, and in every project at once            |
| `CLAUDE.md`                                    | What _this_ product is, scope, hard constraints (what must never be done) | When the product or its constraints change      |
| `docs/CODEMAP.md`, `DECISIONS.md`, `SESSION_LOG.md` | This project's memory (section 5)                                  | Every session                                   |
| `.claude/rules/agent-kit.md` (if present)      | Task flow: definition of done, protected paths, orchestration           | By the kit, not by hand                         |

If you are tempted to add a project-specific rule here, put it in `CLAUDE.md` instead, so this file stays copyable. If `agent-kit` is installed, its rules govern the task process (what "done" means, which paths are protected); this file governs how code and docs are written. They do not overlap.

---

## 1. Organizing principle: by business domain; the layout is decided per project

**Do not organize by technical layer** (`controllers/`, `services/`, `models/` spread across the whole repo — understanding one feature then means jumping through five folders).

**Organize by business domain.** Each domain is one self-contained folder holding everything related to it: logic, data access, types, tests, and its `README.md`. Illustrative only — the real names come from the project:

```
<source root>/
  orders/        # a business noun, not a layer
    ...
  billing/
    ...
  shared/        # genuinely shared infrastructure only
```

**This file does not fix the folder structure.** Derive it, at the start of the project and again whenever the direction changes, from:

1. the business nouns the user uses to describe the product,
2. what the stack requires (follow a framework's mandated layout where it has one, e.g. file-based routing directories, and group business logic by domain beneath or beside it),
3. the user's stated direction.

Record the chosen layout and the reasoning in `docs/CODEMAP.md` and `docs/DECISIONS.md`. Do not create empty domains "for later"; add a folder when there is something to put in it.

**Rule for splitting out a domain:** when a group of logic can be described by an independent business noun and can change without forcing changes in another domain, give it its own folder. If two domains always have to be edited together, the boundary may be drawn wrong; consider merging them.

**`shared/` is the exception, not the default.** Before putting anything there, ask: "does this carry business logic, or is it pure infrastructure (db client, logger, env, error types)?" If it carries business logic it belongs to a specific domain.

**When the business or direction changes, the structure may change with it.** Do the whole restructure in one session: move the code, update every affected `README.md`, update `CODEMAP.md`, and add a `DECISIONS.md` entry saying what changed and why. Never leave two layouts half-migrated, and never restructure silently.

---

## 2. Documentation: a README.md at every meaningful folder

Every domain folder (and every subfolder with a meaning of its own) **must have a `README.md`** that answers exactly these four questions. It does not need to be long; it needs to be on point. Do not add READMEs to trivial folders.

```markdown
# <Domain name>

## Purpose

What this folder does and which business need it serves.

## Why it is designed this way

Important architectural decisions and their reasoning. Do not restate the
code; explain "why A and not B".

## Links to other domains

Which domains this one calls / reads / is called by, and through what
(event, internal API, shared type).

## Read before changing

Constraints, gotchas and business rules a later agent could easily misread.
```

**Mandatory:** when you add a domain or change the architecture inside one, update its `README.md` **in the same session**, never in a later one. An out-of-date README is more dangerous than none.

---

## 3. Code comments: explain Why, not What

The code already says "what". A comment is valuable only when it says "why", especially for decisions that are not obvious from the code.

```js
// ❌ What (redundant, the code already says it)
// Loop through all customers and send the invoice
for (const customer of customers) {
  sendInvoice(customer);
}

// ✅ Why (real value) — illustrative
// Sent sequentially (not Promise.all): the payment provider rate-limits to
// 50 req/s and parallel batches got 429s once more than ~50 customers were
// due at the same time. See <incident or ticket link>.
for (const customer of customers) {
  await sendInvoice(customer);
}
```

This applies especially to:

- magic numbers and offsets that cannot explain themselves,
- trade-offs (choosing the slower but safer path, an older library for compatibility...),
- workarounds for bugs in an external library or platform.

Link to the incident, ticket or `DECISIONS.md` entry instead of writing a long story in the comment. Do not invent incidents or dates: cite only what exists.

---

## 4. Language: everything written into the repo is in one language

**Default: English.** Everything the agent writes into the repo is English, **including when the user talks to the agent in another language.** A project that needs a different repo language says so once in `CLAUDE.md` and then applies it everywhere; never mix.

| Must be in the repo language            | Not covered                |
| --------------------------------------- | -------------------------- |
| Comments in source files                | Conversation with the user |
| JSDoc / docstrings                      | Commit messages (team's choice) |
| `TODO` / `FIXME` notes                  |                            |
| Identifiers, log messages, error strings |                           |
| Every `README.md`, at every level       |                            |
| Every file under `docs/`                |                            |
| This file                               |                            |

The user may write in Vietnamese and the agent answers in Vietnamese. That is a conversation, not an artifact. The moment something is written to a file in this repo, it uses the repo language.

**Why:**

- **Comments sit inline with code.** Identifiers, library APIs and type names are English; switching script mid-line or mid-docblock is harder to scan than either language used consistently.
- **Search has to work across code and prose.** `grep -rn "<term>"` should find the constant, the function, the comment explaining it and the README documenting it in one pass. Splitting the vocabulary across two languages silently halves every search.
- **Repo text travels into places that mangle non-ASCII.** Stack traces, CI logs, git hooks, terminals and diff viewers do not reliably preserve diacritics.
- **One rule beats a boundary.** A line drawn between "English comments, other-language docs" needs constant policing, and a later agent will eventually "fix" the inconsistency in whichever direction the file in front of it points.

---

## 5. Session continuity: a later session recovers the previous one's context

Every agent session starts with an empty context. Nothing guarantees a new session understands an older session's decisions without reading the whole codebase (slow, and the reasoning behind a decision is easy to miss).

Three files in `docs/`, each with a different purpose. Their location and names are the same in every project; their content is the project's own.

### a) `docs/CODEMAP.md` — map of the current structure

The list of domains, a one-line purpose each, and the main entry point of each. It is the table of contents, so the agent does not grep the whole repo every session.

```markdown
# Code Map

| Domain | Purpose                          | Entry point          |
| ------ | -------------------------------- | -------------------- |
| orders | Create and track customer orders | <path to main file>  |
```

**Update it when** the domain structure changes (a domain is added, removed or renamed, or an entry point moves). Not for small changes inside one file.

### b) `docs/DECISIONS.md` — architectural decisions and reasoning (condensed ADR)

Record only decisions that are **hard to reverse, or easy to misunderstand and break** if the reasoning is unknown. Not every small change. The chosen folder layout (section 1) is one of them.

```markdown
## <YYYY-MM-DD> — <Decision in one line>

Reason: <why this and not the alternative>. Accepted trade-off: <what it costs>.
Related domain: <domain>
```

**Read it before** touching a domain that a recorded decision relates to: check whether `DECISIONS.md` has an entry tagged with that domain and read it before changing anything.

### c) `docs/SESSION_LOG.md` — a journal entry at the end of every session

Every session, **before finishing**, append a short paragraph yourself (a summary, not a log of every command):

```markdown
## <YYYY-MM-DD> — <What the session was about>

Done: <what changed>.
Decisions: <see DECISIONS.md entry, if any>.
Unfinished / needs the user: <open items, open questions, what you were waiting on>.
```

### Procedure for every session

1. Read `instructions.md` (this file).
2. Read `CLAUDE.md` for what this product is and its hard constraints.
3. Read `docs/CODEMAP.md` to know which domains exist and where.
4. Read the 3–5 most recent entries of `docs/SESSION_LOG.md` to know what was just done and what is unfinished.
5. If the task touches a domain with an entry in `docs/DECISIONS.md`, read that entry before changing anything.
6. At the end: update `CODEMAP.md` if the structure changed, and always append to `SESSION_LOG.md`.

This replaces re-reading the whole codebase every session. Open the code of the relevant domain only when you need to go deeper.

### First session in a new project

If the three files do not exist yet, create them as part of the first task:

1. From what the user told you about the business, propose a domain layout in a few lines. If the business boundaries are genuinely unclear, ask **one** focused question rather than guess; otherwise proceed and let the user object.
2. Create the domain folders that have content, each with its `README.md`.
3. Create `CODEMAP.md` (the layout), `DECISIONS.md` (an entry for the layout and the stack choice), and `SESSION_LOG.md` (the first entry).

---

## Wiring this into Claude Code

Claude Code reads `CLAUDE.md` automatically at the start of every session but does **not** read `instructions.md` on its own. For the procedure in section 5 to run every session without a manual reminder, `CLAUDE.md` must point here. Put this at its top:

```markdown
Read `instructions.md`, `docs/CODEMAP.md` and the 5 most recent entries of
`docs/SESSION_LOG.md` before starting any task in this repo.

If the task touches a domain, read its entry in `docs/DECISIONS.md` first.
```

With `agent-kit` installed, `.claude/rules/agent-kit.md` is loaded automatically, but it still does not load this file: keep the pointer in `CLAUDE.md` as well.

