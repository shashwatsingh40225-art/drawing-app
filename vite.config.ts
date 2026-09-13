import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Use 5174 to avoid conflict if 5173 is already running another tab
    open: false,
  },
});
