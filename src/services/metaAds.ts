// ============================================
// SERVIÇO: META ADS API
// ============================================

import axios from 'axios'

const BASE_URL = 'https://graph.facebook.com/v19.0'
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN

// Busca as contas de anúncios disponíveis
export async function getMetaAdAccounts() {
  const { data } = await axios.get(`${BASE_URL}/me/adaccounts`, {
    params: {
      fields: 'id,name,account_status,currency',
      access_token: ACCESS_TOKEN,
    },
  })
  return data.data || []
}

// Métricas principais dos últimos 30 dias
export async function getMetaAdsMetrics(adAccountId: string) {
  const { data } = await axios.get(`${BASE_URL}/${adAccountId}/insights`, {
    params: {
      fields: 'spend,impressions,clicks,ctr,cpc,reach,actions',
      date_preset: 'last_30d',
      access_token: ACCESS_TOKEN,
    },
  })

  const row = data.data?.[0]
  if (!row) {
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      reach: 0,
      conversions: 0,
    }
  }

  // Busca conversões nas actions
  const conversions = row.actions?.find(
    (a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
  )

  return {
    spend:       Number(Number(row.spend || 0).toFixed(2)),
    impressions: Number(row.impressions || 0),
    clicks:      Number(row.clicks || 0),
    ctr:         Number(Number(row.ctr || 0).toFixed(2)),
    cpc:         Number(Number(row.cpc || 0).toFixed(2)),
    reach:       Number(row.reach || 0),
    conversions: Number(conversions?.value || 0),
  }
}

// Dados por dia para o gráfico
export async function getMetaAdsChartData(adAccountId: string) {
  const { data } = await axios.get(`${BASE_URL}/${adAccountId}/insights`, {
    params: {
      fields: 'spend,impressions,clicks,reach',
      date_preset: 'last_30d',
      time_increment: 1,
      access_token: ACCESS_TOKEN,
    },
  })

  return (data.data || []).map((row: any) => ({
    date:        row.date_start || '',
    spend:       Number(Number(row.spend || 0).toFixed(2)),
    impressions: Number(row.impressions || 0),
    clicks:      Number(row.clicks || 0),
    reach:       Number(row.reach || 0),
  }))
}

// Top campanhas
export async function getMetaTopCampaigns(adAccountId: string) {
  const { data } = await axios.get(`${BASE_URL}/${adAccountId}/campaigns`, {
    params: {
      fields: 'id,name,status,objective',
      access_token: ACCESS_TOKEN,
      limit: 5,
    },
  })

  const campaigns = data.data || []

  // Busca insights de cada campanha
  const results = await Promise.all(
    campaigns.map(async (campaign: any) => {
      try {
        const { data: insights } = await axios.get(`${BASE_URL}/${campaign.id}/insights`, {
          params: {
            fields: 'spend,impressions,clicks,ctr',
            date_preset: 'last_30d',
            access_token: ACCESS_TOKEN,
          },
        })
        const row = insights.data?.[0]
        return {
          id:          campaign.id,
          name:        campaign.name,
          status:      campaign.status,
          objective:   campaign.objective,
          spend:       Number(Number(row?.spend || 0).toFixed(2)),
          impressions: Number(row?.impressions || 0),
          clicks:      Number(row?.clicks || 0),
          ctr:         Number(Number(row?.ctr || 0).toFixed(2)),
        }
      } catch {
        return {
          id:          campaign.id,
          name:        campaign.name,
          status:      campaign.status,
          objective:   campaign.objective,
          spend:       0,
          impressions: 0,
          clicks:      0,
          ctr:         0,
        }
      }
    })
  )

  return results
}