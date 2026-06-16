// ============================================
// ROTA: META ADS
// ============================================

import { Router, Request, Response } from 'express'
import {
  getMetaAdAccounts,
  getMetaAdsMetrics,
  getMetaAdsChartData,
  getMetaTopCampaigns,
} from '../services/metaAds'

const router = Router()

// Lista contas de anúncios
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const accounts = await getMetaAdAccounts()
    res.json({ success: true, accounts })
  } catch (error: any) {
    console.error('Erro ao buscar contas Meta Ads:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Métricas principais
router.get('/metrics/:adAccountId', async (req: Request, res: Response) => {
  const { adAccountId } = req.params
  try {
    const metrics = await getMetaAdsMetrics(adAccountId)
    res.json({ success: true, metrics })
  } catch (error: any) {
    console.error('Erro ao buscar métricas Meta Ads:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Dados para o gráfico
router.get('/chart/:adAccountId', async (req: Request, res: Response) => {
  const { adAccountId } = req.params
  try {
    const chartData = await getMetaAdsChartData(adAccountId)
    res.json({ success: true, chartData })
  } catch (error: any) {
    console.error('Erro ao buscar gráfico Meta Ads:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Top campanhas
router.get('/campaigns/:adAccountId', async (req: Request, res: Response) => {
  const { adAccountId } = req.params
  try {
    const campaigns = await getMetaTopCampaigns(adAccountId)
    res.json({ success: true, campaigns })
  } catch (error: any) {
    console.error('Erro ao buscar campanhas Meta Ads:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router