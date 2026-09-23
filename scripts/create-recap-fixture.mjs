// Local QA fixture. Output lives under ignored node_modules/.cache, never in the user's library.
import JSZip from 'jszip';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const zip = new JSZip();
zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
zip.file('META-INF/container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`);
zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="utf-8"?>
<package version="3.0" unique-identifier="bookid" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">kin-recap-fixture</dc:identifier>
    <dc:title>Recap QA Fixture</dc:title><dc:language>en</dc:language>
    <meta property="dcterms:modified">2026-09-23T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="c2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="c1"/><itemref idref="c2"/></spine>
</package>`);
zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Contents</title></head><body>
<nav epub:type="toc"><ol><li><a href="chapter1.xhtml">The Lantern Path</a></li><li><a href="chapter2.xhtml">The Harbor</a></li></ol></nav>
</body></html>`);

const paragraph = (i) => `<p>At checkpoint ${i}, Mara walks along the river toward the old observatory. She writes down the position of the lamps, listens to the water, and checks the worn map. The path is quiet. Each marker helps her remember the route without telling her what lies beyond the next bend. This passage gives the reader enough ordinary text to fill a reflowable screen and exercise page turns.</p>`;
const chapter1 = Array.from({ length: 34 }, (_, i) => {
  const marker = i === 1 ? '<p>RED LANTERN: Mara finds a red lantern beside the path and decides to carry it.</p>'
    : i === 13 ? '<p>BLUE COMET: A blue comet appears above the river, and Mara records it in her notebook.</p>'
    : i === 31 ? '<p>UNREAD DRAGON: A dragon arrives at the observatory. This is a deliberate spoiler marker near the end.</p>' : '';
  return paragraph(i + 1) + marker;
}).join('\n');
const xhtml = (title, body) => `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title}</title></head><body><h1>${title}</h1>${body}</body></html>`;
zip.file('OEBPS/chapter1.xhtml', xhtml('The Lantern Path', chapter1));
zip.file('OEBPS/chapter2.xhtml', xhtml('The Harbor', '<p>Mara reaches the harbor after the observatory.</p>'));

const path = join(process.cwd(), 'node_modules', '.cache', 'recap-qa-fixture.epub');
await mkdir(join(process.cwd(), 'node_modules', '.cache'), { recursive: true });
await writeFile(path, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(path);
