export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          cpf: string | null
          birth_date: string | null
          phone: string | null
          investment_profile: 'conservador' | 'moderado' | 'arrojado' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          cpf?: string | null
          birth_date?: string | null
          phone?: string | null
          investment_profile?: 'conservador' | 'moderado' | 'arrojado' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          cpf?: string | null
          birth_date?: string | null
          phone?: string | null
          investment_profile?: 'conservador' | 'moderado' | 'arrojado' | null
          updated_at?: string
        }
      }
      contas: {
        Row: {
          id: string
          user_id: string
          nome: string
          tipo: 'corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'carteira_digital'
          banco: string
          agencia: string | null
          numero: string | null
          saldo: number
          saldo_inicial: number
          saldo_atual: number
          cor: string | null
          icone: string | null
          ativa: boolean
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          tipo: 'corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'carteira_digital'
          banco: string
          agencia?: string | null
          numero?: string | null
          saldo?: number
          saldo_inicial?: number
          cor?: string | null
          icone?: string | null
          created_at?: string
        }
        Update: {
          nome?: string
          tipo?: 'corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'carteira_digital'
          banco?: string
          agencia?: string | null
          numero?: string | null
          saldo?: number
          saldo_inicial?: number
          saldo_atual?: number
          cor?: string | null
          icone?: string | null
          ativa?: boolean
          ativo?: boolean
          updated_at?: string
        }
      }
      categorias: {
        Row: {
          id: string
          user_id: string | null
          nome: string
          tipo: 'receita' | 'despesa' | 'transferencia' | 'investimento'
          icone: string | null
          cor: string | null
          palavras_chave: string[]
          is_sistema: boolean
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nome: string
          tipo: 'receita' | 'despesa' | 'transferencia' | 'investimento'
          icone?: string | null
          cor?: string | null
          palavras_chave?: string[]
          is_sistema?: boolean
          created_at?: string
        }
        Update: {
          nome?: string
          tipo?: 'receita' | 'despesa' | 'transferencia' | 'investimento'
          icone?: string | null
          cor?: string | null
          palavras_chave?: string[]
        }
      }
      transacoes: {
        Row: {
          id: string
          user_id: string
          conta_id: string | null
          categoria_id: string | null
          descricao: string
          valor: number
          tipo: 'receita' | 'despesa' | 'transferencia'
          data: string
          data_competencia: string | null
          status: 'pendente' | 'efetivado' | 'cancelado'
          efetivada: boolean
          observacao: string | null
          notas: string | null
          tags: string[] | null
          origem: string | null
          extrato_origem: string | null
          hash_dedup: string | null
          recorrente: boolean
          parcela_atual: number | null
          total_parcelas: number | null
          grupo_recorrencia: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conta_id?: string | null
          categoria_id?: string | null
          descricao: string
          valor: number
          tipo: 'receita' | 'despesa' | 'transferencia'
          data: string
          data_competencia?: string | null
          status?: 'pendente' | 'efetivado' | 'cancelado'
          observacao?: string | null
          tags?: string[] | null
          recorrente?: boolean
          parcela_atual?: number | null
          total_parcelas?: number | null
          grupo_recorrencia?: string | null
          extrato_origem?: string | null
          created_at?: string
        }
        Update: {
          conta_id?: string | null
          categoria_id?: string | null
          descricao?: string
          valor?: number
          tipo?: 'receita' | 'despesa' | 'transferencia'
          data?: string
          status?: 'pendente' | 'efetivado' | 'cancelado'
          observacao?: string | null
          tags?: string[] | null
          updated_at?: string
        }
      }
      ativos_carteira: {
        Row: {
          id: string
          user_id: string
          ticker: string
          nome: string | null
          tipo: 'acao_br' | 'fii' | 'bdr' | 'etf' | 'acao_us' | 'reit' | 'cripto' | 'renda_fixa' | 'tesouro' | 'cdb' | 'lci' | 'lca' | 'debenture' | 'cri' | 'cra' | 'poupanca'
          mercado: 'BR' | 'US' | 'CRIPTO'
          quantidade: number
          preco_medio: number
          preco_atual: number
          moeda: 'BRL' | 'USD'
          corretora: string | null
          conta_custodia: string | null
          vencimento: string | null
          taxa_juros: number | null
          indexador: string | null
          setor: string | null
          subsetor: string | null
          nota_tese: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticker: string
          nome?: string | null
          tipo: 'acao_br' | 'fii' | 'bdr' | 'etf' | 'acao_us' | 'reit' | 'cripto' | 'renda_fixa' | 'tesouro' | 'cdb' | 'lci' | 'lca' | 'debenture' | 'cri' | 'cra' | 'poupanca'
          mercado?: 'BR' | 'US' | 'CRIPTO'
          quantidade?: number
          preco_medio?: number
          preco_atual?: number
          moeda?: 'BRL' | 'USD'
          corretora?: string | null
          conta_custodia?: string | null
          vencimento?: string | null
          taxa_juros?: number | null
          indexador?: string | null
          setor?: string | null
          subsetor?: string | null
          nota_tese?: string | null
          created_at?: string
        }
        Update: {
          ticker?: string
          nome?: string | null
          quantidade?: number
          preco_medio?: number
          preco_atual?: number
          corretora?: string | null
          setor?: string | null
          nota_tese?: string | null
          ativo?: boolean
          updated_at?: string
        }
      }
      ordens: {
        Row: {
          id: string
          user_id: string
          ativo_id: string | null
          ticker: string
          tipo: 'compra' | 'venda' | 'bonificacao' | 'grupamento' | 'desdobramento' | 'subscricao'
          quantidade: number
          preco: number
          total: number
          taxas: number
          corretagem: number
          data: string
          hora: string | null
          mercado: string
          day_trade: boolean
          nota_corretagem: string | null
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ativo_id?: string | null
          ticker: string
          tipo: 'compra' | 'venda' | 'bonificacao' | 'grupamento' | 'desdobramento' | 'subscricao'
          quantidade: number
          preco: number
          total: number
          taxas?: number
          corretagem?: number
          data: string
          hora?: string | null
          mercado?: string
          day_trade?: boolean
          nota_corretagem?: string | null
          observacao?: string | null
          created_at?: string
        }
        Update: {
          quantidade?: number
          preco?: number
          total?: number
          taxas?: number
          corretagem?: number
          data?: string
        }
      }
      proventos: {
        Row: {
          id: string
          user_id: string
          ativo_id: string | null
          ticker: string
          tipo: 'dividendo' | 'jcp' | 'rendimento_fii' | 'amortizacao' | 'bonificacao' | 'subscricao' | 'juros' | 'cupom'
          valor_por_cota: number | null
          quantidade_custodia: number | null
          valor_bruto: number
          ir_retido: number
          valor_liquido: number
          data_ex: string | null
          data_pagamento: string | null
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ativo_id?: string | null
          ticker: string
          tipo: 'dividendo' | 'jcp' | 'rendimento_fii' | 'amortizacao' | 'bonificacao' | 'subscricao' | 'juros' | 'cupom'
          valor_por_cota?: number | null
          quantidade_custodia?: number | null
          valor_bruto: number
          ir_retido?: number
          valor_liquido: number
          data_ex?: string | null
          data_pagamento?: string | null
          observacao?: string | null
          created_at?: string
        }
        Update: {
          valor_bruto?: number
          ir_retido?: number
          valor_liquido?: number
          data_pagamento?: string | null
        }
      }
      apuracao_ir: {
        Row: {
          id: string
          user_id: string
          ano: number
          mes: number
          mercado: 'BR' | 'US' | 'CRIPTO' | 'RENDA_FIXA'
          tipo_operacao: 'swing_trade' | 'day_trade' | 'fii' | 'renda_fixa' | 'exterior'
          resultado_bruto: number
          prejuizo_compensado: number
          resultado_liquido: number
          aliquota: number
          ir_devido: number
          ir_retido_fonte: number
          ir_a_pagar: number
          isento: boolean
          motivo_isencao: string | null
          darf_codigo: string | null
          darf_pago: boolean
          darf_data_pagamento: string | null
          darf_numero: string | null
          vendas_totais: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ano: number
          mes: number
          mercado: 'BR' | 'US' | 'CRIPTO' | 'RENDA_FIXA'
          tipo_operacao: 'swing_trade' | 'day_trade' | 'fii' | 'renda_fixa' | 'exterior'
          resultado_bruto?: number
          prejuizo_compensado?: number
          resultado_liquido?: number
          aliquota?: number
          ir_devido?: number
          ir_retido_fonte?: number
          ir_a_pagar?: number
          isento?: boolean
          motivo_isencao?: string | null
          darf_codigo?: string | null
          vendas_totais?: number
          created_at?: string
        }
        Update: {
          resultado_bruto?: number
          prejuizo_compensado?: number
          resultado_liquido?: number
          ir_devido?: number
          ir_retido_fonte?: number
          ir_a_pagar?: number
          isento?: boolean
          darf_pago?: boolean
          darf_data_pagamento?: string | null
          darf_numero?: string | null
          updated_at?: string
        }
      }
      saude_financeira_scores: {
        Row: {
          id: string
          user_id: string
          score: number
          categoria: 'critico' | 'atencao' | 'regular' | 'bom' | 'excelente'
          dimensoes: Json
          vieses_identificados: Json
          nudges: Json
          insights: Json
          periodo_referencia: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          categoria: 'critico' | 'atencao' | 'regular' | 'bom' | 'excelente'
          dimensoes?: Json
          vieses_identificados?: Json
          nudges?: Json
          insights?: Json
          periodo_referencia: string
          created_at?: string
        }
        Update: {
          score?: number
          categoria?: 'critico' | 'atencao' | 'regular' | 'bom' | 'excelente'
          dimensoes?: Json
          vieses_identificados?: Json
          nudges?: Json
          insights?: Json
        }
      }
      metas_financeiras: {
        Row: {
          id: string
          user_id: string
          nome: string
          descricao: string | null
          valor_alvo: number
          valor_atual: number
          prazo: string | null
          categoria: string
          icone: string
          cor: string
          ativo: boolean
          concluida: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          descricao?: string | null
          valor_alvo: number
          valor_atual?: number
          prazo?: string | null
          categoria?: string
          icone?: string
          cor?: string
          created_at?: string
        }
        Update: {
          nome?: string
          descricao?: string | null
          valor_alvo?: number
          valor_atual?: number
          prazo?: string | null
          ativo?: boolean
          concluida?: boolean
          updated_at?: string
        }
      }
      orcamentos: {
        Row: {
          id: string
          user_id: string
          categoria_id: string | null
          valor_limite: number
          periodo: 'semanal' | 'mensal' | 'anual'
          mes: number | null
          ano: number | null
          alertar_em_percent: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          categoria_id?: string | null
          valor_limite: number
          periodo?: 'semanal' | 'mensal' | 'anual'
          mes?: number | null
          ano?: number | null
          alertar_em_percent?: number
          created_at?: string
        }
        Update: {
          valor_limite?: number
          periodo?: 'semanal' | 'mensal' | 'anual'
          alertar_em_percent?: number
          ativo?: boolean
        }
      }
      extratos_importados: {
        Row: {
          id: string
          user_id: string
          conta_id: string | null
          nome_arquivo: string
          formato: 'pdf' | 'csv' | 'ofx' | 'xlsx'
          banco: string | null
          periodo_inicio: string | null
          periodo_fim: string | null
          total_transacoes: number
          total_importadas: number
          status: 'processando' | 'concluido' | 'erro' | 'revisao'
          erro_mensagem: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conta_id?: string | null
          nome_arquivo: string
          formato: 'pdf' | 'csv' | 'ofx' | 'xlsx'
          banco?: string | null
          periodo_inicio?: string | null
          periodo_fim?: string | null
          status?: 'processando' | 'concluido' | 'erro' | 'revisao'
          created_at?: string
        }
        Update: {
          total_transacoes?: number
          total_importadas?: number
          status?: 'processando' | 'concluido' | 'erro' | 'revisao'
          erro_mensagem?: string | null
          periodo_inicio?: string | null
          periodo_fim?: string | null
        }
      }
      analise_ia_carteira: {
        Row: {
          id: string
          user_id: string
          tipo: 'diversificacao' | 'risco' | 'rentabilidade' | 'qualidade' | 'geral'
          score: number | null
          resumo: string | null
          pontos_fortes: Json
          pontos_fracos: Json
          recomendacoes: Json
          alertas: Json
          dados_snapshot: Json
          modelo_ia: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo: 'diversificacao' | 'risco' | 'rentabilidade' | 'qualidade' | 'geral'
          score?: number | null
          resumo?: string | null
          pontos_fortes?: Json
          pontos_fracos?: Json
          recomendacoes?: Json
          alertas?: Json
          dados_snapshot?: Json
          modelo_ia?: string
          created_at?: string
        }
        Update: {
          score?: number | null
          resumo?: string | null
          pontos_fortes?: Json
          pontos_fracos?: Json
          recomendacoes?: Json
          alertas?: Json
        }
      }
      prejuizos_acumulados: {
        Row: {
          id: string
          user_id: string
          tipo_operacao: 'swing_trade' | 'day_trade' | 'fii' | 'exterior'
          mercado: string
          valor: number
          ano_referencia: number
          mes_referencia: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo_operacao: 'swing_trade' | 'day_trade' | 'fii' | 'exterior'
          mercado?: string
          valor?: number
          ano_referencia: number
          mes_referencia: number
          created_at?: string
        }
        Update: {
          valor?: number
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
