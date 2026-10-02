# Medico Platform - Test Matrix & Traceability Matrix

| ID | Area | Scenario / Feature | Type | Status | Linked Bug IDs |
|---|---|---|---|---|---|
| **TM-J01-01** | Storefront / Home | Homepage loads with HTTP 200, no browser console errors | e2e | PENDING | |
| **TM-J01-02** | Storefront / Home | Promo bar, top announcement banner, and delivery pincode selector render | e2e | PENDING | |
| **TM-J01-03** | Storefront / Home | Category navigation circles (8 categories) navigate correctly | e2e | PENDING | |
| **TM-J01-04** | Storefront / Home | Featured and Best Sellers carousels (tabs, arrows, responsive swipe) | e2e | PENDING | |
| **TM-J01-05** | Storefront / Home | "Select a product" quick bar (category, brand, SKU filtering) | e2e | PENDING | |
| **TM-J01-06** | Storefront / Home | Trust marquee, FAQ accordion, testimonials, and footer links resolve (no 404s) | e2e | PENDING | BUG-002 |
| **TM-J02-01** | Search | Autocomplete dropdown returns matching products on keystrokes | e2e/api | PENDING | |
| **TM-J02-02** | Search | Search by salt / active composition (e.g., "Paracetamol", "Amoxicillin") | e2e/api | PENDING | |
| **TM-J02-03** | Search | Search by brand (e.g., "Cipla", "Sun Pharma") and SKU | e2e/api | PENDING | |
| **TM-J02-04** | Search | Fuzzy search handles typos gracefully | e2e/api | PENDING | |
| **TM-J02-05** | Search | Empty results state displayed with clear messaging | e2e | PENDING | |
| **TM-J02-06** | Search | Query with special characters, 1000+ chars, and XSS payload handled safely | security/api | PENDING | |
| **TM-J03-01** | Catalog / Listing | Filter by category, brand, and prescriptionRequired (Rx) | e2e/api | PENDING | |
| **TM-J03-02** | Catalog / Listing | Filter by in-stock items (excludes 0 qty & expired batches) | e2e/api | PENDING | |
| **TM-J03-03** | Catalog / Listing | Filter by price range (min/max price slider/inputs) | e2e/api | PENDING | |
| **TM-J03-04** | Catalog / Listing | Sort by price (low-to-high, high-to-low), newest, and featured | e2e/api | PENDING | BUG-001 |
| **TM-J03-05** | Catalog / Listing | Pagination / pagination bounds handling | e2e/api | PENDING | |
| **TM-J03-06** | Catalog / Listing | Filter state synchronized with browser URL (reload & back button) | e2e | PENDING | |
| **TM-J03-07** | Catalog / Listing | Zero-result filter state displays reset filters action | e2e | PENDING | |
| **TM-J04-01** | Product Detail | Product detail page renders title, composition, manufacturer, HSN, GST | e2e | PENDING | |
| **TM-J04-02** | Product Detail | Image gallery zoom and thumbnail switching | e2e | PENDING | |
| **TM-J04-03** | Product Detail | Variant switch updates price, MRP, pack size, stock, and SKU | e2e | PENDING | |
| **TM-J04-04** | Product Detail | Rx Prescription Required badge displayed prominently for Schedule H/H1/X | e2e | PENDING | |
| **TM-J04-05** | Product Detail | Out-of-stock badge and button disabling when available stock is 0 | e2e | PENDING | |
| **TM-J04-06** | Product Detail | Salt-based substitute recommendations displayed on PDP | e2e/api | PENDING | BUG-003 |
| **TM-J04-07** | Product Detail | Pincode delivery serviceability check (valid vs invalid pincode) | e2e | PENDING | |
| **TM-J04-08** | Product Detail | Add to Cart and Add to Wishlist actions from PDP | e2e | PENDING | |
| **TM-J04-09** | Product Detail | 404 page rendered for non-existent product slug | e2e | PENDING | |
| **TM-J05-01** | Auth | User registration with name, email, phone, password | e2e/api | PENDING | |
| **TM-J05-02** | Auth | User login with password & JWT token issuance (httpOnly cookies) | e2e/api | PENDING | |
| **TM-J05-03** | Auth | Login rejection on wrong password, nonexistent account | e2e/api | PENDING | |
| **TM-J05-04** | Auth | Phone OTP sending, verification, resend limits, and expiry | e2e/api | PENDING | |
| **TM-J05-05** | Auth | Rate limiting on authentication attempts (brute force protection) | security/api | PENDING | |
| **TM-J05-06** | Auth | Refresh token rotation and session revocation on logout | security/api | PENDING | |
| **TM-J05-07** | Auth | Guest session cart automatically merges into user cart upon login | e2e/api | PENDING | |
| **TM-J06-01** | Cart | Add item to cart, increment quantity, decrement quantity, remove item | e2e/api | PENDING | |
| **TM-J06-02** | Cart | Stock capping: quantity increment blocked beyond available FEFO stock | e2e/api | PENDING | |
| **TM-J06-03** | Cart | Cart persistence across page reloads and cross-tab storage | e2e | PENDING | |
| **TM-J06-04** | Cart | Coupon validation: valid coupon applied (flat & percentage) | e2e/api | PENDING | |
| **TM-J06-05** | Cart | Coupon rejection: expired coupon, below min order value, max usages reached | e2e/api | PENDING | |
| **TM-J06-06** | Cart | Price breakdown math: Item MRP, Discount, Subtotal, GST, Delivery Fee | unit/api | PENDING | |
| **TM-J06-07** | Cart | Free shipping threshold (orders >= ₹500 free, else ₹40 delivery fee) | unit/e2e | PENDING | |
| **TM-J06-08** | Cart | Rx medicine warning banner shown in cart when Rx items are present | e2e | PENDING | |
| **TM-J07-01** | Checkout | Address selection from saved addresses or inline new address creation | e2e | PENDING | |
| **TM-J07-02** | Checkout | Delivery slot selection (Morning, Evening, Standard Next-Day) | e2e | PENDING | |
| **TM-J07-03** | Checkout | Payment method selection (Razorpay Online vs Cash on Delivery) | e2e | PENDING | |
| **TM-J07-04** | Checkout | Order summary and charges match cart breakdown down to the exact rupee | e2e/api | PENDING | |
| **TM-J08-01** | Payments / Razorpay | Razorpay order creation (`/api/create-order` or `/api/payments/razorpay/create-order`) | api | PENDING | |
| **TM-J08-02** | Payments / Razorpay | Payment verification with timing-safe HMAC signature verification | security/api | PENDING | |
| **TM-J08-03** | Payments / Razorpay | Signature tampering rejection (altered payment_id, order_id, signature) | security/api | PENDING | |
| **TM-J08-04** | Payments / Razorpay | Client-side amount tamper rejection (server recomputes total) | security/api | PENDING | |
| **TM-J08-05** | Payments / Razorpay | Signed webhook simulation (`order.paid`, `payment.failed`, `payment.authorized`) | api | PENDING | |
| **TM-J08-06** | Payments / Razorpay | Webhook idempotency (duplicate webhook deliveries processed once) | api | PENDING | |
| **TM-J08-07** | Payments / Razorpay | Arrival order robustness: webhook before verify vs verify before webhook | api | PENDING | |
| **TM-J08-08** | Payments / Razorpay | Razorpay test mode assertion: live keys strictly rejected | security/api | PENDING | |
| **TM-J09-01** | Payments / COD | Cash on Delivery placement and order status set to PLACED | e2e/api | PENDING | |
| **TM-J09-02** | Payments / COD | COD rules and limits enforcement | api | PENDING | |
| **TM-J10-01** | Prescriptions | Prescription file upload (valid JPEG/PNG/PDF up to 10MB) | e2e/api | PENDING | |
| **TM-J10-02** | Prescriptions | Upload rejection on invalid mime type, >10MB, zero-byte file, double extension | security/api | PENDING | |
| **TM-J10-03** | Prescriptions | Order with Rx drug requires prescription attachment or moves to PENDING_RX | e2e/api | PENDING | |
| **TM-J10-04** | Prescriptions | Pharmacist prescription review queue: approve or reject with reason | e2e/api | PENDING | |
| **TM-J10-05** | Prescriptions | IDOR protection: User A cannot view or attach User B's prescriptions | security/api | PENDING | |
| **TM-J11-01** | Orders | Order confirmation page with order number, delivery slot, and address | e2e | PENDING | |
| **TM-J11-02** | Orders | Order history list shows past orders and status badges | e2e | PENDING | |
| **TM-J11-03** | Orders | Order detail page with timeline progression (Placed -> Confirmed -> Packed -> Shipped -> Delivered) | e2e | PENDING | |
| **TM-J11-04** | Orders | Order cancellation allowed before shipping, blocked after shipping | e2e/api | PENDING | |
| **TM-J11-05** | Orders | GST Tax Invoice PDF generation and download with matching numbers | e2e/api | PENDING | |
| **TM-J11-06** | Orders | Order state machine: invalid status transitions rejected | api | PENDING | |
| **TM-J12-01** | Account | Profile viewing & editing (name, phone, email) | e2e/api | PENDING | |
| **TM-J12-02** | Account | Address book management (add, edit, delete, set default) | e2e/api | PENDING | |
| **TM-J12-03** | Account | Saved prescriptions list and upload history | e2e | PENDING | |
| **TM-J12-04** | Account | Wishlist item removal and move to cart | e2e | PENDING | |
| **TM-J13-01** | Diagnostics / Labs | Diagnostic lab tests catalog browsing with parameters & fasting info | e2e/api | PENDING | |
| **TM-J13-02** | Diagnostics / Labs | Book home sample collection slot with patient details | e2e/api | PENDING | |
| **TM-J13-03** | Diagnostics / Labs | Lab booking history & report download | e2e/api | PENDING | |
| **TM-J14-01** | Telehealth / Doctors | Doctor directory browsing with specialization, qualification, fee | e2e/api | PENDING | |
| **TM-J14-02** | Telehealth / Doctors | Consultation slot booking and double-booking prevention | e2e/api | PENDING | |
| **TM-J14-03** | Telehealth / Doctors | Appointment history and cancellation | e2e/api | PENDING | |
| **TM-J15-01** | Reviews | Verified buyer review submission with rating & text | e2e/api | PENDING | |
| **TM-J15-02** | Reviews | Non-buyer review rejection and duplicate review prevention | api | PENDING | |
| **TM-J15-03** | Reviews | XSS sanitization in user review text | security/api | PENDING | |
| **TM-J16-01** | Static Pages | About, Contact, FAQs, Privacy, Terms pages render without error | e2e | PENDING | |
| **TM-J16-02** | Static Pages | Contact form submission with validation and rate limiting | e2e/api | PENDING | |
| **TM-J16-03** | Static Pages | 404 Not Found and 500 error page handling | e2e | PENDING | |
| **TM-J17-01** | Responsive / Cross-Browser | Desktop 1440px layout integrity and sticky header | e2e | PENDING | |
| **TM-J17-02** | Responsive / Cross-Browser | Tablet 820px layout, navigation drawer, and touch targets | e2e | PENDING | |
| **TM-J17-03** | Responsive / Cross-Browser | Mobile 390px hamburger menu, sticky bottom bar, and no horizontal scroll | e2e | PENDING | |
| **TM-J17-04** | Responsive / Cross-Browser | Cross-browser execution across Chromium, Firefox, and WebKit | e2e | PENDING | |
| **TM-API-01** | API Robustness | Input validation, oversized body rejection, SQL injection defense | api/security | PENDING | |
| **TM-API-02** | API Authorization | IDOR checks on orders, addresses, prescriptions, invoices | api/security | PENDING | |
| **TM-API-03** | API Authorization | Role-based access control: customer blocked from admin/pharmacist routes | api/security | PENDING | BUG-004 |
| **TM-INV-01** | Inventory & FEFO | FEFO batch allocation: earliest expiring batch deducted first | api/unit | PENDING | |
| **TM-INV-02** | Inventory & FEFO | Expired batches strictly skipped during checkout | api | PENDING | |
| **TM-INV-03** | Inventory & FEFO | 50 concurrent checkouts for 5 remaining units race test: 0 oversell | perf/race | PENDING | |
| **TM-A11Y-01** | Accessibility | Axe-core accessibility scan on Home, Catalog, PDP, Cart, Checkout | a11y | PENDING | |
| **TM-PERF-01** | Performance | Lighthouse CI audit on Home, Listing, PDP, Cart, Checkout | perf | PENDING | |
| **TM-SEC-01** | Security | Security headers, CORS, cookie flags, npm audit vulnerability scan | security | PENDING | |
| **TM-PHARM-01** | Pharmacy Compliance | Drug licence number, GSTIN, and pharmacist details in footer & invoice | compliance | PENDING | BUG-005 |
| **TM-PHARM-02** | Pharmacy Compliance | HSN code and CGST/SGST vs IGST tax split verified | compliance/unit | PENDING | |
