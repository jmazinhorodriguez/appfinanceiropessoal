/**
 * Formata um número como moeda brasileira (BRL)
 */
export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1_000_000) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 1,
      }).format(value / 1_000_000) + 'M'
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 1,
    }).format(value / 1000) + 'K'
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata um número como moeda USD
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

/**
 * Formata um número como percentual
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/**
 * Formata data brasileira
 */
export function formatDate(date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  
  if (format === 'short') {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d)
  }
  if (format === 'long') {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d)
  }
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

/**
 * Formata data e hora
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Formata data relativa (ex: "há 3 dias")
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `há ${diffDays} dias`
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`
  return `há ${Math.floor(diffDays / 365)} ano${Math.floor(diffDays / 365) > 1 ? 's' : ''}`
}

/**
 * Retorna o mês/ano formatado (ex: "Março 2025")
 */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d)
}

/**
 * Retorna a data atual no formato ISO (YYYY-MM-DD)
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Retorna primeiro e último dia do mês
 */
export function mesAtualRange(): { inicio: string; fim: string } {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { inicio, fim }
}

/**
 * Categorização automática por palavras-chave
 */
export function categorizarAutomaticamente(
  descricao: string,
  categorias: Array<{ id: string; nome: string; palavras_chave: string[] }>
): string | null {
  const desc = descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  for (const cat of categorias) {
    for (const palavra of cat.palavras_chave) {
      const norm = palavra.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (desc.includes(norm)) return cat.id
    }
  }
  return null
}

/**
 * Classe CSS para valor positivo/negativo
 */
export function valorColorClass(valor: number): string {
  return valor >= 0 ? 'text-green' : 'text-red'
}

/**
 * Gera hash para deduplicação de transações
 */
export function hashTransacao(data: string, descricao: string, valor: number): string {
  const str = `${data}|${descricao.toLowerCase().trim()}|${valor.toFixed(2)}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Trunca texto com reticências
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Calcula variação percentual
 */
export function calcVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return 0
  return ((atual - anterior) / Math.abs(anterior)) * 100
}

/**
 * Retorna cor de acento por tipo de ativo
 */
export function corPorTipoAtivo(tipo: string): string {
  const mapa: Record<string, string> = {
    acao_br: 'var(--accent-blue)',
    fii: 'var(--accent-amber)',
    bdr: 'var(--accent-violet)',
    etf: 'var(--accent-orange)',
    acao_us: 'var(--accent-green)',
    reit: 'var(--accent-green)',
    cripto: 'var(--accent-amber)',
    tesouro: 'var(--accent-blue)',
    cdb: 'var(--accent-violet)',
    lci: 'var(--accent-violet)',
    lca: 'var(--accent-violet)',
    renda_fixa: 'var(--accent-violet)',
    poupanca: 'var(--accent-green)',
  }
  return mapa[tipo] || 'var(--text-tertiary)'
}

/**
 * Nome legível do tipo de ativo
 */
export function nomeTipoAtivo(tipo: string): string {
  const mapa: Record<string, string> = {
    acao_br: 'Ação BR',
    fii: 'FII',
    bdr: 'BDR',
    etf: 'ETF',
    acao_us: 'Ação EUA',
    reit: 'REIT',
    cripto: 'Cripto',
    tesouro: 'Tesouro Direto',
    cdb: 'CDB',
    lci: 'LCI',
    lca: 'LCA',
    debenture: 'Debênture',
    cri: 'CRI',
    cra: 'CRA',
    renda_fixa: 'Renda Fixa',
    poupanca: 'Poupança',
  }
  return mapa[tipo] || tipo
}

/**
 * Cálculo de IR - Regras Brasil 2025
 */
export interface ApuracaoIRInput {
  tipo: 'swing_trade' | 'day_trade' | 'fii' | 'renda_fixa' | 'exterior'
  mercado: 'BR' | 'US' | 'CRIPTO' | 'RENDA_FIXA'
  resultado_bruto: number
  vendas_totais: number
  prejuizo_acumulado: number
  ir_retido_fonte: number
  meses_aplicacao?: number // para renda fixa tabela regressiva
}

export interface ApuracaoIROutput {
  resultado_liquido: number
  aliquota: number
  ir_devido: number
  ir_a_pagar: number
  isento: boolean
  motivo_isencao: string | null
  darf_codigo: string | null
}

export function calcularIR(input: ApuracaoIRInput): ApuracaoIROutput {
  const { tipo, resultado_bruto, vendas_totais, prejuizo_acumulado, ir_retido_fonte, meses_aplicacao = 0 } = input
  
  const base: ApuracaoIROutput = {
    resultado_liquido: 0,
    aliquota: 0,
    ir_devido: 0,
    ir_a_pagar: 0,
    isento: false,
    motivo_isencao: null,
    darf_codigo: null,
  }

  // Compensar prejuízo acumulado
  const resultado_liquido = resultado_bruto - prejuizo_acumulado
  base.resultado_liquido = resultado_liquido

  if (resultado_liquido <= 0) {
    base.isento = true
    base.motivo_isencao = 'Resultado negativo ou zero após compensação de prejuízo'
    return base
  }

  switch (tipo) {
    case 'swing_trade': {
      // Isenção até R$ 20.000 em vendas/mês para ações BR
      if (input.mercado === 'BR' && vendas_totais <= 20000) {
        base.isento = true
        base.motivo_isencao = 'Vendas mensais abaixo de R$ 20.000 (ações BR)'
        return base
      }
      base.aliquota = 15
      base.darf_codigo = '6015'
      break
    }
    case 'day_trade': {
      base.aliquota = 20
      base.darf_codigo = '6015'
      break
    }
    case 'fii': {
      // Rendimentos de FII são isentos para PF; ganho de capital 20%
      base.aliquota = 20
      base.darf_codigo = '6015'
      break
    }
    case 'renda_fixa': {
      // Tabela regressiva IR renda fixa
      if (meses_aplicacao <= 6) base.aliquota = 22.5
      else if (meses_aplicacao <= 12) base.aliquota = 20
      else if (meses_aplicacao <= 24) base.aliquota = 17.5
      else base.aliquota = 15
      base.darf_codigo = '3317'
      break
    }
    case 'exterior': {
      // Ações US e REITs: 15%
      base.aliquota = 15
      base.darf_codigo = '6015'
      break
    }
  }

  base.ir_devido = (resultado_liquido * base.aliquota) / 100
  base.ir_a_pagar = Math.max(0, base.ir_devido - ir_retido_fonte)
  
  return base
}

/**
 * Calcula score de saúde financeira (0-100)
 */
export interface DadosSaudeFinanceira {
  receita_mensal: number
  despesa_mensal: number
  reserva_emergencia: number
  total_investimentos: number
  dividas: number
  taxa_poupanca: number
}

export interface ScoreSaudeFinanceira {
  score: number
  categoria: 'critico' | 'atencao' | 'regular' | 'bom' | 'excelente'
  dimensoes: {
    fluxo_caixa: number
    reserva_emergencia: number
    taxa_poupanca: number
    nivel_divida: number
    diversificacao_investimentos: number
  }
}

export function calcularScoreSaude(dados: DadosSaudeFinanceira): ScoreSaudeFinanceira {
  const { receita_mensal, despesa_mensal, reserva_emergencia, total_investimentos, dividas, taxa_poupanca } = dados
  
  // Fluxo de caixa (0-20 pts)
  const saldo = receita_mensal - despesa_mensal
  const fluxo_caixa = Math.min(20, Math.max(0, (saldo / receita_mensal) * 40))
  
  // Reserva de emergência (0-25 pts): meta = 6 meses de despesas
  const meses_reserva = reserva_emergencia / Math.max(despesa_mensal, 1)
  const reserva_score = Math.min(25, (meses_reserva / 6) * 25)
  
  // Taxa de poupança (0-25 pts): meta = 20%
  const poupanca_score = Math.min(25, (taxa_poupanca / 20) * 25)
  
  // Nível de dívida (0-15 pts): ideal = 0, máximo aceitável = 3x renda
  const nivel_divida_ratio = dividas / Math.max(receita_mensal * 12, 1)
  const divida_score = Math.max(0, 15 - (nivel_divida_ratio * 5))
  
  // Diversificação de investimentos (0-15 pts): meta = 6 meses de renda investidos
  const meta_invest = receita_mensal * 12 * 10 // 10 anos de renda como meta
  const invest_score = Math.min(15, (total_investimentos / meta_invest) * 15)
  
  const score = Math.round(fluxo_caixa + reserva_score + poupanca_score + divida_score + invest_score)
  
  let categoria: ScoreSaudeFinanceira['categoria']
  if (score < 20) categoria = 'critico'
  else if (score < 40) categoria = 'atencao'
  else if (score < 60) categoria = 'regular'
  else if (score < 80) categoria = 'bom'
  else categoria = 'excelente'
  
  return {
    score,
    categoria,
    dimensoes: {
      fluxo_caixa: Math.round(fluxo_caixa),
      reserva_emergencia: Math.round(reserva_score),
      taxa_poupanca: Math.round(poupanca_score),
      nivel_divida: Math.round(divida_score),
      diversificacao_investimentos: Math.round(invest_score),
    },
  }
}

/**
 * Retorna mês/ano string (ex: "2025-03")
 */
export function mesAnoKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Clamp: limita valor entre min e max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Debounce
 */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
