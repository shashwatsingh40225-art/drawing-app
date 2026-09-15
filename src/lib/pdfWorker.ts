// Import pdfjs through react-pdf (not 'pdfjs-dist' directly). react-pdf's module
// initialiser assigns its own default `GlobalWorkerOptions.workerSrc = 'pdf.worker.mjs'`;
// importing from react-pdf guarantees that default runs *before* the override below.
// Importing pdfjs-dist directly let the bundler order react-pdf's default last, which
// broke every PDF with "Setting up fake worker failed".
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export { pdfjs };
