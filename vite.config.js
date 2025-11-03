import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})

// import { defineConfig } from 'vite'
// export default defineConfig({
// server: {
// host: true,
// // allowedHosts: ['.ngrok-free.app'], // อนุญาตทั้งโดเมนย่อยของ ngrok
// // หรือระบุเฉพาะอันที่ใช้อยู่
// allowedHosts: ['252046036cd2.ngrok-free.app'],
// hmr: { clientPort: 443 } // ช่วยให้ HMR ทำงานผ่าน https
// }
// })