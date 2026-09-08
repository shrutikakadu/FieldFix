import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Custom port to avoid conflict with port 5173
    strictPort: false, // If 3000 is occupied, auto-increment to 3001
  },
});
