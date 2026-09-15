import * as pdfjsDist from 'pdfjs-dist';

// Configure the worker source for pdfjs-dist in browser/Vite
if (typeof window !== 'undefined') {
  try {
    pdfjsDist.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch (e) {
    pdfjsDist.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsDist.version}/build/pdf.worker.min.mjs`;
  }
}

export const pdfjs = pdfjsDist;
