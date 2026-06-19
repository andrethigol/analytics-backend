// ============================================
// ROTA: GOOGLE ADS
// ============================================

import { Router, Request, Response } from 'express'
import { supabase } from '../services/supabase'
import {
  getGoogleAdsMetrics,
  getGoogleAdsChartData,
  getGoogleAdsCampaigns,
} from '../services/googleAds'

const router = Router()

// Busca refresh token do usuário no Supabase
async function getRefreshToken(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('refresh_token')
    .eq('user_id', userId)
    .eq('platform', 'google')
    .single()

  if (error || !data?.refresh_token) {
    throw new Error('Refresh token não encontrado')
  }
  return data.refresh_token
}

// Métricas principais
router.get('/metrics/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  try {
    const refreshToken = await getRefreshToken(userId)
    const metrics = await getGoogleAdsMetrics(refreshToken)
    res.json({ success: true, metrics })
  } catch (error: any) {
    console.error('Erro ao buscar métricas Google Ads:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Dados para o gráfico
router.get('/chart/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  try {
    const refreshToken = await getRefreshToken(userId)
    const chartData = await getGoogleAdsChartData(refreshToken)
    res.json({ success: true, chartData })
  } catch (error: any) {
    console.error('Erro ao buscar gráfico Google Ads:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Top campanhas
router.get('/campaigns/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  try {
    const refreshToken = await getRefreshToken(userId)
    const campaigns = await getGoogleAdsCampaigns(refreshToken)
    res.json({ success: true, campaigns })
  } catch (error: any) {
    console.error('Erro ao buscar campanhas Google Ads:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router