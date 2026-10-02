# Medico Bug Tracker & Remediation Log

| Bug ID | Severity | Area | Summary | Root Cause (file:line) | Status | Commit / Fix Ref |
|---|---|---|---|---|---|---|
| BUG-000 | P2 | Build/Lint | `npm run lint` failed due to missing ESLint config & packages in `apps/web` | `apps/web/.eslintrc.json` missing, causing interactive CLI prompt hang | FIXED | `fix(build): BUG-000 configure ESLint for apps/web` |
| BUG-001 | P2 | Catalog API | Catalog sort by price (`price_asc`/`price_desc`) sorts by variant count instead of price | `apps/api/src/modules/catalog/catalog.controller.ts:100` | OPEN | Scheduled in Phase 3 |

---

## Detailed Bug Reports

### BUG-000: Missing ESLint in apps/web causes interactive prompt hang during `npm run lint`
- **Severity**: P2
- **Area**: Build & Tooling
- **Steps to reproduce**: Run `npm run lint` across monorepo.
- **Expected**: Automated non-interactive linting completes with code 0 or lint error reports.
- **Actual**: `apps/web` prompted interactively: `How would you like to configure ESLint?`, failing CI/build pipelines.
- **Root Cause**: `apps/web/package.json` lacked `eslint` and `eslint-config-next`, and no `.eslintrc.json` was present.
- **Fix**: Installed `eslint` and `eslint-config-next` in `apps/web` and created `apps/web/.eslintrc.json` extending `next/core-web-vitals`.
- **Status**: FIXED
