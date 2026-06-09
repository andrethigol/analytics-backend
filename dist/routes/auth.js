"use strict";
// ============================================
// ROTA: AUTENTICAÇÃO
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const googleAuth_1 = require("../services/googleAuth");
const supabase_1 = require("../services/supabase");
const googleapis_1 = require("googleapis");
const router = (0, express_1.Router)();
// --- ROTA 1: Inicia o login com Google ---
router.get('/google', (req, res) => {
    const { google: googleAuth } = require('../services/googleAuth');
    const authUrl = googleAuth_1.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/adwords',
            'https://www.googleapis.com/auth/webmasters.readonly',
            'openid',
            'email',
            'profile', // necessário para buscar nome e foto
        ],
        prompt: 'consent',
    });
    res.redirect(authUrl);
});
// --- ROTA 2: Callback do Google ---
router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Código não encontrado' });
        return;
    }
    try {
        // 1. Troca o code pelos tokens
        const { tokens } = await googleAuth_1.oauth2Client.getToken(code);
        // 2. Configura o cliente COM os tokens antes de qualquer chamada
        const authedClient = new (require('googleapis').google.auth.OAuth2)(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
        authedClient.setCredentials(tokens);
        // 3. Busca informações do usuário
        const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: authedClient });
        const { data: googleUser } = await oauth2.userinfo.get();
        if (!googleUser.email) {
            res.redirect('http://localhost:3000/dashboard?auth=error');
            return;
        }
        // 4. Salva ou atualiza usuário no Supabase
        const { data: user, error: userError } = await supabase_1.supabase
            .from('users')
            .upsert({
            email: googleUser.email,
            name: googleUser.name,
            avatar_url: googleUser.picture,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'email' })
            .select()
            .single();
        if (userError)
            throw userError;
        // 5. Salva os tokens no banco
        const { error: tokenError } = await supabase_1.supabase
            .from('user_tokens')
            .upsert({
            user_id: user.id,
            platform: 'google',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expiry_date
                ? new Date(tokens.expiry_date).toISOString()
                : null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, platform' });
        if (tokenError)
            throw tokenError;
        console.log(`✅ Usuário autenticado: ${googleUser.email}`);
        res.redirect(`http://localhost:3000/dashboard?auth=success&userId=${user.id}`);
    }
    catch (error) {
        console.error('❌ Erro na autenticação:', error);
        res.redirect('http://localhost:3000/dashboard?auth=error');
    }
});
// --- ROTA 3: Status da autenticação ---
router.get('/status/:userId', async (req, res) => {
    const { userId } = req.params;
    const { data: tokens } = await supabase_1.supabase
        .from('user_tokens')
        .select('platform')
        .eq('user_id', userId);
    res.json({
        authenticated: !!tokens?.length,
        platforms: tokens?.map(t => t.platform) || []
    });
});
exports.default = router;
