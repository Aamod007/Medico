# Contributing & Engineering Standards

Welcome to the Medico engineering codebase. To maintain software reliability, compliance readiness, and code uniformity across all teams, please adhere to the following conventions and quality gates.

---

## 1. Branching Strategy

- **`main`**: Production-ready branch. All commits on `main` must pass all CI checks and be deployable to production.
- **Feature Branches**:
  - `feat/feature-name`: New functional capabilities or endpoints.
  - `fix/bug-description`: Bug fixes and defect remediations.
  - `chore/task-name`: Dependency updates, tooling, refactoring, and documentation.
  - `perf/optimization`: Performance improvements and query indexing.

---

## 2. Commit Message Conventions

We enforce [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short imperative description>

[optional body explaining rationale]
```

### Allowed Types
- **`feat`**: A new feature for users or API consumers.
- **`fix`**: A bug fix.
- **`docs`**: Documentation updates or additions.
- **`chore`**: Maintenance, package updates, tooling changes.
- **`refactor`**: Code restructuring without functional behavior changes.
- **`perf`**: Performance optimizations.
- **`test`**: Adding or refactoring test suites.

### Examples
- `feat(cart): add pincode-based cold-chain delivery estimate`
- `fix(checkout): prevent zero-quantity cart submissions`
- `chore(deps): update prisma to v5.19.1`

---

## 3. Code Style & Formatting

- **Formatting**: Enforced via Prettier (`.prettierrc`) with 2-space indentation, double quotes, semicolons, and trailing commas.
- **Line Endings**: LF line endings enforced across all operating systems via `.gitattributes`.
- **Linting**: ESLint configured for Next.js and TypeScript standards.
- Run formatting and linting:
  ```bash
  npm run lint
  npx prettier --write .
  ```

---

## 4. Pre-Commit Quality Gates

Before opening a Pull Request or pushing code, every engineer must verify that the monorepo passes the standard four-point verification suite:

```bash
# 1. Typecheck all workspaces (zero errors allowed)
npm run typecheck

# 2. Lint all workspaces (zero warnings/errors)
npm run lint

# 3. Verify Database Invariants (15/15 invariants must pass)
npm run test:consistency

# 4. Run API Security & Concurrency Test Suites
npm run test:api
```

---

## 5. Pull Request Guidelines

1. **Keep PRs Focused**: One concern per PR. Avoid bundling stylistic refactors with functional changes.
2. **Include Tests**: Any bug fix must include an accompanying regression test. Any new API endpoint must include unit/integration coverage.
3. **Green CI**: All GitHub Actions checks must be green before requesting review.
4. **No Secrets**: Ensure no API keys, private passwords, or local `.env` values are committed.
