// ============================================
// ROTA: AUTENTICAÇÃO
// ============================================
// Define os endpoints do fluxo OAuth Google.
//
// GET /auth/google         → redireciona para o Google
// GET /auth/google/callback → recebe o code e pega os tokens
// GET /auth/status          → verifica se está autenticado

import { Router, Request, Response } from 'express'
import { getAuthUrl, getTokensFromCode, oauth2Client } from '../services/googleAuth'

const router = Router()

// Armazena os tokens em memória (temporário)
// Na próxima etapa vamos salvar no PostgreSQL
let storedTokens: any = null

// --- ROTA 1: Inicia o login com Google ---
// O frontend chama essa rota quando usuário
// clica em "Conectar Google"
router.get('/google', (req: Request, res: Response) => {
  const authUrl = getAuthUrl()
  res.redirect(authUrl)
})

// --- ROTA 2: Callback do Google ---
// O Google redireciona para cá depois que
// o usuário autoriza o acesso
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Código de autorização não encontrado' })
    return
  }

  try {
    // Troca o code pelos tokens de acesso
    const tokens = await getTokensFromCode(code)
    storedTokens = tokens

    console.log('✅ Google autenticado com sucesso!')

    // Redireciona de volta para o dashboard
    res.redirect('http://localhost:3000/dashboard?auth=success')

  } catch (error) {
    console.error('❌ Erro na autenticação Google:', error)
    res.redirect('http://localhost:3000/dashboard?auth=error')
  }
})

// --- ROTA 3: Verifica status da autenticação ---
// O frontend chama para saber se está conectado
router.get('/status', (req: Request, res: Response) => {
  if (storedTokens) {
    res.json({
      authenticated: true,
      hasRefreshToken: !!storedTokens.refresh_token
    })
  } else {
    res.json({ authenticated: false })
  }
})

export { storedTokens }
export default router