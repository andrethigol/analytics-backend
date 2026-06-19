"use strict";
// ============================================
// ROTA: GOOGLE ADS
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const googleAds_1 = require("../services/googleAds");
const router = (0, express_1.Router)();
// Busca refresh token do usuário no Supabase
async function getRefreshToken(userId) {
    const { data, error } = await supabase_1.supabase
        .from('user_tokens')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'google')
        .single();
    if (error || !data?.refresh_token) {
        throw new Error('Refresh token não encontrado');
    }
    return data.refresh_token;
}
// Métricas principais
router.get('/metrics/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const refreshToken = await getRefreshToken(userId);
        const metrics = await (0, googleAds_1.getGoogleAdsMetrics)(refreshToken);
        res.json({ success: true, metrics });
    }
    catch (error) {
        console.error('Erro ao buscar métricas Google Ads:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Dados para o gráfico
router.get('/chart/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const refreshToken = await getRefreshToken(userId);
        const chartData = await (0, googleAds_1.getGoogleAdsChartData)(refreshToken);
        res.json({ success: true, chartData });
    }
    catch (error) {
        console.error('Erro ao buscar gráfico Google Ads:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Top campanhas
router.get('/campaigns/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const refreshToken = await getRefreshToken(userId);
        const campaigns = await (0, googleAds_1.getGoogleAdsCampaigns)(refreshToken);
        res.json({ success: true, campaigns });
    }
    catch (error) {
        console.error('Erro ao buscar campanhas Google Ads:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
