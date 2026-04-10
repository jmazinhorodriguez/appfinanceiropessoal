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
    
    console.log(`[AI_EXTRACTOR] Sending text to Gemini (Length: ${text.length})...`);

    const prompt = `
Você é um especialista financeiro brasileiro.
Sua missão é ler o texto abaixo (que pode ser um PDF de nota de corretagem, um CSV de extrato bancário ou uma planilha de proventos) e extrair:
1. Operações de COMPRA e VENDA de ativos (ações, FIIs, ETFs, BDRs).
2. Proventos (Dividendos, JCP, Rendimentos, Bonificações, Rentabilidade de Investimentos).

REGRAS DE EXTRAÇÃO:
- Tickers: Identifique tickers da B3 (ex: PETR4, SOJA3, KLBN11). Se o texto disser "BOA SAFRA SEMENTES", o ticker é "SOJA3".
- Datas: Converta para o formato ISO YYYY-MM-DD.
- Valores: Garanta que centavos sejam tratados corretamente (use ponto para decimais no JSON).
- Proventos de Extrato: Se encontrar linhas como "RENTAB.INVEST FACILCRED" ou "DIVIDENDO", extraia como provento.

Responda APENAS com um objeto JSON válido:
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
      "tipo": "string (ex: Dividendo, Juros Sobre Capital Próprio, Rendimento, Rentabilidade)",
      "quantidade_custodia": 0,
      "valor_por_cota": 0,
      "valor_liquido": 15.00
    }
  ]
}

Texto para análise:
---
${text.substring(0, 12000)}
---
`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text().trim();
    
    console.log(`[AI_EXTRACTOR] Raw Response from AI: ${rawText.substring(0, 200)}...`);

    // Limpeza de blocos de código markdown que a IA as vezes insere
    rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    // Tentativa de encontrar o JSON caso haja texto extra
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawText = jsonMatch[0];
    }
    
    const parsedData = JSON.parse(rawText);
    
    return {
      trades: Array.isArray(parsedData.trades) ? parsedData.trades : [],
      proventos: Array.isArray(parsedData.proventos) ? parsedData.proventos : []
    };
  } catch (error: any) {
    console.error('[AI_EXTRACTOR] Erro crítico:', error);
    return { trades: [], proventos: [] };
  }
}
