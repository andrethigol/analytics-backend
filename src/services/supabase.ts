// ============================================
// SERVIÇO: CLIENTE SUPABASE
// ============================================
// Cria e exporta o cliente do Supabase que
// será usado em todo o backend para acessar
// o banco de dados.
// Usamos a SECRET KEY aqui pois é o backend
// — nunca expor essa chave no frontend!

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!

// Valida se as variáveis existem antes de criar o cliente
if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('❌ SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórios no .env')
}

// Cria o cliente com a chave secreta (acesso total ao banco)
export const supabase = createClient(supabaseUrl, supabaseSecretKey)

// Tipos das tabelas do banco
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UserToken {
  id: string
  user_id: string
  platform: string
  access_token?: string
  refresh_token?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface UserAccount {
  id: string
  user_id: string
  platform: string
  account_id?: string
  account_name?: string
  created_at: string
}