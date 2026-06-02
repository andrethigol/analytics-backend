// ============================================
// SERVIDOR PRINCIPAL DO BACKEND
// ============================================

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import analyticsRoutes from './routes/analytics'

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
app.use('/auth', authRoutes)
app.use('/api/analytics', analyticsRoutes)

// --- ÍNDICE ---
app.get('/api', (req, res) => {
  res.json({
    message: 'Analytics Backend rodando!',
    version: '1.0.0',
    endpoints: [
      '/auth/google',
      '/auth/status/:userId',
      '/api/analytics/properties/:userId',
      '/api/analytics/metrics/:userId/:propertyId',
      '/api/analytics/chart/:userId/:propertyId',
    ]
  })
})

// --- INICIALIZA ---
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`)
  console.log(`🔐 Auth Google: http://localhost:${PORT}/auth/google`)
})

export default app