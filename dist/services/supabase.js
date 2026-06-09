"use strict";
// ============================================
// SERVIÇO: CLIENTE SUPABASE
// ============================================
// Cria e exporta o cliente do Supabase que
// será usado em todo o backend para acessar
// o banco de dados.
// Usamos a SECRET KEY aqui pois é o backend
// — nunca expor essa chave no frontend!
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
// Valida se as variáveis existem antes de criar o cliente
if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('❌ SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórios no .env');
}
// Cria o cliente com a chave secreta (acesso total ao banco)
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseSecretKey);
