"use strict";
// ============================================
// ROTA: ANÁLISE DE IA
// ============================================
// Endpoints que o frontend chama para gerar
// análises automáticas com ChatGPT.
//
// POST /api/ai/analyze  → análise completa
// POST /api/ai/insight  → insight rápido
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiAnalysis_1 = require("../services/aiAnalysis");
const router = (0, express_1.Router)();
// --- Análise completa ---
router.post('/analyze', async (req, res) => {
    const { metrics, chartData, platform, propertyName } = req.body;
    if (!platform) {
        res.status(400).json({ error: 'Platform é obrigatório' });
        return;
    }
    try {
        const analysis = await (0, aiAnalysis_1.generateAnalysis)({
            metrics,
            chartData,
            platform,
            propertyName,
        });
        res.json({ success: true, analysis });
    }
    catch (error) {
        console.error('Erro ao gerar análise:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// --- Insight rápido ---
router.post('/insight', async (req, res) => {
    const { metrics, platform } = req.body;
    if (!platform) {
        res.status(400).json({ error: 'Platform é obrigatório' });
        return;
    }
    try {
        const insight = await (0, aiAnalysis_1.generateQuickInsight)({ metrics, platform });
        res.json({ success: true, insight });
    }
    catch (error) {
        console.error('Erro ao gerar insight:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
