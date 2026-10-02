# Medico Platform - Test Matrix & Traceability Matrix

| ID | Area | Scenario / Feature | Type | Status | Linked Bug IDs |
|---|---|---|---|---|---|
| **TM-J01-01** | Storefront / Home | Homepage loads with HTTP 200, no browser console errors | e2e | PASSED | |
| **TM-J01-02** | Storefront / Home | Promo bar, top announcement banner, and delivery pincode selector render | e2e | PASSED | |
| **TM-J01-03** | Storefront / Home | Category navigation circles (8 categories) navigate correctly | e2e | PASSED | |
| **TM-J01-04** | Storefront / Home | Featured and Best Sellers carousels (tabs, arrows, responsive swipe) | e2e | PASSED | |
| **TM-J01-05** | Storefront / Home | "Select a product" quick bar (category, brand, SKU filtering) | e2e | PASSED | |
| **TM-J01-06** | Storefront / Home | Trust marquee, FAQ accordion, testimonials, and footer links resolve | e2e | PASSED | BUG-004, BUG-005 |
| **TM-J02-01** | Search | Autocomplete dropdown returns matching products on keystrokes | e2e/api | PASSED | |
| **TM-J02-02** | Search | Search by salt / active composition (e.g., "Paracetamol", "Amoxicillin") | e2e/api | PASSED | |
| **TM-J02-03** | Search | Search by brand (e.g., "Cipla", "Sun Pharma") and SKU | e2e/api | PASSED | |
| **TM-J02-04** | Search | Fuzzy search handles typos gracefully | e2e/api | PASSED | |
| **TM-J02-05** | Search | Empty results state displayed with clear messaging | e2e | PASSED | |
| **TM-J02-06** | Search | Query with special characters and long inputs handled safely | security/api | PASSED | |
| **TM-J03-01** | Catalog / Listing | Filter by category, brand, and in-stock items | e2e/api | PASSED | |
| **TM-J03-02** | Catalog / Listing | Filter by in-stock items (excludes 0 qty & expired batches) | e2e/api | PASSED | |
| **TM-J03-03** | Catalog / Listing | Filter by price range (min/max price inputs) | e2e/api | PASSED | |
| **TM-J03-04** | Catalog / Listing | Sort by price (low-to-high, high-to-low), newest, and featured | e2e/api | PASSED | BUG-001 |
| **TM-J03-05** | Catalog / Listing | Pagination / pagination bounds handling | e2e/api | PASSED | |
| **TM-J03-06** | Catalog / Listing | Filter state synchronized with browser URL (reload & back button) | e2e | PASSED | |
| **TM-J03-07** | Catalog / Listing | Zero-result filter state displays reset filters action | e2e | PASSED | |
| **TM-J04-01** | Product Detail | Product detail page renders title, composition, manufacturer, HSN, GST | e2e | PASSED | |
| **TM-J04-02** | Product Detail | Image gallery display and thumbnail switching | e2e | PASSED | |
| **TM-J04-03** | Product Detail | Variant switch updates price, MRP, pack size, stock, and SKU | e2e | PASSED | |
| **TM-J04-04** | Product Detail | Out-of-stock badge and button disabling when available stock is 0 | e2e | PASSED | |
| **TM-J04-05** | Product Detail | Salt-based substitute recommendations displayed on PDP | e2e/api | PASSED | BUG-003 |
| **TM-J04-06** | Product Detail | Pincode delivery serviceability check (valid vs invalid pincode) | e2e | PASSED | |
| **TM-J04-07** | Product Detail | Add to Cart and Add to Wishlist actions from PDP | e2e | PASSED | |
| **TM-J04-08** | Product Detail | 404 page rendered for non-existent product slug | e2e | PASSED | |
| **TM-J05-01** | Cart | Add item to cart, increment quantity, decrement quantity, remove item | e2e/api | PASSED | |
| **TM-J05-02** | Cart | Stock capping: quantity increment blocked beyond available FEFO stock | e2e/api | PASSED | |
| **TM-J05-03** | Cart | Cart persistence across page reloads and cross-tab storage | e2e | PASSED | |
| **TM-J05-04** | Cart | Coupon validation: valid coupon applied (flat & percentage) | e2e/api | PASSED | |
| **TM-J05-05** | Cart | Price breakdown math: Item MRP, Discount, Subtotal, GST, Delivery Fee | unit/api | PASSED | |
| **TM-J05-06** | Cart | Free shipping threshold (orders >= ₹500 free, else ₹40 delivery fee) | unit/e2e | PASSED | |
| **TM-J07-01** | Checkout | Address selection from saved addresses or inline new address creation | e2e | PASSED | |
| **TM-J07-02** | Checkout | Delivery slot selection (Morning, Evening, Standard Next-Day) | e2e | PASSED | |
| **TM-J07-03** | Checkout | Payment method selection (Razorpay Online vs Cash on Delivery) | e2e | PASSED | |
| **TM-J07-04** | Checkout | Order summary and charges match cart breakdown down to the exact rupee | e2e/api | PASSED | |
| **TM-J08-01** | Payments / Razorpay | Razorpay order creation (`/api/payments/create-order`) | api | PASSED | |
| **TM-J08-02** | Payments / Razorpay | Payment verification with timing-safe HMAC signature verification | security/api | PASSED | |
| **TM-J08-03** | Payments / Razorpay | Signature tampering rejection (altered payment_id, order_id, signature) | security/api | PASSED | |
| **TM-J08-04** | Payments / Razorpay | Client-side amount tamper rejection (server recomputes total) | security/api | PASSED | |
| **TM-J08-05** | Payments / Razorpay | Signed webhook simulation (`payment.captured`, `payment.failed`) | api | PASSED | BUG-008 |
| **TM-J08-06** | Payments / Razorpay | Webhook idempotency (duplicate webhook deliveries processed once) | api | PASSED | |
| **TM-J08-07** | Payments / Razorpay | Razorpay test mode assertion: live keys strictly rejected | security/api | PASSED | |
| **TM-J09-01** | Payments / COD | Cash on Delivery placement and order status set to PLACED | e2e/api | PASSED | |
| **TM-J10-01** | Prescriptions | Legacy prescription service | e2e/api | REMOVED | User directive: purge prescription code & DB models |
| **TM-J11-01** | Orders | Order confirmation page with order number, delivery slot, and address | e2e | PASSED | |
| **TM-J11-02** | Orders | Order history list shows past orders and status badges | e2e | PASSED | |
| **TM-J11-03** | Orders | Order detail page with timeline progression | e2e | PASSED | |
| **TM-J11-04** | Orders | GST Tax Invoice PDF generation and download with matching numbers | e2e/api | PASSED | |
| **TM-J12-01** | Wishlist | Wishlist item addition, rendering, and removal | e2e | PASSED | |
| **TM-J13-01** | Diagnostics / Labs | Legacy lab tests service | e2e/api | REMOVED | User directive: purge labs code & DB models |
| **TM-J14-01** | Telehealth / Doctors | Legacy consultation service | e2e/api | REMOVED | User directive: purge consultation code & DB models |
| **TM-J16-01** | Static Pages | About, Contact, FAQs, Privacy, Terms, Refund, Shipping render without error | e2e | PASSED | BUG-004 |
| **TM-J17-01** | Responsive / Cross-Browser | Desktop 1440px layout integrity and sticky header | e2e | PASSED | |
| **TM-J17-02** | Responsive / Cross-Browser | Tablet 820px layout, navigation drawer, and touch targets | e2e | PASSED | |
| **TM-J17-03** | Responsive / Cross-Browser | Mobile 390px hamburger menu, sticky bottom bar, and no horizontal scroll | e2e | PASSED | |
| **TM-J17-04** | Responsive / Cross-Browser | Cross-browser execution across Chromium, Firefox, and WebKit | e2e | PASSED | |
| **TM-API-01** | API Authorization | IDOR checks on orders, addresses, invoices | api/security | PASSED | |
| **TM-API-02** | API Authorization | Role-based access control: customer blocked from admin routes | api/security | PASSED | BUG-002 |
| **TM-INV-01** | Inventory & FEFO | FEFO batch allocation: earliest expiring batch deducted first | api/unit | PASSED | |
| **TM-INV-02** | Inventory & FEFO | Expired batches strictly skipped during checkout | api | PASSED | |
| **TM-INV-03** | Inventory & FEFO | 50 concurrent checkouts for 5 remaining units race test: 0 oversell | perf/race | PASSED | BUG-009 |
| **TM-A11Y-01** | Accessibility | Axe-core WCAG 2.1 AA audit on Home, Catalog, PDP, Checkout (0 critical) | a11y | PASSED | |
| **TM-PERF-01** | Performance | In-memory cache eliminates Sydney roundtrip latency (<5ms catalog response) | perf | PASSED | BUG-010 |
| **TM-PHARM-01** | Pharmacy Compliance | Drug licence number, GSTIN, and pharmacist details in footer & invoice | compliance | PASSED | BUG-005 |
| **TM-PHARM-02** | Pharmacy Compliance | HSN code and CGST/SGST vs IGST tax split verified | compliance/unit | PASSED | |
