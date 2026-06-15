"use strict";
// ============================================
// SERVIÇO: GOOGLE ANALYTICS + SEARCH CONSOLE
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGA4Properties = getGA4Properties;
exports.getGA4Metrics = getGA4Metrics;
exports.getGA4ChartData = getGA4ChartData;
exports.getSearchConsoleSites = getSearchConsoleSites;
exports.getSearchConsoleMetrics = getSearchConsoleMetrics;
exports.getSearchConsoleChartData = getSearchConsoleChartData;
exports.getSearchConsoleTopQueries = getSearchConsoleTopQueries;
const googleapis_1 = require("googleapis");
const supabase_1 = require("./supabase");
async function getAuthClientForUser(userId) {
    const { data: tokenData, error } = await supabase_1.supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'google')
        .single();
    if (error || !tokenData) {
        throw new Error('Tokens do Google não encontrados para este usuário');
    }
    const auth = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    auth.setCredentials({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
    });
    auth.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            await supabase_1.supabase
                .from('user_tokens')
                .update({
                access_token: tokens.access_token,
                updated_at: new Date().toISOString(),
            })
                .eq('user_id', userId)
                .eq('platform', 'google');
        }
    });
    return auth;
}
// ============================================
// GOOGLE ANALYTICS 4
// ============================================
async function getGA4Properties(userId) {
    const auth = await getAuthClientForUser(userId);
    const analyticsAdmin = googleapis_1.google.analyticsadmin({ version: 'v1beta', auth });
    const accountsResponse = await analyticsAdmin.accounts.list();
    const accounts = accountsResponse.data.accounts || [];
    if (accounts.length === 0)
        return [];
    const allProperties = [];
    for (const account of accounts) {
        const accountId = account.name?.replace('accounts/', '');
        if (!accountId)
            continue;
        try {
            const { data } = await analyticsAdmin.properties.list({
                filter: `parent:accounts/${accountId}`,
            });
            if (data.properties) {
                allProperties.push(...data.properties);
            }
        }
        catch (e) {
            console.error(`Erro ao buscar propriedades da conta ${accountId}:`, e);
        }
    }
    return allProperties;
}
async function getGA4Metrics(userId, propertyId) {
    const auth = await getAuthClientForUser(userId);
    const analyticsData = googleapis_1.google.analyticsdata({ version: 'v1beta', auth });
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
    });
    const row = data.rows?.[0]?.metricValues;
    return {
        activeUsers: Number(row?.[0]?.value || 0),
        sessions: Number(row?.[1]?.value || 0),
        pageViews: Number(row?.[2]?.value || 0),
        bounceRate: Number(row?.[3]?.value || 0),
        avgSessionDuration: Number(row?.[4]?.value || 0),
        newUsers: Number(row?.[5]?.value || 0),
    };
}
async function getGA4ChartData(userId, propertyId) {
    const auth = await getAuthClientForUser(userId);
    const analyticsData = googleapis_1.google.analyticsdata({ version: 'v1beta', auth });
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
    });
    return data.rows?.map(row => ({
        date: row.dimensionValues?.[0]?.value || '',
        usuarios: Number(row.metricValues?.[0]?.value || 0),
        sessoes: Number(row.metricValues?.[1]?.value || 0),
        pageviews: Number(row.metricValues?.[2]?.value || 0),
    })) || [];
}
// ============================================
// SEARCH CONSOLE
// ============================================
// Lista todos os sites do usuário no Search Console
async function getSearchConsoleSites(userId) {
    const auth = await getAuthClientForUser(userId);
    const searchConsole = googleapis_1.google.searchconsole({ version: 'v1', auth });
    const { data } = await searchConsole.sites.list();
    const sites = data.siteEntry || [];
    return sites.map(site => ({
        siteUrl: site.siteUrl || '',
        permissionLevel: site.permissionLevel || '',
    }));
}
// Métricas principais do Search Console (cliques, impressões, CTR, posição)
async function getSearchConsoleMetrics(userId, siteUrl) {
    const auth = await getAuthClientForUser(userId);
    const searchConsole = googleapis_1.google.searchconsole({ version: 'v1', auth });
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const fmt = (d) => d.toISOString().split('T')[0];
    const { data } = await searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate: fmt(startDate),
            endDate: fmt(endDate),
            dimensions: [],
        },
    });
    const row = data.rows?.[0];
    return {
        clicks: Math.round(row?.clicks || 0),
        impressions: Math.round(row?.impressions || 0),
        ctr: Number(((row?.ctr || 0) * 100).toFixed(1)),
        position: Number((row?.position || 0).toFixed(1)),
    };
}
// Dados por período para o gráfico do Search Console
async function getSearchConsoleChartData(userId, siteUrl) {
    const auth = await getAuthClientForUser(userId);
    const searchConsole = googleapis_1.google.searchconsole({ version: 'v1', auth });
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const fmt = (d) => d.toISOString().split('T')[0];
    const { data } = await searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate: fmt(startDate),
            endDate: fmt(endDate),
            dimensions: ['date'],
        },
    });
    return data.rows?.map(row => ({
        date: row.keys?.[0] || '',
        clicks: Math.round(row.clicks || 0),
        impressions: Math.round(row.impressions || 0),
        ctr: Number(((row.ctr || 0) * 100).toFixed(1)),
        position: Number((row.position || 0).toFixed(1)),
    })) || [];
}
// Top queries (palavras-chave) do Search Console
async function getSearchConsoleTopQueries(userId, siteUrl) {
    const auth = await getAuthClientForUser(userId);
    const searchConsole = googleapis_1.google.searchconsole({ version: 'v1', auth });
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const fmt = (d) => d.toISOString().split('T')[0];
    const { data } = await searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate: fmt(startDate),
            endDate: fmt(endDate),
            dimensions: ['query'],
            rowLimit: 10,
        },
    });
    return data.rows?.map(row => ({
        query: row.keys?.[0] || '',
        clicks: Math.round(row.clicks || 0),
        impressions: Math.round(row.impressions || 0),
        ctr: Number(((row.ctr || 0) * 100).toFixed(1)),
        position: Number((row.position || 0).toFixed(1)),
    })) || [];
}
