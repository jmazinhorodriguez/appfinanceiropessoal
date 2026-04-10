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
      console.warn("[AI_EXTRACTOR] No GEMINI key found in process.env.");
      return { trades: [], proventos: [] };
    }

    console.log(`[AI_EXTRACTOR] Using API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log(`[AI_EXTRACTOR] Sending text to Gemini (Length: ${text.length})...`);

    const prompt = `
Você é um especialista financeiro brasileiro trabalhando no sistema FinanceOS.
Sua missão é extrair dados de investimentos de textos brutos (PDF, CSV, Excel).

FORMATO IDENTIFICADO NESTA SESSÃO:
O texto pode conter cabeçalhos como: "Entrada/Saída", "Movimentação", "Produto", "Quantidade", "Preço unitário", "Valor da Operação".

REGRAS DE OURO:
1. Tickers: Se o texto contiver "SOJA3 - BOA SAFRA", extraia "SOJA3". Se for "CSMG3 - COPASA", extraia "CSMG3".
2. Datas: O texto virá como DD/MM/YYYY. Converta para ISO YYYY-MM-DD.
3. Tipos de Proventos: Mapeie de "Movimentação" para os tipos: "Dividendo", "Juros Sobre Capital Próprio", "Rendimento", "Rentabilidade".
4. Valores: "Valor da Operação" é o valor total líquido que deve ir para "valor_liquido".
5. Trades: Se houver "Compra" ou "Venda", extraia para o array "trades".

Responda EXCLUSIVAMENTE com o JSON abaixo:
{
  "trades": [],
  "proventos": [
    {
      "data": "YYYY-MM-DD",
      "ticker": "string",
      "tipo": "string",
      "quantidade_custodia": number,
      "valor_por_cota": number,
      "valor_liquido": number
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
