// ============================================
// ROTA: ANÁLISE DE IA
// ============================================
// Endpoints que o frontend chama para gerar
// análises automáticas com ChatGPT.
//
// POST /api/ai/analyze  → análise completa
// POST /api/ai/insight  → insight rápido

import { Router, Request, Response } from 'express'
import { generateAnalysis, generateQuickInsight } from '../services/aiAnalysis'

const router = Router()

// --- Análise completa ---
router.post('/analyze', async (req: Request, res: Response) => {
  const { metrics, chartData, platform, propertyName } = req.body

  if (!platform) {
    res.status(400).json({ error: 'Platform é obrigatório' })
    return
  }

  try {
    const analysis = await generateAnalysis({
      metrics,
      chartData,
      platform,
      propertyName,
    })

    res.json({ success: true, analysis })

  } catch (error: any) {
    console.error('Erro ao gerar análise:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// --- Insight rápido ---
router.post('/insight', async (req: Request, res: Response) => {
  const { metrics, platform } = req.body

  if (!platform) {
    res.status(400).json({ error: 'Platform é obrigatório' })
    return
  }

  try {
    const insight = await generateQuickInsight({ metrics, platform })
    res.json({ success: true, insight })

  } catch (error: any) {
    console.error('Erro ao gerar insight:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router