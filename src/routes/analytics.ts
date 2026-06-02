// ============================================
// ROTA: GOOGLE ANALYTICS
// ============================================
// Endpoints que o frontend vai chamar para
// buscar dados reais do Google Analytics 4.
//
// GET /api/analytics/properties/:userId
//   → lista as propriedades GA4 do usuário
//
// GET /api/analytics/metrics/:userId/:propertyId
//   → métricas principais (cards do dashboard)
//
// GET /api/analytics/chart/:userId/:propertyId
//   → dados para o gráfico de linha

import { Router, Request, Response } from 'express'
import {
  getGA4Properties,
  getGA4Metrics,
  getGA4ChartData,
} from '../services/googleAnalytics'

const router = Router()

// --- Lista propriedades GA4 disponíveis ---
router.get('/properties/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const properties = await getGA4Properties(userId)
    res.json({ success: true, properties })
  } catch (error: any) {
    console.error('Erro ao buscar propriedades GA4:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// --- Métricas principais ---
router.get('/metrics/:userId/:propertyId', async (req: Request, res: Response) => {
  const { userId, propertyId } = req.params

  try {
    const metrics = await getGA4Metrics(userId, propertyId)
    res.json({ success: true, metrics })
  } catch (error: any) {
    console.error('Erro ao buscar métricas GA4:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// --- Dados para o gráfico ---
router.get('/chart/:userId/:propertyId', async (req: Request, res: Response) => {
  const { userId, propertyId } = req.params

  try {
    const chartData = await getGA4ChartData(userId, propertyId)
    res.json({ success: true, chartData })
  } catch (error: any) {
    console.error('Erro ao buscar dados do gráfico GA4:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router