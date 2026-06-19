// ============================================
// ROTA: AUTENTICAÇÃO
// ============================================

import { Router, Request, Response } from 'express'
import { oauth2Client, getAuthUrl, getTokensFromCode } from '../services/googleAuth'
import { supabase } from '../services/supabase'
import { google } from 'googleapis'

const router = Router()

// ============================================
// ROTA 1: Inicia o login com Google
// ============================================
router.get('/google', (_req: Request, res: Response) => {
  const authUrl = getAuthUrl()
  res.redirect(authUrl)
})

// ============================================
// ROTA 2: Callback do Google após autorização
// ============================================
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Código de autorização não encontrado' })
    return
  }

  try {
    // 1. Troca o code pelos tokens
    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token) {
      throw new Error('access_token não retornado pelo Google')
    }

    // 2. Cria um cliente autenticado para buscar dados do usuário
    const authedClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    authedClient.setCredentials(tokens)

    // 3. Busca informações do usuário (nome, email, foto)
    const oauth2 = google.oauth2({ version: 'v2', auth: authedClient })
    const { data: googleUser } = await oauth2.userinfo.get()

    if (!googleUser.email) {
      console.error('❌ Email não retornado pelo Google')
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?auth=error`)
      return
    }

    // 4. Salva ou atualiza o usuário no Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        email:      googleUser.email,
        name:       googleUser.name,
        avatar_url: googleUser.picture,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select()
      .single()

    if (userError || !user) {
      console.error('❌ Erro ao salvar usuário no Supabase:', userError)
      throw userError ?? new Error('Usuário não retornado após upsert')
    }

    // 5. Salva os tokens no banco
    //
    // CRÍTICO: O Google só retorna refresh_token na PRIMEIRA autorização.
    // Nas seguintes, refresh_token vem undefined.
    // Se sobrescrevermos com undefined/null, perdemos o token válido.
    //
    // Estratégia:
    //   - Se veio refresh_token novo → upsert completo (substitui tudo)
    //   - Se não veio → update só do access_token (preserva o refresh_token existente)

    if (tokens.refresh_token) {
      // Primeira autorização ou re-autorização forçada (prompt: consent)
      const { error: tokenError } = await supabase
        .from('user_tokens')
        .upsert({
          user_id:       user.id,
          platform:      'google',
          access_token:  tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at:    tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, platform' })

      if (tokenError) {
        console.error('❌ Erro ao salvar tokens (upsert):', tokenError)
        throw tokenError
      }

      console.log(`✅ refresh_token salvo para: ${googleUser.email}`)
    } else {
      // Login subsequente — preserva o refresh_token que já está no banco
      const { error: tokenError } = await supabase
        .from('user_tokens')
        .update({
          access_token: tokens.access_token,
          expires_at:   tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('platform', 'google')

      if (tokenError) {
        console.error('❌ Erro ao atualizar access_token:', tokenError)
        throw tokenError
      }

      console.log(`✅ access_token atualizado para: ${googleUser.email} (refresh_token preservado)`)
    }

    // 6. Redireciona para o dashboard com sucesso
    res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?auth=success&userId=${user.id}`
    )

  } catch (error: any) {
    console.error('❌ Erro na autenticação:', error?.message ?? JSON.stringify(error))
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?auth=error`)
  }
})

// ============================================
// ROTA 3: Status da autenticação do usuário
// ============================================
router.get('/status/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params

  const { data: tokens, error } = await supabase
    .from('user_tokens')
    .select('platform, refresh_token, expires_at')
    .eq('user_id', userId)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({
    authenticated: !!tokens?.length,
    platforms: tokens?.map(t => t.platform) ?? [],
    // debug: mostra se o refresh_token está presente (sem expor o valor)
    tokens_ok: tokens?.map(t => ({
      platform:          t.platform,
      has_refresh_token: !!t.refresh_token,
      expires_at:        t.expires_at,
    })) ?? [],
  })
})

// ============================================
// ROTA 4: Logout — revoga tokens e limpa banco
// ============================================
router.post('/logout/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    // Busca o access_token para revogar no Google
    const { data: tokenRow } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .eq('platform', 'google')
      .single()

    if (tokenRow?.access_token) {
      // Revoga o token no Google (best-effort, não falha se der erro)
      await oauth2Client.revokeToken(tokenRow.access_token).catch((e: any) => {
        console.warn('⚠️ Não foi possível revogar token no Google:', e?.message)
      })
    }

    // Remove os tokens do banco
    const { error } = await supabase
      .from('user_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('platform', 'google')

    if (error) throw error

    res.json({ success: true, message: 'Logout realizado com sucesso' })
  } catch (error: any) {
    console.error('❌ Erro no logout:', error?.message)
    res.status(500).json({ success: false, error: error?.message })
  }
})

export default router