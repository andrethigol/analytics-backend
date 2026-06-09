"use strict";
// ============================================
// SERVIDOR PRINCIPAL DO BACKEND
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const ai_1 = __importDefault(require("./routes/ai"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// --- MIDDLEWARES ---
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'analytics-backend'
    });
});
// --- ROTAS ---
app.use('/auth', auth_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/ai', ai_1.default);
// --- ÍNDICE ---
app.get('/api', (req, res) => {
    res.json({
        message: 'Analytics Backend rodando!',
        version: '1.0.0',
        endpoints: [
            '/auth/google',
            '/auth/status/:userId',
            '/api/analytics/properties/:userId',
            '/api/analytics/metrics/:userId/:propertyId',
            '/api/analytics/chart/:userId/:propertyId',
            '/api/ai/analyze',
            '/api/ai/insight',
        ]
    });
});
// --- INICIALIZA ---
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`🔐 Auth Google: http://localhost:${PORT}/auth/google`);
    console.log(`🤖 AI Analysis: http://localhost:${PORT}/api/ai/analyze`);
});
exports.default = app;
