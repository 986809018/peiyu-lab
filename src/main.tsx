/*
 * @Author: {lipeiyu}
 * @Date: 2026-10-12 09:40:18
 * @LastEditTime: 2026-10-12 09:55:01
 * @LastEditors: {lipeiyu}
 * @Description: 
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
