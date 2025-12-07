import { defineConfig, loadEnv } from 'vite'
import react from "@vitejs/plugin-react";

/*
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "192.168.100.112",
    port: 5173,
    proxy: {
      "/api/": {
        target: "http://192.168.100.112:3000",
      },
      "/socket.io": {
        target: "http://192.168.100.112:3000",
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
});
*/

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: env.VITE_PRIVATE_IP ? String(env.VITE_PRIVATE_IP) : "127.0.0.1",
      port: env.VITE_PORT ? Number(env.VITE_PORT) : 5173,
      proxy: {
        "/api/": {
          target: "http://192.168.100.112:3000",
        },
        "/socket.io": {
          target: "http://192.168.100.112:3000",
          changeOrigin: true,
          secure: true,
          ws: true,
        },
      },
    }
  }
});



