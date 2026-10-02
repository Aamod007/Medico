# Changelog

All notable changes to the Medico digital pharmacy platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-02 (Handover Release)

### Added
- **Centralized Brand Architecture**: Unified `BRAND_CONFIG` in `@medico/shared` managing legal entity names, GSTIN, Drug License numbers (`KA-BLR-2024-00129`), support channels, and address.
- **Client Documentation Suite**:
  - `docs/ARCHITECTURE.md`: Complete system topology, Mermaid data flow diagrams, and tech stack specifications.
  - `docs/ENVIRONMENT.md`: Exhaustive environment variable dictionary with security tiers and rotation runbooks.
  - `docs/DEPLOYMENT.md`: Step-by-step production deployment instructions for Vercel, Railway, Supabase, and Docker.
  - `docs/RUNBOOK.md`: Incident handling procedures, staff provisioning, database backup/recovery commands.
  - `docs/DATABASE.md`: Schema ERD, key invariants, and migration conventions.
  - `docs/CONTRIBUTING.md`: Branching strategy, Conventional Commits, code standards, and quality gates.
  - `docs/THIRD_PARTY_LICENSES.md`: Commercial permissiveness verification of all open-source packages.
- **Standardized Developer Configuration**:
  - Added `.editorconfig`, `.prettierrc`, and `.gitattributes` (enforcing LF line endings).
  - Pinned runtime Node.js version via `.nvmrc` (Node 20 LTS).
  - Added `"typecheck": "tsc --noEmit"` to `@medico/web`.

### Changed
- **Security Hardening**:
  - Refactored 18 Next.js API route handlers to use centralized `@/lib/supabase` helper, eliminating all hardcoded fallback keys.
  - Enforced strict environment variable validation for Razorpay key IDs, secrets, and webhooks with active production safeguards.
  - Removed unmounted debug webhook replay routes.
  - Container multi-stage builds updated to execute as unprivileged `node` user.
- **Dependency Cleanliness**:
  - Removed unused root `@lhci/cli` dependency, resolving all 17 high-severity audit vulnerabilities.
  - Removed unused UI libraries from `@medico/web` (`@tanstack/react-query`, `react-hook-form`, `recharts`).
  - Reclassified development tooling into `devDependencies`.
- **Code & Asset Hygiene**:
  - Removed 27 one-off scratch scripts, test dumps, and temporary migration notes.
  - Relocated QA test reports and bug matrices to `docs/qa/`.
  - Removed freelancer personal attribution from public footer and metadata.
  - Replaced prototype placeholder profiles with localized customer copy.

### Fixed
- Idempotency in Razorpay payment webhook ingestion preventing duplicate fulfillment.
- Database consistency invariants engine verifying zero negative stock and accurate GST calculations.
