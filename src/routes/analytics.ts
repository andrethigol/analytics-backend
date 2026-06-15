// ============================================
// ROTA: GOOGLE ANALYTICS + SEARCH CONSOLE
// ============================================

import { Router, Request, Response } from 'express'
import {
  getGA4Properties,
  getGA4Metrics,
  getGA4ChartData,
  getSearchConsoleSites,
  getSearchConsoleMetrics,
  getSearchConsoleChartData,
  getSearchConsoleTopQueries,
} from '../services/googleAnalytics'

const router = Router()

// ============================================
// GOOGLE ANALYTICS 4
// ============================================

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

// ============================================
// SEARCH CONSOLE
// ============================================

// Lista os sites disponíveis no Search Console
router.get('/searchconsole/sites/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  try {
    const sites = await getSearchConsoleSites(userId)
    res.json({ success: true, sites })
  } catch (error: any) {
    console.error('Erro ao buscar sites Search Console:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Métricas principais (cliques, impressões, CTR, posição)
router.get('/searchconsole/metrics/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  const siteUrl = req.query.siteUrl as string

  if (!siteUrl) {
    res.status(400).json({ success: false, error: 'siteUrl é obrigatório' })
    return
  }

  try {
    const metrics = await getSearchConsoleMetrics(userId, siteUrl)
    res.json({ success: true, metrics })
  } catch (error: any) {
    console.error('Erro ao buscar métricas Search Console:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Dados para o gráfico por período
router.get('/searchconsole/chart/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  const siteUrl = req.query.siteUrl as string

  if (!siteUrl) {
    res.status(400).json({ success: false, error: 'siteUrl é obrigatório' })
    return
  }

  try {
    const chartData = await getSearchConsoleChartData(userId, siteUrl)
    res.json({ success: true, chartData })
  } catch (error: any) {
    console.error('Erro ao buscar gráfico Search Console:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Top queries (palavras-chave)
router.get('/searchconsole/queries/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  const siteUrl = req.query.siteUrl as string

  if (!siteUrl) {
    res.status(400).json({ success: false, error: 'siteUrl é obrigatório' })
    return
  }

  try {
    const queries = await getSearchConsoleTopQueries(userId, siteUrl)
    res.json({ success: true, queries })
  } catch (error: any) {
    console.error('Erro ao buscar queries Search Console:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router