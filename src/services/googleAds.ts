// ============================================
// SERVIÇO: GOOGLE ADS API
// ============================================

import { GoogleAdsApi, enums } from 'google-ads-api'

function getClient() {
  return new GoogleAdsApi({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  })
}

function getCustomerId() {
  return process.env.GOOGLE_ADS_CUSTOMER_ID!
}

// Métricas principais dos últimos 30 dias
export async function getGoogleAdsMetrics(refreshToken: string) {
  const client = getClient()
  const customer = client.Customer({
    customer_id: getCustomerId(),
    refresh_token: refreshToken,
  })

  const result = await customer.query(`
    SELECT
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.all_conversions
    FROM customer
    WHERE segments.date DURING LAST_30_DAYS
  `)

  const row = result[0]
  return {
    spend:       Number(((row?.metrics?.cost_micros || 0) / 1_000_000).toFixed(2)),
    impressions: Number(row?.metrics?.impressions || 0),
    clicks:      Number(row?.metrics?.clicks || 0),
    ctr:         Number(((row?.metrics?.ctr || 0) * 100).toFixed(2)),
    cpc:         Number(((row?.metrics?.average_cpc || 0) / 1_000_000).toFixed(2)),
    conversions: Number((row?.metrics?.conversions || 0).toFixed(0)),
  }
}

// Dados por dia para o gráfico
export async function getGoogleAdsChartData(refreshToken: string) {
  const client = getClient()
  const customer = client.Customer({
    customer_id: getCustomerId(),
    refresh_token: refreshToken,
  })

  const result = await customer.query(`
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks
    FROM customer
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY segments.date ASC
  `)

  return result.map((row: any) => ({
    date:        row.segments?.date || '',
    spend:       Number(((row.metrics?.cost_micros || 0) / 1_000_000).toFixed(2)),
    impressions: Number(row.metrics?.impressions || 0),
    clicks:      Number(row.metrics?.clicks || 0),
  }))
}

// Top campanhas
export async function getGoogleAdsCampaigns(refreshToken: string) {
  const client = getClient()
  const customer = client.Customer({
    customer_id: getCustomerId(),
    refresh_token: refreshToken,
  })

  const result = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 10
  `)

  return result.map((row: any) => ({
    id:          String(row.campaign?.id || ''),
    name:        row.campaign?.name || '',
    status:      row.campaign?.status || '',
    spend:       Number(((row.metrics?.cost_micros || 0) / 1_000_000).toFixed(2)),
    impressions: Number(row.metrics?.impressions || 0),
    clicks:      Number(row.metrics?.clicks || 0),
    ctr:         Number(((row.metrics?.ctr || 0) * 100).toFixed(2)),
    conversions: Number((row.metrics?.conversions || 0).toFixed(0)),
  }))
}