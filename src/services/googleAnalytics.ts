// ============================================
// SERVIÇO: GOOGLE ANALYTICS + SEARCH CONSOLE
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

// ============================================
// GOOGLE ANALYTICS 4
// ============================================

export async function getGA4Properties(userId: string) {
  const auth = await getAuthClientForUser(userId)
  const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth })

  const accountsResponse = await analyticsAdmin.accounts.list()
  const accounts = accountsResponse.data.accounts || []

  if (accounts.length === 0) return []

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

// ============================================
// SEARCH CONSOLE
// ============================================

// Tenta query com a siteUrl original e fallbacks alternativos
async function querySearchConsole(searchConsole: any, siteUrl: string, requestBody: any) {
  const urlsToTry: string[] = [siteUrl]

  // Se for sc-domain, tenta também com https:// e http://
  if (siteUrl.startsWith('sc-domain:')) {
    const domain = siteUrl.replace('sc-domain:', '')
    urlsToTry.push(`https://${domain}/`)
    urlsToTry.push(`https://www.${domain}/`)
    urlsToTry.push(`http://${domain}/`)
  }
  // Se for URL normal, tenta também sc-domain
  else {
    try {
      const url = new URL(siteUrl)
      urlsToTry.push(`sc-domain:${url.hostname.replace('www.', '')}`)
    } catch {}
  }

  for (const url of urlsToTry) {
    try {
      const { data } = await searchConsole.searchanalytics.query({
        siteUrl: url,
        requestBody,
      })
      console.log(`✅ Search Console OK com: ${url}`)
      return data
    } catch (e: any) {
      console.warn(`⚠️ Search Console falhou com ${url}: ${e.message}`)
    }
  }

  throw new Error(`Nenhuma URL funcionou para o Search Console: ${urlsToTry.join(', ')}`)
}

export async function getSearchConsoleSites(userId: string) {
  const auth = await getAuthClientForUser(userId)
  const searchConsole = google.searchconsole({ version: 'v1', auth })

  const { data } = await searchConsole.sites.list()
  const sites = data.siteEntry || []

  return sites.map(site => ({
    siteUrl: site.siteUrl || '',
    permissionLevel: site.permissionLevel || '',
  }))
}

export async function getSearchConsoleMetrics(userId: string, siteUrl: string) {
  const auth = await getAuthClientForUser(userId)
  const searchConsole = google.searchconsole({ version: 'v1', auth })

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const data = await querySearchConsole(searchConsole, siteUrl, {
    startDate: fmt(startDate),
    endDate: fmt(endDate),
    dimensions: [],
  })

  const row = data.rows?.[0]
  return {
    clicks:      Math.round(row?.clicks || 0),
    impressions: Math.round(row?.impressions || 0),
    ctr:         Number(((row?.ctr || 0) * 100).toFixed(1)),
    position:    Number((row?.position || 0).toFixed(1)),
  }
}

export async function getSearchConsoleChartData(userId: string, siteUrl: string) {
  const auth = await getAuthClientForUser(userId)
  const searchConsole = google.searchconsole({ version: 'v1', auth })

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const data = await querySearchConsole(searchConsole, siteUrl, {
    startDate: fmt(startDate),
    endDate: fmt(endDate),
    dimensions: ['date'],
  })

  return data.rows?.map((row: any) => ({
    date:        row.keys?.[0] || '',
    clicks:      Math.round(row.clicks || 0),
    impressions: Math.round(row.impressions || 0),
    ctr:         Number(((row.ctr || 0) * 100).toFixed(1)),
    position:    Number((row.position || 0).toFixed(1)),
  })) || []
}

export async function getSearchConsoleTopQueries(userId: string, siteUrl: string) {
  const auth = await getAuthClientForUser(userId)
  const searchConsole = google.searchconsole({ version: 'v1', auth })

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const data = await querySearchConsole(searchConsole, siteUrl, {
    startDate: fmt(startDate),
    endDate: fmt(endDate),
    dimensions: ['query'],
    rowLimit: 10,
  })

  return data.rows?.map((row: any) => ({
    query:       row.keys?.[0] || '',
    clicks:      Math.round(row.clicks || 0),
    impressions: Math.round(row.impressions || 0),
    ctr:         Number(((row.ctr || 0) * 100).toFixed(1)),
    position:    Number((row.position || 0).toFixed(1)),
  })) || []
}