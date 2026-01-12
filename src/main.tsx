import { StrictMode } from 'react' // ✨ 깔끔하게 이것만 import
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Analytics } from "@vercel/analytics/react" // ✨ 분석 도구 추가

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* ✨ 여기에 분석기 추가 */}
    <Analytics />
  </StrictMode>,
)