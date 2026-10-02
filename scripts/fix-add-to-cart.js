const fs = require('fs');

// 1. Fix homepage - pass product details to addItem
let homepage = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');
homepage = homepage.replace(
  /onClick=\{.*?defVariant && addItem\(defVariant\.id\)\}/g,
  `onClick={() => defVariant && addItem(defVariant.id, 1, {
                        productId: p.id,
                        productName: p.name,
                        productSlug: p.slug,
                        image: p.images?.[0] || "",
                        packSize: defVariant.packSize || defVariant.name || "Standard Pack",
                        price: defVariant.price,
                        mrp: defVariant.mrp || defVariant.price,
                      })}`
);
fs.writeFileSync('apps/web/src/app/page.tsx', homepage);
console.log('Fixed homepage addItem calls');

// 2. Fix products page - pass product details to addItem
let productsPage = fs.readFileSync('apps/web/src/app/products/page.tsx', 'utf8');
productsPage = productsPage.replace(
  /onClick=\{.*?defVariant && addItem\(defVariant\.id\)\}/g,
  `onClick={() => defVariant && addItem(defVariant.id, 1, {
                        productId: p.id,
                        productName: p.name,
                        productSlug: p.slug,
                        image: p.images?.[0] || "",
                        packSize: defVariant.packSize || defVariant.name || "Standard Pack",
                        price: defVariant.price,
                        mrp: defVariant.mrp || defVariant.price,
                      })}`
);
fs.writeFileSync('apps/web/src/app/products/page.tsx', productsPage);
console.log('Fixed products page addItem calls');

// 3. Fix product detail page - pass product details to addItem
let pdp = fs.readFileSync('apps/web/src/app/products/[slug]/page.tsx', 'utf8');
pdp = pdp.replace(
  /onClick=\{.*?selectedVariant && addItem\(selectedVariant\.id, quantity\)\}/g,
  `onClick={() => selectedVariant && addItem(selectedVariant.id, quantity, {
                        productId: product.id,
                        productName: product.name,
                        productSlug: product.slug,
                        image: product.images?.[0] || "",
                        packSize: selectedVariant.packSize || selectedVariant.name || "Standard Pack",
                        price: selectedVariant.price,
                        mrp: selectedVariant.mrp || selectedVariant.price,
                      })}`
);
fs.writeFileSync('apps/web/src/app/products/[slug]/page.tsx', pdp);
console.log('Fixed PDP addItem calls');

console.log('All addItem calls updated with product details.');
