import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Serves api/recap.ts from the dev server so the memory bridge works locally.
 * (In production Vercel runs the same file as a function.) Server-only env vars such as
 * GEMINI_API_KEY are passed in here and never reach the client bundle.
 */
function recapApiDevServer(env: Record<string, string>): Plugin {
  return {
    name: 'kin-recap-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/recap', async (req, res) => {
        try {
          const chunks: Uint8Array[] = [];
          for await (const chunk of req) chunks.push(chunk as Uint8Array);
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value);
          }
          const request = new Request('http://localhost/api/recap', {
            method: req.method,
            headers,
            body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
          });
          const mod = await server.ssrLoadModule('/api/recap.ts');
          // Local demo accounts have no Supabase session, so the dev server accepts anonymous calls.
          const response: Response = await mod.handleRecapRequest(request, { env, allowAnonymous: true });
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        } catch (err) {
          server.config.logger.error(`[recap] ${String(err)}`);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ code: 'unavailable', error: 'Recap dev endpoint failed.' }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), recapApiDevServer(loadEnv(mode, process.cwd(), ''))],
  server: {
    port: 5174, // Use 5174 to avoid conflict if 5173 is already running another tab
    open: false,
  },
  build: {
    // Lets a minified prod stack trace (e.g. from a device we can't debug live, like an iPad)
    // be decoded back to real file/line instead of guessing from mangled variable names.
    sourcemap: true,
  },
}));
