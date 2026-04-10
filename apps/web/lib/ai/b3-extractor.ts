import { GoogleGenerativeAI } from '@google/generative-ai';
import { B3Trade } from '../parsers/b3-parser';

export async function parseB3WithAI(text: string): Promise<B3Trade[]> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.warn("No GEMINI key, skipping AI extraction.");
      return [];
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
Você é um especialista em extração de notas de corretagem (B3).
Analise o texto a seguir (que veio de um PDF, CSV ou Excel) e extraia todas as operações de COMPRA e VENDA de ativos.
Responda APENAS com um JSON Array válido, onde cada objeto tem o seguinte formato exato (em TypeScript):
{
  "date": "YYYY-MM-DD",
  "ticker": "string (ex: PETR4, GOLD11)",
  "type": "compra" ou "venda",
  "quantity": number (inteiro),
  "unit_price": number (float, ex: 15.42),
  "total_value": number (float),
  "fees": number (float, se não achar, deduza como total_value * 0.00325),
  "net_value": number (float),
  "market": "NORMAL" ou "FRACIONARIO" ou "OPCOES"
}

Regras:
1. Ignore linhas que não sejam operações claras (rendimentos, saldos, cabeçalhos, IRRF, etc).
2. Tickers geralmente têm 4 a 6 letras e 1 ou 2 números (ex: WEGE3, BBDC4, TAEE11, XPML11).
3. ATENÇÃO: Retorne APENAS o JSON Array. Sem marcações markdown \`\`\`json ou texto adicional. Valide o JSON antes de retornar.

Texto da nota:
${text.substring(0, 15000)} // limite de segurança
`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text().trim();
    
    rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    const trades: B3Trade[] = JSON.parse(rawText);
    return Array.isArray(trades) ? trades : [];
  } catch (error) {
    console.error('Erro na extração de nota B3 via AI:', error);
    return [];
  }
}
