import { Transaction, BankAccount } from '@/types/database';

export interface Biase {
  id: string;
  name: string;
  type: 'Kahneman' | 'Thaler';
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence: string;
  action: string;
}

export interface Nudge {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface HealthAnalysis {
  score: number;
  level: string;
  scoreBreakdown: {
    poupança: number;
    controle: number;
    reserva: number;
    estabilidade: number;
    diversificacao: number;
  };
  biases: Biase[];
  spending: any[];
  nudges: Nudge[];
}

export function analyzeFinancialHealth(transactions: Transaction[], accounts: BankAccount[]): HealthAnalysis {
  // Mock implementations for base logic
  let income = 0;
  let expenses = 0;
  
  const spendingByCat: Record<string, number> = {};

  transactions.forEach(tx => {
    if (tx.type === 'receita') income += tx.amount;
    if (tx.type === 'despesa') {
      expenses += tx.amount;
      const cat = tx.category || 'Outros';
      spendingByCat[cat] = (spendingByCat[cat] || 0) + tx.amount;
    }
  });

  const balance = accounts.reduce((acc, account) => acc + account.balance, 0);
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const emergencyMonths = expenses > 0 ? balance / (expenses / 3) : 0; // rough 3 months avg

  const scoreBreakdown = {
    poupança: Math.min(savingsRate > 20 ? 30 : savingsRate > 10 ? 20 : savingsRate > 0 ? 10 : 0, 30),
    controle: Math.min((expenses / income) < 0.7 ? 25 : (expenses / income) < 0.9 ? 15 : 5, 25) || 10,
    reserva: Math.min(emergencyMonths > 6 ? 20 : emergencyMonths > 3 ? 15 : emergencyMonths > 1 ? 5 : 0, 20),
    estabilidade: 10, // Mock
    diversificacao: 10 // Mock
  };

  const score = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);
  let level = 'Crítica';
  if (score >= 80) level = 'Excelente';
  else if (score >= 60) level = 'Boa';
  else if (score >= 40) level = 'Atenção';

  const biases: Biase[] = [];
  const nudges: Nudge[] = [];

  // Kahneman: Aversão à perda
  if (savingsRate < 5) {
    biases.push({
      id: 'k1',
      name: 'Aversão à Perda Focada no Presente',
      type: 'Kahneman',
      severity: 'high',
      description: 'O medo natural de "perder" dinheiro agora está impedindo o ganho futuro com investimentos.',
      evidence: `Sua taxa de poupança está em apenas ${savingsRate.toFixed(1)}%.`,
      action: 'Automatize transferências no dia do salário.'
    });
    nudges.push({
      id: 'n1',
      type: 'Automação',
      title: 'Pague-se Primeiro',
      description: 'Configure uma transferência automática de 10% do seu salário para sua corretora.',
      priority: 'high'
    });
  }

  // Kahneman: Heurística da disponibilidade
  const alimentacaoProp = income > 0 ? (spendingByCat['Alimentação'] || 0) / income : 0;
  if (alimentacaoProp > 0.25) {
    biases.push({
      id: 'k2',
      name: 'Heurística da Disponibilidade',
      type: 'Kahneman',
      severity: 'medium',
      description: 'Você superestima a necessidade de delivery por estar constantemente exposto a estímulos visuais.',
      evidence: `Alimentação representa ${(alimentacaoProp*100).toFixed(1)}% da sua renda mensal.`,
      action: 'Desative notificações de apps de delivery.'
    });
  }

  // Thaler: Contabilidade Mental
  const entretenimentoProp = income > 0 ? (spendingByCat['Entretenimento'] || 0) / income : 0;
  if (entretenimentoProp > 0.1) {
    biases.push({
      id: 't1',
      name: 'Contabilidade Mental Perigosa',
      type: 'Thaler',
      severity: 'medium',
      description: 'Tratar dinheiro de bônus ou rendas extras com menos rigor que o salário fixo.',
      evidence: `Gastos com entretenimento atingiram ${(entretenimentoProp*100).toFixed(1)}% da renda.`,
      action: 'Crie um orçamento rígido para lazer.'
    });
  }

  // Thaler: Efeito Dotação
  if (emergencyMonths < 3) {
    biases.push({
      id: 't2',
      name: 'Efeito Dotação no Padrão de Vida',
      type: 'Thaler',
      severity: 'high',
      description: 'Apego excessivo ao padrão de vida atual dificulta a construção de reservas.',
      evidence: `Reserva de emergência cobre apenas ${emergencyMonths.toFixed(1)} meses.`,
      action: 'Reduza gastos em 1 categoria não essencial.'
    });
    nudges.push({
      id: 'n2',
      type: 'Segurança',
      title: 'Fortalecer a Base',
      description: 'Sua reserva está baixa. Direcione qualquer renda extra para sua conta de emergência.',
      priority: 'high'
    });
  }

  const spending = Object.keys(spendingByCat).map(cat => ({
    name: cat,
    value: spendingByCat[cat],
    prop: income > 0 ? spendingByCat[cat] / income : 0,
    status: (spendingByCat[cat] / income) > 0.3 ? 'warning' : 'ok'
  }));

  return {
    score,
    level,
    scoreBreakdown,
    biases,
    spending,
    nudges
  };
}
