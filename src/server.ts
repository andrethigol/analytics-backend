// ============================================
// SERVIDOR PRINCIPAL DO BACKEND
// ============================================
// Agora com a rota de autenticação registrada.

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// --- MIDDLEWARES ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}))
app.use(express.json())

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'analytics-backend'
  })
})

// --- ROTAS ---
// Autenticação: /auth/google, /auth/google/callback, /auth/status
app.use('/auth', authRoutes)

// Índice da API
app.get('/api', (req, res) => {
  res.json({
    message: 'Analytics Backend rodando!',
    version: '1.0.0',
    endpoints: [
      '/auth/google',
      '/auth/status',
      '/api/analytics',
      '/api/google-ads',
      '/api/search-console',
      '/api/meta-ads',
    ]
  })
})

// --- INICIALIZA ---
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`)
  console.log(`🔐 Auth Google: http://localhost:${PORT}/auth/google`)
})

export default app