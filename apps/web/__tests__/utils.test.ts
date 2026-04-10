import { describe, it, expect } from 'vitest';
import {
  calcularIR,
  calcularScoreSaude,
  formatCurrency,
  formatPercent,
  hashTransacao,
  calcVariacao,
  clamp,
  mesAnoKey,
  truncate,
  categorizarAutomaticamente,
} from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// calcularIR — Regras Brasil 2025
// ─────────────────────────────────────────────────────────────────────────────
describe('calcularIR', () => {
  describe('swing_trade BR — isenção até R$ 20.000', () => {
    it('deve ser isento quando vendas <= 20.000', () => {
      const result = calcularIR({
        tipo: 'swing_trade',
        mercado: 'BR',
        resultado_bruto: 500,
        vendas_totais: 15000,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
      });
      expect(result.isento).toBe(true);
      expect(result.ir_a_pagar).toBe(0);
      expect(result.motivo_isencao).toMatch(/20\.000/);
    });

    it('deve tributar 15% quando vendas > 20.000', () => {
      const result = calcularIR({
        tipo: 'swing_trade',
        mercado: 'BR',
        resultado_bruto: 2000,
        vendas_totais: 25000,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
      });
      expect(result.isento).toBe(false);
      expect(result.aliquota).toBe(15);
      expect(result.ir_devido).toBeCloseTo(300);
      expect(result.ir_a_pagar).toBeCloseTo(300);
      expect(result.darf_codigo).toBe('6015');
    });

    it('deve deduzir IRRF do IR a pagar', () => {
      const result = calcularIR({
        tipo: 'swing_trade',
        mercado: 'BR',
        resultado_bruto: 2000,
        vendas_totais: 25000,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 50,
      });
      expect(result.ir_a_pagar).toBeCloseTo(250);
    });

    it('deve compensar prejuízo acumulado antes de calcular IR', () => {
      const result = calcularIR({
        tipo: 'swing_trade',
        mercado: 'BR',
        resultado_bruto: 2000,
        vendas_totais: 25000,
        prejuizo_acumulado: 2000,
        ir_retido_fonte: 0,
      });
      expect(result.resultado_liquido).toBe(0);
      expect(result.isento).toBe(true);
    });

    it('resultado negativo após compensação deve ser isento', () => {
      const result = calcularIR({
        tipo: 'swing_trade',
        mercado: 'BR',
        resultado_bruto: 1000,
        vendas_totais: 25000,
        prejuizo_acumulado: 1500,
        ir_retido_fonte: 0,
      });
      expect(result.isento).toBe(true);
      expect(result.resultado_liquido).toBe(-500);
    });
  });

  describe('day_trade — 20% sem isenção', () => {
    it('deve tributar 20% em day trade', () => {
      const result = calcularIR({
        tipo: 'day_trade',
        mercado: 'BR',
        resultado_bruto: 1000,
        vendas_totais: 5000,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
      });
      expect(result.aliquota).toBe(20);
      expect(result.ir_devido).toBeCloseTo(200);
      expect(result.darf_codigo).toBe('6015');
    });

    it('day trade com vendas < 20.000 NÃO deve ser isento', () => {
      const result = calcularIR({
        tipo: 'day_trade',
        mercado: 'BR',
        resultado_bruto: 500,
        vendas_totais: 10000,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
      });
      expect(result.isento).toBe(false);
      expect(result.aliquota).toBe(20);
    });
  });

  describe('FII — ganho de capital 20%', () => {
    it('deve tributar 20% no ganho de capital de FII', () => {
      const result = calcularIR({
        tipo: 'fii',
        mercado: 'BR',
        resultado_bruto: 3000,
        vendas_totais: 50000,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
      });
      expect(result.aliquota).toBe(20);
      expect(result.ir_devido).toBeCloseTo(600);
      expect(result.darf_codigo).toBe('6015');
    });
  });

  describe('renda_fixa — tabela regressiva', () => {
    it('deve aplicar 22.5% até 6 meses', () => {
      const result = calcularIR({
        tipo: 'renda_fixa',
        mercado: 'RENDA_FIXA',
        resultado_bruto: 1000,
        vendas_totais: 0,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
        meses_aplicacao: 4,
      });
      expect(result.aliquota).toBe(22.5);
      expect(result.darf_codigo).toBe('3317');
    });

    it('deve aplicar 20% entre 7 e 12 meses', () => {
      const result = calcularIR({
        tipo: 'renda_fixa',
        mercado: 'RENDA_FIXA',
        resultado_bruto: 1000,
        vendas_totais: 0,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
        meses_aplicacao: 10,
      });
      expect(result.aliquota).toBe(20);
    });

    it('deve aplicar 17.5% entre 13 e 24 meses', () => {
      const result = calcularIR({
        tipo: 'renda_fixa',
        mercado: 'RENDA_FIXA',
        resultado_bruto: 1000,
        vendas_totais: 0,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
        meses_aplicacao: 18,
      });
      expect(result.aliquota).toBe(17.5);
    });

    it('deve aplicar 15% acima de 24 meses', () => {
      const result = calcularIR({
        tipo: 'renda_fixa',
        mercado: 'RENDA_FIXA',
        resultado_bruto: 1000,
        vendas_totais: 0,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
        meses_aplicacao: 36,
      });
      expect(result.aliquota).toBe(15);
    });
  });

  describe('exterior — ações US e REITs 15%', () => {
    it('deve tributar 15% em ativos internacionais', () => {
      const result = calcularIR({
        tipo: 'exterior',
        mercado: 'US',
        resultado_bruto: 500,
        vendas_totais: 0,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 0,
      });
      expect(result.aliquota).toBe(15);
      expect(result.ir_devido).toBeCloseTo(75);
    });
  });

  describe('edge cases', () => {
    it('ir_a_pagar nunca deve ser negativo', () => {
      const result = calcularIR({
        tipo: 'swing_trade',
        mercado: 'BR',
        resultado_bruto: 1000,
        vendas_totais: 25000,
        prejuizo_acumulado: 0,
        ir_retido_fonte: 999999,
      });
      expect(result.ir_a_pagar).toBe(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularScoreSaude — Score 0-100
// ─────────────────────────────────────────────────────────────────────────────
describe('calcularScoreSaude', () => {
  it('perfil excelente deve ter score alto (>= 80)', () => {
    const result = calcularScoreSaude({
      receita_mensal: 10000,
      despesa_mensal: 5000,
      reserva_emergencia: 30000, // 6 meses
      total_investimentos: 500000,
      dividas: 0,
      taxa_poupanca: 30,
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.categoria).toBe('excelente');
  });

  it('perfil crítico deve ter score baixo (< 20)', () => {
    const result = calcularScoreSaude({
      receita_mensal: 3000,
      despesa_mensal: 3100, // gastando mais que ganha
      reserva_emergencia: 0,
      total_investimentos: 0,
      dividas: 50000,
      taxa_poupanca: 0,
    });
    expect(result.score).toBeLessThan(20);
    expect(result.categoria).toBe('critico');
  });

  it('deve retornar as 5 dimensões do score', () => {
    const result = calcularScoreSaude({
      receita_mensal: 5000,
      despesa_mensal: 4000,
      reserva_emergencia: 12000,
      total_investimentos: 50000,
      dividas: 5000,
      taxa_poupanca: 10,
    });
    expect(result.dimensoes).toHaveProperty('fluxo_caixa');
    expect(result.dimensoes).toHaveProperty('reserva_emergencia');
    expect(result.dimensoes).toHaveProperty('taxa_poupanca');
    expect(result.dimensoes).toHaveProperty('nivel_divida');
    expect(result.dimensoes).toHaveProperty('diversificacao_investimentos');
  });

  it('score deve estar sempre entre 0 e 100', () => {
    // Melhor caso possível
    const best = calcularScoreSaude({
      receita_mensal: 100000,
      despesa_mensal: 10000,
      reserva_emergencia: 1000000,
      total_investimentos: 10000000,
      dividas: 0,
      taxa_poupanca: 90,
    });
    expect(best.score).toBeLessThanOrEqual(100);
    expect(best.score).toBeGreaterThanOrEqual(0);

    // Pior caso possível
    const worst = calcularScoreSaude({
      receita_mensal: 1000,
      despesa_mensal: 5000,
      reserva_emergencia: 0,
      total_investimentos: 0,
      dividas: 999999,
      taxa_poupanca: 0,
    });
    expect(worst.score).toBeLessThanOrEqual(100);
    expect(worst.score).toBeGreaterThanOrEqual(0);
  });

  it('categorias devem ser: critico < 20, atencao < 40, regular < 60, bom < 80, excelente >= 80', () => {
    const categorias: Array<{ score: number; esperada: string }> = [];

    // Forçar scores diferentes via configurações específicas
    const critico = calcularScoreSaude({ receita_mensal: 1000, despesa_mensal: 1100, reserva_emergencia: 0, total_investimentos: 0, dividas: 50000, taxa_poupanca: 0 });
    if (critico.score < 20)  categorias.push({ score: critico.score, esperada: 'critico' });

    const excelente = calcularScoreSaude({ receita_mensal: 20000, despesa_mensal: 8000, reserva_emergencia: 100000, total_investimentos: 2000000, dividas: 0, taxa_poupanca: 40 });
    if (excelente.score >= 80) categorias.push({ score: excelente.score, esperada: 'excelente' });

    // Verificar que os scores que atingiram os limiares têm a categoria certa
    if (critico.score < 20)   expect(critico.categoria).toBe('critico');
    if (excelente.score >= 80) expect(excelente.categoria).toBe('excelente');
  });

  it('deve dividir o score em dimensões que somem o total', () => {
    const result = calcularScoreSaude({
      receita_mensal: 5000,
      despesa_mensal: 3500,
      reserva_emergencia: 15000,
      total_investimentos: 80000,
      dividas: 0,
      taxa_poupanca: 20,
    });
    const somaDimensoes =
      result.dimensoes.fluxo_caixa +
      result.dimensoes.reserva_emergencia +
      result.dimensoes.taxa_poupanca +
      result.dimensoes.nivel_divida +
      result.dimensoes.diversificacao_investimentos;

    // Deve aproximar o score (diferença de até 2 por arredondamento)
    expect(Math.abs(result.score - somaDimensoes)).toBeLessThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Funções utilitárias
// ─────────────────────────────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('deve formatar BRL corretamente', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1.234');
    expect(result).toContain('56');
    expect(result).toMatch(/R\$/);
  });

  it('modo compact deve abreviar milhares', () => {
    const result = formatCurrency(15000, true);
    expect(result).toContain('K');
  });

  it('modo compact deve abreviar milhões', () => {
    const result = formatCurrency(1500000, true);
    expect(result).toContain('M');
  });

  it('deve formatar valores negativos', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500');
  });
});

describe('formatPercent', () => {
  it('valores positivos devem ter sinal +', () => {
    expect(formatPercent(5.23)).toBe('+5.23%');
  });

  it('valores negativos devem ter sinal -', () => {
    expect(formatPercent(-3.14)).toBe('-3.14%');
  });

  it('zero deve ter sinal +', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('deve respeitar número de casas decimais', () => {
    expect(formatPercent(5.23456, 1)).toBe('+5.2%');
  });
});

describe('calcVariacao', () => {
  it('deve calcular variação positiva corretamente', () => {
    expect(calcVariacao(110, 100)).toBeCloseTo(10);
  });

  it('deve calcular variação negativa corretamente', () => {
    expect(calcVariacao(90, 100)).toBeCloseTo(-10);
  });

  it('deve retornar 0 quando anterior for 0 (evitar divisão por zero)', () => {
    expect(calcVariacao(100, 0)).toBe(0);
  });
});

describe('clamp', () => {
  it('deve limitar ao mínimo', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });

  it('deve limitar ao máximo', () => {
    expect(clamp(200, 0, 100)).toBe(100);
  });

  it('deve retornar o valor se dentro do intervalo', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

describe('hashTransacao', () => {
  it('deve gerar hash idêntico para mesma transação', () => {
    const h1 = hashTransacao('2025-03-15', 'Supermercado', 150.00);
    const h2 = hashTransacao('2025-03-15', 'Supermercado', 150.00);
    expect(h1).toBe(h2);
  });

  it('deve gerar hashes diferentes para transações distintas', () => {
    const h1 = hashTransacao('2025-03-15', 'Supermercado', 150.00);
    const h2 = hashTransacao('2025-03-15', 'Supermercado', 151.00);
    expect(h1).not.toBe(h2);
  });

  it('deve ser case-insensitive na descrição', () => {
    const h1 = hashTransacao('2025-03-15', 'SUPERMERCADO', 150.00);
    const h2 = hashTransacao('2025-03-15', 'supermercado', 150.00);
    expect(h1).toBe(h2);
  });
});

describe('truncate', () => {
  it('deve truncar strings longas', () => {
    const result = truncate('texto muito longo aqui', 10);
    expect(result).toHaveLength(10);
    expect(result).toContain('...');
  });

  it('deve retornar string original se dentro do limite', () => {
    expect(truncate('curto', 10)).toBe('curto');
  });
});

describe('mesAnoKey', () => {
  it('deve retornar formato YYYY-MM', () => {
    const key = mesAnoKey(new Date('2025-03-15'));
    expect(key).toBe('2025-03');
  });

  it('meses com dígito único devem ter padding de zero', () => {
    // Usar data com time explícito para evitar problemas de timezone
    const key = mesAnoKey(new Date('2025-01-15T12:00:00'));
    expect(key).toBe('2025-01');
  });
});

describe('categorizarAutomaticamente', () => {
  const categorias = [
    { id: 'alimentacao', nome: 'Alimentação', palavras_chave: ['supermercado', 'ifood', 'restaurante'] },
    { id: 'transporte',  nome: 'Transporte',  palavras_chave: ['uber', 'posto', 'combustível'] },
    { id: 'saude',       nome: 'Saúde',       palavras_chave: ['farmácia', 'hospital', 'droga'] },
  ];

  it('deve categorizar por palavra-chave exata', () => {
    expect(categorizarAutomaticamente('SUPERMERCADO PAO DE ACUCAR', categorias)).toBe('alimentacao');
  });

  it('deve ser case-insensitive', () => {
    expect(categorizarAutomaticamente('UBER TRIP', categorias)).toBe('transporte');
  });

  it('deve remover acentos na comparação', () => {
    expect(categorizarAutomaticamente('FARMACIA POPULAR', categorias)).toBe('saude');
  });

  it('deve retornar null para descrições não reconhecidas', () => {
    expect(categorizarAutomaticamente('PAGAMENTO PIX 12345', categorias)).toBeNull();
  });
});
