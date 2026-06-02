// ============================================
// SERVIÇO: GOOGLE ANALYTICS DATA API
// ============================================

import { google } from 'googleapis'
import { supabase } from './supabase'

async function getAuthClientForUser(userId: string) {
  const { data: tokenData, error } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'google')
    .single()

  if (error || !tokenData) {
    throw new Error('Tokens do Google não encontrados para este usuário')
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  auth.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
  })

  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await supabase
        .from('user_tokens')
        .update({
          access_token: tokens.access_token,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('platform', 'google')
    }
  })

  return auth
}

// Busca as propriedades GA4 disponíveis
export async function getGA4Properties(userId: string) {
  const auth = await getAuthClientForUser(userId)
  const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth })

  // Primeiro busca todas as contas
  const accountsResponse = await analyticsAdmin.accounts.list()
  const accounts = accountsResponse.data.accounts || []

  if (accounts.length === 0) return []

  // Para cada conta busca as propriedades
  const allProperties: any[] = []

  for (const account of accounts) {
    const accountId = account.name?.replace('accounts/', '')
    if (!accountId) continue

    try {
      const { data } = await analyticsAdmin.properties.list({
        filter: `parent:accounts/${accountId}`,
      })
      if (data.properties) {
        allProperties.push(...data.properties)
      }
    } catch (e) {
      console.error(`Erro ao buscar propriedades da conta ${accountId}:`, e)
    }
  }

  return allProperties
}

// Busca métricas principais do GA4
export async function getGA4Metrics(userId: string, propertyId: string) {
  const auth = await getAuthClientForUser(userId)
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth })

  const { data } = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'newUsers' },
      ],
    },
  })

  const row = data.rows?.[0]?.metricValues
  return {
    activeUsers:        Number(row?.[0]?.value || 0),
    sessions:           Number(row?.[1]?.value || 0),
    pageViews:          Number(row?.[2]?.value || 0),
    bounceRate:         Number(row?.[3]?.value || 0),
    avgSessionDuration: Number(row?.[4]?.value || 0),
    newUsers:           Number(row?.[5]?.value || 0),
  }
}

// Busca dados por período para o gráfico
export async function getGA4ChartData(userId: string, propertyId: string) {
  const auth = await getAuthClientForUser(userId)
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth })

  const { data } = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    },
  })

  return data.rows?.map(row => ({
    date:      row.dimensionValues?.[0]?.value || '',
    usuarios:  Number(row.metricValues?.[0]?.value || 0),
    sessoes:   Number(row.metricValues?.[1]?.value || 0),
    pageviews: Number(row.metricValues?.[2]?.value || 0),
  })) || []
}