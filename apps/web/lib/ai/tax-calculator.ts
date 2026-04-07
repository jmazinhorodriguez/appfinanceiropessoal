export interface TaxAsset {
  id: string;
  ticker: string;
  asset_type: 'acao_br' | 'fii' | 'bdr' | 'etf' | 'acao_us' | 'reit';
  quantity: number;
  avg_cost: number;
}

export interface TaxTransaction {
  id: string;
  date: string;
  type: 'compra' | 'venda';
  asset_type: string;
  quantity: number;
  price: number;
  avg_cost: number;
}

export interface TaxCalculationResult {
  event_type: string;
  gross_amount: number;
  tax_rate: number;
  tax_due: number;
  darf_code?: string;
  is_exempt?: boolean;
  notes?: string;
}

export function calculateMonthlyTax(
  year: number, 
  month: number, 
  transactions: TaxTransaction[], 
  investments: TaxAsset[]
): TaxCalculationResult[] {
  // Regras 2025
  const alíquotas = {
    acoes_swing: 0.15,
    acoes_day: 0.20,
    fii_rend: 0.00,
    fii_cap: 0.20,
    bdr_swing: 0.15,
    bdr_day: 0.20,
    isentos_br: 20000,
  };

  const results: TaxCalculationResult[] = [];
  let swingTradeSales = 0;
  let swingTradeProfit = 0;
  let dayTradeProfit = 0;
  let fiiProfit = 0;

  // Calculate tax on passed transactions
  for (const t of transactions) {
     if (t.type === 'venda' && t.asset_type === 'acao_br') {
        const isDayTrade = false; // Simple logic for demo
        const totalVal = t.quantity * t.price;
        const profit = t.quantity * (t.price - t.avg_cost);

        if (isDayTrade) {
           dayTradeProfit += profit;
        } else {
           swingTradeSales += totalVal;
           swingTradeProfit += profit;
        }
     } else if (t.type === 'venda' && t.asset_type === 'fii') {
        fiiProfit += (t.quantity * (t.price - t.avg_cost));
     }
  }

  // IR Ações Swing
  if (swingTradeSales > alíquotas.isentos_br && swingTradeProfit > 0) {
     results.push({
         event_type: 'swing_trade',
         gross_amount: swingTradeProfit,
         tax_rate: alíquotas.acoes_swing,
         tax_due: swingTradeProfit * alíquotas.acoes_swing,
         darf_code: '6015'
     });
  } else if (swingTradeSales <= alíquotas.isentos_br && swingTradeProfit > 0) {
     results.push({
         event_type: 'venda_at20k',
         gross_amount: swingTradeProfit,
         tax_rate: 0,
         tax_due: 0,
         is_exempt: true,
         notes: 'Isento. Vendas < 20k no mês.'
     });
  }

  // IR Ações Day Trade
  if (dayTradeProfit > 0) {
     results.push({
         event_type: 'day_trade',
         gross_amount: dayTradeProfit,
         tax_rate: alíquotas.acoes_day,
         tax_due: dayTradeProfit * alíquotas.acoes_day,
         darf_code: '6015'
     });
  }

  // IR FIIs
  if (fiiProfit > 0) {
     results.push({
         event_type: 'fii_ganho',
         gross_amount: fiiProfit,
         tax_rate: alíquotas.fii_cap,
         tax_due: fiiProfit * alíquotas.fii_cap,
         darf_code: '6015'
     });
  }

  return results;
}
