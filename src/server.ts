// ============================================
// SERVIDOR PRINCIPAL DO BACKEND
// ============================================

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import analyticsRoutes from './routes/analytics'
import aiRoutes from './routes/ai'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// --- MIDDLEWARES ---
  app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://analytics-dashboard-smoky-six.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use('/api/ai', aiRoutes)

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
      '/api/ai/analyze',
      '/api/ai/insight',
    ]
  })
})

// --- INICIALIZA ---
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`)
  console.log(`🔐 Auth Google: http://localhost:${PORT}/auth/google`)
  console.log(`🤖 AI Analysis: http://localhost:${PORT}/api/ai/analyze`)
})

export default app