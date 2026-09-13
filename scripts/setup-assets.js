import fs from 'fs';
import path from 'path';

const map = {
  'art-01.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.48 PM.jpeg',
  'art-02.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.47 PM (3).jpeg',
  'art-03.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.47 PM (2).jpeg',
  'art-04.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.47 PM (1).jpeg',
  'art-05.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.47 PM.jpeg',
  'art-06.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.46 PM (2).jpeg',
  'art-07.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.46 PM (1).jpeg',
  'art-08.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.46 PM.jpeg',
  'art-09.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.45 PM (2).jpeg',
  'art-10.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.45 PM (1).jpeg',
  'art-11.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.44 PM (2).jpeg',
  'art-12.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.44 PM (1).jpeg',
  'art-13.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.44 PM.jpeg',
  'art-14.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.43 PM (2).jpeg',
  'art-15.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.43 PM (1).jpeg',
  'art-16.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.43 PM.jpeg',
  'art-17.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.42 PM (1).jpeg',
  'art-18.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.42 PM.jpeg',
  'art-19.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.41 PM (1).jpeg',
  'art-20.jpeg': 'WhatsApp Image 2026-09-12 at 12.50.41 PM.jpeg'
};

const dir = path.resolve('public/artist-reference');
for (const [alias, srcFile] of Object.entries(map)) {
  const src = path.join(dir, srcFile);
  const dstAlias = path.join(dir, alias);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dstAlias);
    // Also create underscore version
    const underscoreName = srcFile.replace(/ /g, '_').replace(/\(/g, '_').replace(/\)/g, '_');
    fs.copyFileSync(src, path.join(dir, underscoreName));
    console.log(`Aliased ${srcFile} -> ${alias} & ${underscoreName}`);
  } else {
    console.warn(`Source not found: ${src}`);
  }
}
console.log('Finished setting up artwork aliases.');
