/**
 * Parser de Notas de Corretagem B3
 * Suporta extratos em texto das principais corretoras brasileiras:
 * XP, BTG, Rico, Clear, Nu Invest, Órama, Avenue (BDRs)
 */

export interface B3Trade {
  date: string;
  ticker: string;
  type: 'compra' | 'venda';
  quantity: number;
  unit_price: number;
  total_value: number;
  fees: number;
  net_value: number;
  market: 'NORMAL' | 'FRACIONARIO' | 'OPCOES';
  broker_note_number?: string;
}

export interface B3Provento {
  data: string;
  ticker: string;
  tipo: string;
  quantidade_custodia: number;
  valor_por_cota: number;
  valor_liquido: number;
}

export interface B3ParseResult {
  trades: B3Trade[];
  proventos: B3Provento[];
  total_buys: number;
  total_sells: number;
  net_value: number;
  fees_total: number;
  errors: string[];
}

// Regex para diferentes formatos de notas de corretagem
const PATTERNS = {
  // Data no formato DD/MM/YYYY
  date: /(\d{2}\/\d{2}\/\d{4})/,

  // Ticker: 4 letras + 1-2 dígitos (ações br), ou letras + F (fracionário)
  ticker: /\b([A-Z]{4}\d{1,2}F?|[A-Z]{3,6}\d{0,2})\b/,

  // Compra/Venda
  side: /\b(COMPRA|VENDA|C\b|V\b)\b/i,

  // Quantidade
  quantity: /\b(\d{1,})(?:\s+(?:ações|cotas|units?))?\b/i,

  // Preço unitário — formatos: 12.345,67 ou 12345,67 ou 12345.67
  price: /([\d.]+,\d{2})\b/,

  // Linha completa de negócio (XP/Rico/BTG style)
  trade_line_xp: /(\d{2}\/\d{2}\/\d{4})\s+[A-Z\s-]+\s+([A-Z]{4}\d{1,2}F?)\s+([CV])\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)/,

  // Linha estilo BTG Pactual
  trade_line_btg: /Bovespa\s+([CV])\s+VISTA\s+([A-Z]{4}\d{1,2}F?)\s+[A-Z\s]+\s+(\d+)\s+([\d.,]+)/,

  // Linha estilo Nu Invest / Clear
  trade_line_nuinvest: /([A-Z]{4}\d{1,2}F?)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)\s+([CV])/,

  // Taxa de corretagem
  fees: /(?:corretagem|taxa|emolumentos|liquidação)[:\s]+([\d.,]+)/i,
};

function parseBRNumber(raw: string): number {
  if (!raw) return 0;
  // Remove pontos de milhar, troca vírgula decimal por ponto
  return parseFloat(raw.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatDate(raw: string): string {
  const parts = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!parts) return new Date().toISOString().split('T')[0];
  return `${parts[3]}-${parts[2]}-${parts[1]}`;
}

function inferMarket(ticker: string): B3Trade['market'] {
  if (ticker.endsWith('F')) return 'FRACIONARIO';
  if (/[A-Z]{4}\d{2}$/.test(ticker) && parseInt(ticker.slice(-2)) > 11) return 'OPCOES';
  return 'NORMAL';
}

/**
 * Parser principal — detecta automaticamente o formato e extrai os negócios
 */
export function parseB3File(content: string): B3ParseResult {
  const result: B3ParseResult = {
    trades: [],
    proventos: [],
    total_buys: 0,
    total_sells: 0,
    net_value: 0,
    fees_total: 0,
    errors: [],
  };

  if (!content || content.trim().length === 0) {
    result.errors.push('Conteúdo vazio ou inválido');
    return result;
  }

  const lines = content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Parser de Proventos (Foco no formato Inter/B3 Excel)
  const proventos = parseProventosInter(lines);
  result.proventos = proventos;

  // Detectar formato de trades (XP/Rico, BTG, Nu Invest, genérico)
  const formato = detectFormat(content);

  const parseFn = {
    xp:       parseXPFormat,
    btg:      parseBTGFormat,
    nuinvest: parseNuInvestFormat,
    generic:  parseGenericFormat,
  }[formato];

  let trades = parseFn(lines, result.errors);
  
  // Se o parser específico falhar (por ex: XP mudou o layout do PDF), 
  // cai no parser genérico heurístico que extrai Ticker, C/V e valores globalmente!
  if (trades.length === 0 && formato !== 'generic') {
     trades = parseGenericFormat(lines, result.errors);
  }

  result.trades = trades;

  // Calcular totais
  for (const t of trades) {
    if (t.type === 'compra') {
      result.total_buys += t.net_value;
    } else {
      result.total_sells += t.net_value;
    }
    result.fees_total += t.fees;
  }

  result.net_value = result.total_sells - result.total_buys;
  return result;
}

function detectFormat(content: string): 'xp' | 'btg' | 'nuinvest' | 'generic' {
  const upper = content.toUpperCase();
  if (upper.includes('XP INVESTIMENTOS') || upper.includes('RICO.COM')) return 'xp';
  if (upper.includes('BTG PACTUAL') || upper.includes('BANCO BTG')) return 'btg';
  if (upper.includes('NU INVEST') || upper.includes('NUINVEST') || upper.includes('CLEAR')) return 'nuinvest';
  return 'generic';
}

function parseXPFormat(lines: string[], errors: string[]): B3Trade[] {
  const trades: B3Trade[] = [];
  let currentDate = '';

  for (const line of lines) {
    const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) currentDate = dateMatch[1];

    // Linha de negócio: DATA MERCADO TICKER C/V QTD PREÇO TOTAL
    const match = line.match(
      /(\d{2}\/\d{2}\/\d{4})?\s*Bovespa\s+([CV])\s+(?:VISTA|FRACIONARIO|OPCOES)?\s*([A-Z]{4}\d{1,2}F?)\s+([\w\s]+?)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)/i
    );

    if (match) {
      const [, date, side, ticker, , qty, price, total] = match;
      const tradeDate = date || currentDate;
      const unitPrice = parseBRNumber(price);
      const totalValue = parseBRNumber(total);
      const fees = totalValue * 0.00325; // Emolumentos + liquidação B3

      trades.push({
        date: formatDate(tradeDate || new Date().toDateString()),
        ticker,
        type: side === 'C' ? 'compra' : 'venda',
        quantity: parseInt(qty),
        unit_price: unitPrice,
        total_value: totalValue,
        fees: parseFloat(fees.toFixed(2)),
        net_value: parseFloat((side === 'C' ? totalValue + fees : totalValue - fees).toFixed(2)),
        market: inferMarket(ticker),
      });
    }

    // Formato mais simples (tabular sem "Bovespa")
    const simpleMatch = line.match(
      /([A-Z]{4}\d{1,2}F?)\s+([CV])\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)/
    );

    if (!match && simpleMatch) {
      const [, ticker, side, qty, price, total] = simpleMatch;
      const unitPrice = parseBRNumber(price);
      const totalValue = parseBRNumber(total);
      const fees = totalValue * 0.00325;

      trades.push({
        date: formatDate(currentDate || new Date().toDateString()),
        ticker,
        type: side === 'C' ? 'compra' : 'venda',
        quantity: parseInt(qty),
        unit_price: unitPrice,
        total_value: totalValue,
        fees: parseFloat(fees.toFixed(2)),
        net_value: parseFloat((side === 'C' ? totalValue + fees : totalValue - fees).toFixed(2)),
        market: inferMarket(ticker),
      });
    }
  }

  if (trades.length === 0) {
    errors.push('Nenhum negócio encontrado no formato XP/Rico');
  }

  return trades;
}

function parseBTGFormat(lines: string[], errors: string[]): B3Trade[] {
  const trades: B3Trade[] = [];
  let currentDate = '';

  for (const line of lines) {
    const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) currentDate = dateMatch[1];

    // BTG: "1-BOVESPA C VISTA PETR4 PETROBRAS PN 100 36,50 3.650,00"
    const match = line.match(
      /\d+-BOVESPA\s+([CV])\s+(VISTA|FRACIONARIO)\s+([A-Z]{4}\d{1,2}F?)\s+[\w\s]+?\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)/i
    );

    if (match) {
      const [, side, , ticker, qty, price, total] = match;
      const unitPrice = parseBRNumber(price);
      const totalValue = parseBRNumber(total);
      const fees = totalValue * 0.00325;

      trades.push({
        date: formatDate(currentDate || new Date().toDateString()),
        ticker,
        type: side === 'C' ? 'compra' : 'venda',
        quantity: parseInt(qty),
        unit_price: unitPrice,
        total_value: totalValue,
        fees: parseFloat(fees.toFixed(2)),
        net_value: parseFloat((side === 'C' ? totalValue + fees : totalValue - fees).toFixed(2)),
        market: inferMarket(ticker),
      });
    }
  }

  if (trades.length === 0) {
    errors.push('Nenhum negócio encontrado no formato BTG Pactual');
  }

  return trades;
}

function parseNuInvestFormat(lines: string[], errors: string[]): B3Trade[] {
  const trades: B3Trade[] = [];
  let currentDate = '';

  for (const line of lines) {
    const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) currentDate = dateMatch[1];

    // Nu Invest / Clear: "PETR4 Petrobras PN 100 36,50 3.650,00 C"
    const match = line.match(
      /([A-Z]{4}\d{1,2}F?)\s+[\w\sÀ-ÿ]+?\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)\s+([CV])/
    );

    if (match) {
      const [, ticker, qty, price, total, side] = match;
      const unitPrice = parseBRNumber(price);
      const totalValue = parseBRNumber(total);
      const fees = totalValue * 0.00325;

      trades.push({
        date: formatDate(currentDate || new Date().toDateString()),
        ticker,
        type: side === 'C' ? 'compra' : 'venda',
        quantity: parseInt(qty),
        unit_price: unitPrice,
        total_value: totalValue,
        fees: parseFloat(fees.toFixed(2)),
        net_value: parseFloat((side === 'C' ? totalValue + fees : totalValue - fees).toFixed(2)),
        market: inferMarket(ticker),
      });
    }
  }

  if (trades.length === 0) {
    errors.push('Nenhum negócio encontrado no formato Nu Invest/Clear');
  }

  return trades;
}

function parseGenericFormat(lines: string[], errors: string[]): B3Trade[] {
  const trades: B3Trade[] = [];
  let currentDate = new Date().toISOString().split('T')[0];

  for (const line of lines) {
    // Tentar capturar data em qualquer posição
    const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) currentDate = formatDate(dateMatch[1]);

    const tickerMatch = line.match(/\b([A-Z]{3,6}\d{1,2}F?)\b/i);
    const sideMatch   = line.match(/\b(COMPRA|VENDA|compra|venda|\bC\b|\bV\b)\b/i);

    if (tickerMatch && sideMatch) {
      const ticker = tickerMatch[1].toUpperCase();
      const sideRaw = sideMatch[1].toUpperCase();
      const side: 'compra' | 'venda' = (sideRaw === 'C' || sideRaw === 'COMPRA') ? 'compra' : 'venda';
      
      const numMatches = line.match(/\b(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:\.\d+)?)\b/g);
      
      if (numMatches && numMatches.length >= 2) {
        let quantity = 0;
        let unitPrice = 0;
        
        const nums = numMatches.map(n => {
          if (n.includes(',') && n.includes('.')) {
            const lastCommaPos = n.lastIndexOf(',');
            const lastDotPos = n.lastIndexOf('.');
            if (lastCommaPos > lastDotPos) {
              return parseFloat(n.replace(/\./g, '').replace(',', '.'));
            } else {
              return parseFloat(n.replace(/,/g, ''));
            }
          } else if (n.includes(',')) {
            return parseFloat(n.replace(/\./g, '').replace(',', '.'));
          }
          return parseFloat(n);
        });

        // Heurística de extração
        const validNums = nums.filter(n => !isNaN(n) && n > 0);
        const intNums = validNums.filter(n => n % 1 === 0 && n < 1000000);
        
        // Quantity is usually the first integer
        quantity = intNums[0] || validNums[0] || 0;
        
        // Price is typically the first number that isn't the quantity, or a decimal.
        const remainNums = validNums.filter(n => n !== quantity);
        unitPrice = remainNums[0] || validNums[1] || validNums[0] || 0;
        
        if (quantity > 0 && unitPrice > 0) {
          const totalValue = quantity * unitPrice;
          const fees = totalValue * 0.00325;
          const isDuplicate = trades.some(t => t.ticker === ticker && t.quantity === quantity && Math.abs(t.unit_price - unitPrice) < 0.01);
          
          if (!isDuplicate) {
            trades.push({
              date: currentDate,
              ticker,
              type: side,
              quantity,
              unit_price: unitPrice,
              total_value: parseFloat(totalValue.toFixed(2)),
              fees: parseFloat(fees.toFixed(2)),
              net_value: parseFloat((side === 'compra' ? totalValue + fees : totalValue - fees).toFixed(2)),
              market: inferMarket(ticker),
            });
          }
        }
      }
    }
  }

  if (trades.length === 0) {
    errors.push(
      'Nenhum negócio identificado. Verifique o padrão das colunas de Ticker, Compra/Venda, Qtde e Preço.'
    );
  }

  return trades;
}


/**
 * Converte B3Trade em formato de transação para salvar no banco
 */
export function b3TradesToTransactions(
  trades: B3Trade[],
  userId: string
): Array<{
  user_id: string;
  date: string;
  description: string;
  amount: number;
  type: 'despesa' | 'receita';
  category: string;
  ticker: string;
  quantity: number;
  unit_price: number;
  fees: number;
}> {
  return trades.map(t => ({
    user_id: userId,
    date: t.date,
    description: `${t.type === 'compra' ? 'Compra' : 'Venda'} ${t.quantity}x ${t.ticker} @ ${t.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    amount: t.net_value,
    type: t.type === 'compra' ? 'despesa' : 'receita',
    category: 'Investimentos',
    ticker: t.ticker,
    quantity: t.quantity,
    unit_price: t.unit_price,
    fees: t.fees,
  }));
}

/**
 * Parser específico para o formato tabular do Banco Inter / B3 (Proventos)
 */
function parseProventosInter(lines: string[]): B3Provento[] {
  const proventos: B3Provento[] = [];
  
  for (const line of lines) {
    // Regex para capturar data, tipo e o bloco "Ticker - Nome"
    // Ex: 30/12/2025 | Juros Sobre Capital Próprio | SOJA3 - BOA SAFRA
    const match = line.match(/(\d{2}\/\d{2}\/\d{4})\s*\|\s*([^|]+)\s*\|\s*([A-Z0-9]{4,6})\s*-\s*([^|]+)\s*\|\s*[^|]+\|\s*([\d.,]+)\s*\|\s*([\d.,]+)\s*\|\s*([\d.,]+)/i);
    
    if (match) {
      const [, date, type, ticker, , qty, unitPrice, total] = match;
      proventos.push({
        data: formatDate(date),
        ticker: ticker.toUpperCase(),
        tipo: type.trim(),
        quantidade_custodia: parseBRNumber(qty),
        valor_por_cota: parseBRNumber(unitPrice),
        valor_liquido: parseBRNumber(total)
      });
      continue;
    }

    // Fallback: se o Ticker não estiver seguido de hífem (ex: apenas o Ticker em uma coluna)
    const matchSimple = line.match(/(\d{2}\/\d{2}\/\d{4})\s*\|\s*([^|]+)\s*\|\s*([A-Z0-9]{4,6})\s*\|\s*[^|]+\|\s*([\d.,]+)\s*\|\s*([\d.,]+)\s*\|\s*([\d.,]+)/i);
    if (matchSimple) {
      const [, date, type, ticker, qty, unitPrice, total] = matchSimple;
       proventos.push({
        data: formatDate(date),
        ticker: ticker.toUpperCase(),
        tipo: type.trim(),
        quantidade_custodia: parseBRNumber(qty),
        valor_por_cota: parseBRNumber(unitPrice),
        valor_liquido: parseBRNumber(total)
      });
    }
  }
  
  return proventos;
}
