/**
 * This script generates PWA icons from an SVG template.
 * Run this script after making changes to the SVG template.
 * 
 * You'll need sharp: npm install sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICONS_DIR = path.join(__dirname, 'public', 'icons');
const SVG_TEMPLATE = path.join(ICONS_DIR, 'icon-template.svg');

// Create the icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// List of sizes to generate
const sizes = [192, 384, 512];

async function generateIcons() {
  // Read the SVG template
  const svgBuffer = fs.readFileSync(SVG_TEMPLATE);
  
  // Generate regular icons
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
    
    console.log(`Generated icon-${size}x${size}.png`);
  }
  
  // Generate a maskable icon (with padding for safe area)
  await sharp(svgBuffer)
    .resize(512, 512)
    .composite([{
      input: Buffer.from(`
        <svg width="512" height="512">
          <rect width="512" height="512" fill="#1976d2" fill-opacity="0.3" />
        </svg>
      `),
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(ICONS_DIR, 'maskable-icon.png'));
  
  console.log('Generated maskable-icon.png');
}

// Run the icon generation
generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
}); 