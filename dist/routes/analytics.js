"use strict";
// ============================================
// ROTA: GOOGLE ANALYTICS + SEARCH CONSOLE
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const googleAnalytics_1 = require("../services/googleAnalytics");
const router = (0, express_1.Router)();
// ============================================
// GOOGLE ANALYTICS 4
// ============================================
router.get('/properties/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const properties = await (0, googleAnalytics_1.getGA4Properties)(userId);
        res.json({ success: true, properties });
    }
    catch (error) {
        console.error('Erro ao buscar propriedades GA4:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/metrics/:userId/:propertyId', async (req, res) => {
    const { userId, propertyId } = req.params;
    try {
        const metrics = await (0, googleAnalytics_1.getGA4Metrics)(userId, propertyId);
        res.json({ success: true, metrics });
    }
    catch (error) {
        console.error('Erro ao buscar métricas GA4:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/chart/:userId/:propertyId', async (req, res) => {
    const { userId, propertyId } = req.params;
    try {
        const chartData = await (0, googleAnalytics_1.getGA4ChartData)(userId, propertyId);
        res.json({ success: true, chartData });
    }
    catch (error) {
        console.error('Erro ao buscar dados do gráfico GA4:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ============================================
// SEARCH CONSOLE
// ============================================
// Lista os sites disponíveis no Search Console
router.get('/searchconsole/sites/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const sites = await (0, googleAnalytics_1.getSearchConsoleSites)(userId);
        res.json({ success: true, sites });
    }
    catch (error) {
        console.error('Erro ao buscar sites Search Console:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Métricas principais (cliques, impressões, CTR, posição)
router.get('/searchconsole/metrics/:userId', async (req, res) => {
    const { userId } = req.params;
    const siteUrl = req.query.siteUrl;
    if (!siteUrl) {
        res.status(400).json({ success: false, error: 'siteUrl é obrigatório' });
        return;
    }
    try {
        const metrics = await (0, googleAnalytics_1.getSearchConsoleMetrics)(userId, siteUrl);
        res.json({ success: true, metrics });
    }
    catch (error) {
        console.error('Erro ao buscar métricas Search Console:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Dados para o gráfico por período
router.get('/searchconsole/chart/:userId', async (req, res) => {
    const { userId } = req.params;
    const siteUrl = req.query.siteUrl;
    if (!siteUrl) {
        res.status(400).json({ success: false, error: 'siteUrl é obrigatório' });
        return;
    }
    try {
        const chartData = await (0, googleAnalytics_1.getSearchConsoleChartData)(userId, siteUrl);
        res.json({ success: true, chartData });
    }
    catch (error) {
        console.error('Erro ao buscar gráfico Search Console:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Top queries (palavras-chave)
router.get('/searchconsole/queries/:userId', async (req, res) => {
    const { userId } = req.params;
    const siteUrl = req.query.siteUrl;
    if (!siteUrl) {
        res.status(400).json({ success: false, error: 'siteUrl é obrigatório' });
        return;
    }
    try {
        const queries = await (0, googleAnalytics_1.getSearchConsoleTopQueries)(userId, siteUrl);
        res.json({ success: true, queries });
    }
    catch (error) {
        console.error('Erro ao buscar queries Search Console:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
