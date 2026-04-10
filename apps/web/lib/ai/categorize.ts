import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export const ALLOWED_CATEGORIES = [
  'Alimentação', 'Transporte', 'Saúde', 'Educação', 
  'Entretenimento', 'Moradia', 'Vestuário', 'Investimentos', 'Outros'
];

export async function categorizeBatchWithAI(descriptions: string[]): Promise<Record<string, string>> {
  if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
    return {};
  }

  // Fallback se não tiver chave
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn("No GEMINI key, skipping AI category detection.");
    return descriptions.reduce((acc: any, desc: string) => {
      acc[desc] = 'Outros';
      return acc;
    }, {});
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Você é um categorizador financeiro especializado.
Dada a lista de descrições de transações do extrato bancário abaixo, você deve classificá-las ESTRITAMENTE em UMA das seguintes categorias:
[${ALLOWED_CATEGORIES.join(', ')}]

Descrições:
${descriptions.map((desc: string, i: number) => `[${i}] ${desc}`).join('\n')}

IMPORTANTE - Responda APENAS com um objeto JSON válido, mapeando o ID (índice numérico) e a categoria correspondente.
EXEMPLO ESPERADO:
{
  "0": "Alimentação",
  "1": "Transporte"
}
Não inclua nenhuma formatação markdown (como \`\`\`json) ao redor da resposta, APENAS texto cru JSON.
Se estiver em dúvida sobre algum item, use "Outros".
`.trim();

    const result = await model.generateContent(prompt);
    let textResult = result.response.text().trim();
    
    textResult = textResult.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

    let aiCategories: Record<string, string> = {};
    try {
      aiCategories = JSON.parse(textResult);
    } catch (e) {
      console.error('Failed to parse Gemini JSON output', textResult);
    }

    const finalMapping: Record<string, string> = {};
    descriptions.forEach((desc: string, i: number) => {
      let cat = aiCategories[String(i)];
      if (!cat || !ALLOWED_CATEGORIES.includes(cat)) {
        cat = 'Outros';
      }
      finalMapping[desc] = cat;
    });

    return finalMapping;

  } catch (error) {
    console.error('Error classifying transactions via Gemini:', error);
    return descriptions.reduce((acc: any, desc: string) => {
      acc[desc] = 'Outros';
      return acc;
    }, {});
  }
}
