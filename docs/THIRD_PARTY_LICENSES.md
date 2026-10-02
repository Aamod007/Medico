# Third-Party Software Licenses Summary

All third-party dependencies used in the **Medico** platform have been audited for commercial distribution compliance. Every dependency uses an open-source, commercially permissive license (such as MIT, Apache-2.0, ISC, or BSD). There are **no GPL, AGPL, or restrictive copyleft dependencies** that would encumber proprietary commercial use or require client source disclosure.

---

## 1. Monorepo Root Dependencies

| Package | Version | License | Usage | Commercial Use Permitted |
|---|---|---|---|:---:|
| `@axe-core/playwright` | ^4.13.0 | MPL-2.0 | Automated accessibility QA testing | Yes |
| `@playwright/test` | ^1.63.0 | Apache-2.0 | End-to-end browser test runner | Yes |
| `@types/supertest` | ^7.2.1 | MIT | TypeScript type definitions | Yes |
| `autocannon` | ^8.0.0 | MIT | HTTP benchmark testing tool | Yes |
| `concurrently` | ^10.0.5 | MIT | Development process orchestration | Yes |
| `prettier` | ^3.3.3 | MIT | Code formatting | Yes |
| `supertest` | ^7.3.0 | MIT | Integration HTTP assertions | Yes |
| `typescript` | ^5.5.4 | Apache-2.0 | TypeScript compiler & language tools | Yes |

---

## 2. Storefront Web App (`@medico/web`)

| Package | Version | License | Usage | Commercial Use Permitted |
|---|---|---|---|:---:|
| `@clerk/nextjs` | ^7.9.8 | MIT | Authentication & Session Management | Yes |
| `@devzoy/indian-pincode` | ^2.1.0 | MIT | Offline Indian Postal Code lookup & resolution | Yes |
| `clsx` | ^2.1.1 | MIT | Dynamic class string generation | Yes |
| `lucide-react` | ^0.441.0 | ISC | Vector icon components | Yes |
| `next` | ^14.2.15 | MIT | React Production Web Framework | Yes |
| `react` | ^18.3.1 | MIT | UI Component Library | Yes |
| `react-dom` | ^18.3.1 | MIT | DOM rendering engine for React | Yes |
| `tailwind-merge` | ^2.5.2 | MIT | Tailwind class conflict resolution | Yes |
| `zod` | ^3.23.8 | MIT | Schema validation & type inference | Yes |
| `zustand` | ^4.5.5 | MIT | Client state management (cart, wishlist) | Yes |
| `autoprefixer` | ^10.4.20 | MIT | CSS vendor prefixing | Yes |
| `eslint` | ^8.57.1 | MIT | Static code analysis | Yes |
| `eslint-config-next` | ^14.2.35 | MIT | Next.js linting configuration | Yes |
| `postcss` | ^8.4.45 | MIT | CSS transformation pipeline | Yes |
| `tailwindcss` | ^3.4.11 | MIT | Utility-first CSS framework | Yes |

---

## 3. Backend API (`@medico/api`)

| Package | Version | License | Usage | Commercial Use Permitted |
|---|---|---|---|:---:|
| `@prisma/client` | ^5.19.1 | Apache-2.0 | PostgreSQL database client ORM | Yes |
| `bcryptjs` | ^2.4.3 | MIT | Password hashing & verification | Yes |
| `cookie-parser` | ^1.4.6 | MIT | HTTP Cookie serialization middleware | Yes |
| `cors` | ^2.8.5 | MIT | Cross-Origin Resource Sharing middleware | Yes |
| `dotenv` | ^16.4.5 | BSD-2-Clause | Environment variable management | Yes |
| `express` | ^4.19.2 | MIT | Fast, unopinionated web framework | Yes |
| `express-rate-limit` | ^7.4.0 | MIT | API brute force & rate limiting | Yes |
| `helmet` | ^7.1.0 | MIT | Security HTTP headers middleware | Yes |
| `ioredis` | ^5.4.1 | MIT | High-performance Redis client | Yes |
| `jsonwebtoken` | ^9.0.2 | MIT | JWT token issuance and signature verification | Yes |
| `nodemailer` | ^6.9.15 | MIT-0 | Email notification dispatch | Yes |
| `pdfkit` | ^0.15.0 | MIT | Server-side GST invoice PDF generation | Yes |
| `razorpay` | ^2.9.4 | MIT | Official Razorpay Payment SDK | Yes |
| `zod` | ^3.23.8 | MIT | Runtime API input validation schemas | Yes |
| `prisma` | ^5.19.1 | Apache-2.0 | Database migration & introspection CLI | Yes |
| `tsx` | ^4.19.0 | MIT | TypeScript execution engine | Yes |

---

## 4. Fonts and Media Assets

* **Fonts**: Outfit, Inter, and system sans-serif fonts served via Google Fonts under the **SIL Open Font License (OFL 1.1)**, allowing commercial usage, bundling, and distribution.
* **Icons**: Lucide Icons licensed under the **ISC License** (fully permissive open source).
