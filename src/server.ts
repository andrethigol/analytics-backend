// ============================================
// SERVIDOR PRINCIPAL DO BACKEND
// ============================================
// Este é o ponto de entrada da nossa API REST.
// Ele inicializa o Express, configura os
// middlewares e registra todas as rotas.

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Carrega as variáveis do arquivo .env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// --- MIDDLEWARES ---
// cors: permite que o frontend (localhost:3000)
//       acesse o backend (localhost:3001)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}))

// express.json: permite receber dados em JSON
app.use(express.json())

// --- ROTA DE HEALTH CHECK ---
// Usada para verificar se o servidor está vivo
// Útil no deploy (Vercel/Railway verificam isso)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'analytics-backend'
  })
})

// --- ROTAS DA API ---
// Por enquanto vazia — vamos adicionar
// uma por uma nas próximas etapas
app.get('/api', (req, res) => {
  res.json({
    message: 'Analytics Backend rodando!',
    version: '1.0.0',
    endpoints: [
      '/api/analytics',
      '/api/google-ads',
      '/api/search-console',
      '/api/meta-ads',
      '/api/ubersuggest',
    ]
  })
})

// --- INICIALIZA O SERVIDOR ---
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`)
  console.log(`📊 Analytics Backend v1.0.0`)
})

export default app