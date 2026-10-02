const fs = require('fs');

let pdp = fs.readFileSync('apps/web/src/app/products/[slug]/page.tsx', 'utf8');
pdp = pdp.replace(
  'setSelectedImage(res.data.images?.[0] || "");',
  `setSelectedImage(res.data.images?.[0] || "");
        try {
          const subRes = await api.get('/catalog/products/' + slug + '/substitutes');
          if (subRes.success && subRes.data) setSubstitutes(subRes.data);
        } catch(e) {}`
);
fs.writeFileSync('apps/web/src/app/products/[slug]/page.tsx', pdp, 'utf8');
console.log('PDP substitutes fetch added cleanly');
