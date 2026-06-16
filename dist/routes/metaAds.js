"use strict";
// ============================================
// ROTA: META ADS
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metaAds_1 = require("../services/metaAds");
const router = (0, express_1.Router)();
// Lista contas de anúncios
router.get('/accounts', async (req, res) => {
    try {
        const accounts = await (0, metaAds_1.getMetaAdAccounts)();
        res.json({ success: true, accounts });
    }
    catch (error) {
        console.error('Erro ao buscar contas Meta Ads:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Métricas principais
router.get('/metrics/:adAccountId', async (req, res) => {
    const { adAccountId } = req.params;
    try {
        const metrics = await (0, metaAds_1.getMetaAdsMetrics)(adAccountId);
        res.json({ success: true, metrics });
    }
    catch (error) {
        console.error('Erro ao buscar métricas Meta Ads:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Dados para o gráfico
router.get('/chart/:adAccountId', async (req, res) => {
    const { adAccountId } = req.params;
    try {
        const chartData = await (0, metaAds_1.getMetaAdsChartData)(adAccountId);
        res.json({ success: true, chartData });
    }
    catch (error) {
        console.error('Erro ao buscar gráfico Meta Ads:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Top campanhas
router.get('/campaigns/:adAccountId', async (req, res) => {
    const { adAccountId } = req.params;
    try {
        const campaigns = await (0, metaAds_1.getMetaTopCampaigns)(adAccountId);
        res.json({ success: true, campaigns });
    }
    catch (error) {
        console.error('Erro ao buscar campanhas Meta Ads:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
