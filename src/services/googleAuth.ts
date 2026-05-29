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

import { google } from 'googleapis'
import dotenv from 'dotenv'

dotenv.config()

// Cria o cliente OAuth2 com nossas credenciais
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// Escopos = permissões que vamos pedir ao usuário
// Cada escopo dá acesso a uma API específica
const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',      // Google Analytics (só leitura)
  'https://www.googleapis.com/auth/adwords',                 // Google Ads
  'https://www.googleapis.com/auth/webmasters.readonly',     // Search Console (só leitura)
]

// Gera a URL para redirecionar o usuário ao Google
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',  // pede refresh_token para não expirar
    scope: SCOPES,
    prompt: 'consent',       // força mostrar tela de permissão
  })
}

// Troca o "code" recebido do Google pelos tokens
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  return tokens
}

// Configura o cliente com tokens já existentes
export function setCredentials(tokens: any) {
  oauth2Client.setCredentials(tokens)
}