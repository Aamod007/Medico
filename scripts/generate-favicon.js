const fs = require('fs');
const path = require('path');

// Minimal valid 16x16 / 32x32 ICO containing an uncompressed green medical icon
// ICO Header (6 bytes): 00 00, 01 00 (type 1 = ICO), 01 00 (1 image)
// Directory Entry (16 bytes): 16 16 00 00, 01 00 (planes), 20 00 (32 bpp), size (4 bytes), offset (4 bytes = 22)
// Followed by standard BMP header and pixel data

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="8" fill="#0B4A3A" />
  <path d="M16 8v16M8 16h16" stroke="#10B981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="16" cy="16" r="2.5" fill="#F5C043" />
</svg>`;

const publicDir = path.resolve('apps/web/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write favicon.svg to public
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon, 'utf8');

// Simple valid ICO header + PNG payload (modern ICO format accepted by all browsers and Vercel)
// We can use a 1x1 green PNG wrapped in ICO or write a basic ICO:
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAA7SURBVHgB7dKxEQAwCABBsP8v2/hW2A1SgM2vLCEAgP2Snbd6HwAAAAAAAAAAAAAAAAAAAAAAAAAAgKkBnN0BAo5N8zMAAAAASUVORK5CYII=';
const pngBuffer = Buffer.from(pngBase64, 'base64');

// Create ICO with PNG
const icoHeader = Buffer.from([
  0x00, 0x00, // Reserved
  0x01, 0x00, // ICO type
  0x01, 0x00, // 1 image
  0x20,       // 32 width
  0x20,       // 32 height
  0x00,       // 0 color palette
  0x00,       // reserved
  0x01, 0x00, // color planes
  0x20, 0x00, // 32 bits per pixel
  pngBuffer.length & 0xff,
  (pngBuffer.length >> 8) & 0xff,
  (pngBuffer.length >> 16) & 0xff,
  (pngBuffer.length >> 24) & 0xff, // Image size
  0x16, 0x00, 0x00, 0x00          // Offset 22
]);

const icoFile = Buffer.concat([icoHeader, pngBuffer]);

fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);
fs.writeFileSync(path.resolve('apps/web/src/app/favicon.ico'), icoFile);
console.log('Successfully created favicon.ico in apps/web/public and apps/web/src/app!');
