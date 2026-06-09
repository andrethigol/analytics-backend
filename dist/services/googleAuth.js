"use strict";
// ============================================
// SERVIÇO: AUTENTICAÇÃO GOOGLE (OAuth 2.0)
// ============================================
// Gerencia o fluxo de autenticação com o Google.
// OAuth 2.0 é o protocolo padrão de autorização —
// em vez de guardar senha do usuário, pedimos
// permissão para acessar os dados em nome dele.
//
// FLUXO:
// 1. Usuário clica em "Conectar Google"
// 2. Redirecionamos para página do Google
// 3. Usuário autoriza o acesso
// 4. Google nos envia um "code"
// 5. Trocamos o "code" por tokens de acesso
// 6. Usamos os tokens para buscar dados
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauth2Client = void 0;
exports.getAuthUrl = getAuthUrl;
exports.getTokensFromCode = getTokensFromCode;
exports.setCredentials = setCredentials;
const googleapis_1 = require("googleapis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Cria o cliente OAuth2 com nossas credenciais
exports.oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
// Escopos = permissões que vamos pedir ao usuário
// Cada escopo dá acesso a uma API específica
const SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly', // Google Analytics (só leitura)
    'https://www.googleapis.com/auth/adwords', // Google Ads
    'https://www.googleapis.com/auth/webmasters.readonly', // Search Console (só leitura)
];
// Gera a URL para redirecionar o usuário ao Google
function getAuthUrl() {
    return exports.oauth2Client.generateAuthUrl({
        access_type: 'offline', // pede refresh_token para não expirar
        scope: SCOPES,
        prompt: 'consent', // força mostrar tela de permissão
    });
}
// Troca o "code" recebido do Google pelos tokens
async function getTokensFromCode(code) {
    const { tokens } = await exports.oauth2Client.getToken(code);
    exports.oauth2Client.setCredentials(tokens);
    return tokens;
}
// Configura o cliente com tokens já existentes
function setCredentials(tokens) {
    exports.oauth2Client.setCredentials(tokens);
}
