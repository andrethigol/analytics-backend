// ============================================
// SERVIÇO: ANÁLISE DE IA COM CHATGPT
// ============================================
// Recebe os dados do dashboard e envia para
// o ChatGPT gerar insights e recomendações
// automáticas para o usuário.

import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Tipos dos dados que vamos analisar
interface AnalysisData {
  metrics?: {
    activeUsers: number
    sessions: number
    pageViews: number
    bounceRate: number
    avgSessionDuration: number
    newUsers: number
  }
  chartData?: {
    date: string
    usuarios: number
    sessoes: number
    pageviews: number
  }[]
  platform: string
  propertyName?: string
}

// Gera análise completa dos dados
export async function generateAnalysis(data: AnalysisData): Promise<string> {
  const { metrics, chartData, platform, propertyName } = data

  // Monta o contexto com os dados reais
  let dataContext = `
Plataforma: ${platform}
${propertyName ? `Propriedade: ${propertyName}` : ''}
`

  if (metrics) {
    dataContext += `
Métricas dos últimos 30 dias:
- Usuários ativos: ${metrics.activeUsers.toLocaleString('pt-BR')}
- Sessões: ${metrics.sessions.toLocaleString('pt-BR')}
- Pageviews: ${metrics.pageViews.toLocaleString('pt-BR')}
- Taxa de rejeição: ${(metrics.bounceRate * 100).toFixed(1)}%
- Duração média da sessão: ${Math.floor(metrics.avgSessionDuration)}s
- Novos usuários: ${metrics.newUsers.toLocaleString('pt-BR')}
`
  }

  if (chartData && chartData.length > 0) {
    const trend = chartData[chartData.length - 1].usuarios - chartData[0].usuarios
    const trendText = trend > 0 ? `crescimento de ${trend} usuários` : `queda de ${Math.abs(trend)} usuários`
    dataContext += `\nTendência no período: ${trendText}`
  }

  const prompt = `
Você é um especialista em marketing digital e analytics.
Analise os seguintes dados e forneça insights práticos em português brasileiro.

${dataContext}

Forneça uma análise estruturada com:
1. **Resumo geral** (2-3 linhas)
2. **Pontos positivos** (2-3 itens)
3. **Pontos de atenção** (2-3 itens)
4. **Recomendações práticas** (3 ações concretas)

Seja direto, prático e use linguagem simples.
Limite a resposta a 300 palavras.
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // modelo mais barato e rápido
    messages: [
      {
        role: 'user',
        content: prompt,
      }
    ],
    max_tokens: 600,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || 'Não foi possível gerar análise.'
}

// Gera uma análise rápida (para o painel lateral)
export async function generateQuickInsight(data: AnalysisData): Promise<string> {
  const { metrics, platform } = data

  if (!metrics) return 'Conecte uma plataforma para ver insights.'

  const prompt = `
Analise esses dados de ${platform} e dê 1 insight principal em 2 linhas máximo, em português:
- Usuários: ${metrics.activeUsers}
- Sessões: ${metrics.sessions}  
- Taxa de rejeição: ${(metrics.bounceRate * 100).toFixed(1)}%
- Duração média: ${Math.floor(metrics.avgSessionDuration)}s

Seja direto e prático.
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || 'Sem insights disponíveis.'
}