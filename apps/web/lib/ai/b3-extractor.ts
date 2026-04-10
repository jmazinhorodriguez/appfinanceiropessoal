import { GoogleGenerativeAI } from '@google/generative-ai';
import { B3Trade } from '../parsers/b3-parser';

export interface B3Provento {
  data: string;
  ticker: string;
  tipo: string;
  quantidade_custodia: number;
  valor_por_cota: number;
  valor_liquido: number;
}

export interface B3ExtractionResult {
  trades: B3Trade[];
  proventos: B3Provento[];
}

export async function parseB3WithAI(text: string): Promise<B3ExtractionResult> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.warn("No GEMINI key, skipping AI extraction.");
      return { trades: [], proventos: [] };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
Você é um especialista financeiro.
Sua missão é ler o texto abaixo (de um PDF, CSV ou Excel) e extrair:
1. Operações de COMPRA e VENDA de ativos (trades).
2. Proventos (Juros Sobre Capital Próprio, Dividendos, Rendimentos, Bonificações).

Responda APENAS com um objeto JSON válido, com a seguinte estrutura:
{
  "trades": [
    {
      "date": "YYYY-MM-DD",
      "ticker": "string",
      "type": "compra" ou "venda",
      "quantity": 100,
      "unit_price": 15.42,
      "total_value": 1542.00,
      "fees": 0,
      "net_value": 1542.00,
      "market": "NORMAL"
    }
  ],
  "proventos": [
    {
      "data": "YYYY-MM-DD",
      "ticker": "string",
      "tipo": "string (ex: Juros Sobre Capital Próprio, Dividendo, Rendimento)",
      "quantidade_custodia": 100,
      "valor_por_cota": 0.15,
      "valor_liquido": 15.00
    }
  ]
}

Regras:
1. Ignore linhas que não sejam dados financeiros reais (como saldos de conta, cabeçalhos, etc).
2. Para os Tickers, extraia apenas as letras/números da B3 se estiverem acompanhados do nome da empresa (ex: SOJA3, CSMG3, KLBN11, PETR4).
3. ATENÇÃO: Retorne APENAS o JSON. Sem blocos markdown (tais como \`\`\`json).

Texto da nota/planilha:
${text.substring(0, 15000)}
`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text().trim();
    
    rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    const parsedData = JSON.parse(rawText);
    
    return {
      trades: Array.isArray(parsedData.trades) ? parsedData.trades : [],
      proventos: Array.isArray(parsedData.proventos) ? parsedData.proventos : []
    };
  } catch (error) {
    console.error('Erro na extração de nota B3 via AI:', error);
    return { trades: [], proventos: [] };
  }
}
