import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { parse as parseCsv } from 'https://deno.land/std@0.220.1/csv/mod.ts';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'; 

const ALLOWED_CATEGORIES = [
  'Alimentação', 'Transporte', 'Saúde', 'Educação', 
  'Entretenimento', 'Moradia', 'Vestuário', 'Investimentos', 'Outros'
];

const KEYWORD_MAP: Record<string, string> = {
  'IFOOD': 'Alimentação', 'UBER EATS': 'Alimentação', 'RESTAURANTE': 'Alimentação', 'MERCADO': 'Alimentação',
  'UBER': 'Transporte', '99APP': 'Transporte', 'POSTO': 'Transporte', 'SHELL': 'Transporte',
  'FARMACIA': 'Saúde', 'DROGASIL': 'Saúde', 'HOSPITAL': 'Saúde',
  'COLEGIO': 'Educação', 'CURSO': 'Educação', 'UDEMY': 'Educação',
  'NETFLIX': 'Entretenimento', 'SPOTIFY': 'Entretenimento', 'BAR': 'Entretenimento',
  'ALUGUEL': 'Moradia', 'CONDOMINIO': 'Moradia', 'ENEL': 'Moradia', 'SABESP': 'Moradia',
  'ZARA': 'Vestuário', 'RENNER': 'Vestuário', 'C&A': 'Vestuário',
  'CORRETORA': 'Investimentos', 'XP INVESTIMENTOS': 'Investimentos', 'DIVIDENDOS': 'Investimentos', 'RENDIMENTO': 'Investimentos'
};

const parseBrazilianNumber = (value: string | undefined): number | null => {
  if (!value || String(value).trim() === '') return null;
  const cleaned = String(value).replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const parseBrazilianDate = (dateString: string): string | null => {
  if (!dateString) return null;
  const parts = String(dateString).split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString; // ISO fallback
};

async function categorizeWithAI(descriptions: string[], apiKey: string): Promise<Record<string, string>> {
  if (!apiKey || descriptions.length === 0) return {};
  
  try {
    const prompt = `
Categorize as seguintes transações bancárias nestas categorias: [${ALLOWED_CATEGORIES.join(', ')}].
Responda APENAS um JSON: {"descrição": "categoria"}.

Transações:
${descriptions.join('\n')}
    `.trim();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = text.replace(/```json/i, '').replace(/```/i, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('AI Categorization failed:', e);
    return {};
  }
}

async function parsePDFWithAI(fileBase64: string, apiKey: string): Promise<any> {
    const prompt = `
Extraia as transações deste extrato bancário (PDF).
Retorne um JSON com a seguinte estrutura:
{
  "transacoes": [{"date": "YYYY-MM-DD", "description": "Texto", "amount": 0.00, "type": "receita|despesa"}],
  "investimentos": [{"date": "YYYY-MM-DD", "ticker": "ABCD3", "type": "compra|venda|provento", "quantity": 0, "price": 0, "total": 0}]
}
Seja preciso nos valores. Se for crédito/entrada use "receita", se for débito/saída use "despesa".
    `.trim();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: "application/pdf", data: fileBase64 } }
            ]
        }]
      })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = text.replace(/```json/i, '').replace(/```/i, '').trim();
    return JSON.parse(jsonStr);
}

serve(async (req) => {
  const { storage_path, statement_upload_id, file_type, gemini_api_key } = await req.json();

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('statement_uploads')
      .download(storage_path);

    if (downloadError) throw downloadError;
    
    let resultItems: any = { transacoes: [], ordens: [], proventos: [] };

    if (file_type.includes('csv')) {
      const text = await fileData.text();
      const records = await parseCsv(text, { delimiter: text.includes(';') ? ';' : ',', columns: true, skip_empty_lines: true });

      for (const record of records) {
        const desc = record['Histórico'] || record['description'] || '';
        const valor = parseBrazilianNumber(record['Valor'] || record['amount'] || record['Crédito (R$)'] || record['Débito (R$)']);
        if (!valor) continue;

        resultItems.transacoes.push({
          data: parseBrazilianDate(record['Data'] || record['date']),
          descricao: desc,
          valor: Math.abs(valor),
          tipo: valor > 0 ? 'receita' : 'despesa'
        });
      }
    } else if (file_type.includes('spreadsheetml') || file_type.includes('xlsx')) {
        const buffer = await fileData.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        for (const record of json as any[]) {
            const desc = record['Histórico'] || record['Produto'] || record['description'] || '';
            const valor = parseBrazilianNumber(record['Valor Total'] || record['total_value'] || record['Valor']);
            
            if (record['Ticker'] || record['Produto']) {
                const tipo = String(record['Tipo'] || '').toLowerCase();
                if (tipo.includes('dividendo') || tipo.includes('juros')) {
                    resultItems.proventos.push({
                        data: parseBrazilianDate(record['Data'] || record['date']),
                        ticker: record['Ticker'] || record['Produto'],
                        tipo: record['Tipo'],
                        valor_liquido: Math.abs(valor || 0)
                    });
                } else {
                    resultItems.ordens.push({
                        data: parseBrazilianDate(record['Data'] || record['date']),
                        ticker: record['Ticker'] || record['Produto'],
                        tipo: tipo.includes('venda') ? 'venda' : 'compra',
                        quantidade: parseBrazilianNumber(record['Quantidade']),
                        preco_unitario: parseBrazilianNumber(record['Preço Unitário']),
                        valor_total: Math.abs(valor || 0)
                    });
                }
            } else if (valor) {
                resultItems.transacoes.push({
                    data: parseBrazilianDate(record['Data'] || record['date']),
                    descricao: desc,
                    valor: Math.abs(valor),
                    tipo: valor > 0 ? 'receita' : 'despesa'
                });
            }
        }
    } else if (file_type.includes('pdf')) {
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const aiData = await parsePDFWithAI(base64, gemini_api_key);
        
        resultItems.transacoes = aiData.transacoes?.map((t: any) => ({
            data: t.date,
            descricao: t.description,
            valor: Math.abs(t.amount),
            tipo: t.type
        })) || [];
        
        resultItems.ordens = aiData.investimentos?.filter((i: any) => i.type !== 'provento').map((i: any) => ({
            data: i.date,
            ticker: i.ticker,
            tipo: i.type,
            quantidade: i.quantity,
            preco: i.price,
            total: i.total
        })) || [];

        resultItems.proventos = aiData.investimentos?.filter((i: any) => i.type === 'provento').map((i: any) => ({
            data_pagamento: i.date,
            ticker: i.ticker,
            tipo: 'Rendimento',
            valor_liquido: i.total
        })) || [];
    }

    // Categorização
    const userIdRecord = await supabaseAdmin.from('statement_uploads').select('user_id').eq('id', statement_upload_id).single();
    const userId = userIdRecord.data?.user_id;

    if (resultItems.transacoes.length > 0) {
        const descriptionsToAICategorize: string[] = [];
        for (const tx of resultItems.transacoes) {
            tx.user_id = userId;
            tx.statement_upload_id = statement_upload_id;
            
            // Heurística
            const upperDesc = tx.descricao.toUpperCase();
            let cat = 'Outros';
            for (const [key, category] of Object.entries(KEYWORD_MAP)) {
                if (upperDesc.includes(key)) { cat = category; break; }
            }
            tx.categoria_id = null; 
            tx.categoria_nome = cat; 

            if (cat === 'Outros' && gemini_api_key) {
                descriptionsToAICategorize.push(tx.descricao);
            }
        }

        if (descriptionsToAICategorize.length > 0 && gemini_api_key) {
            const aiCats = await categorizeWithAI(descriptionsToAICategorize, gemini_api_key);
            for (const tx of resultItems.transacoes) {
                if (tx.categoria_nome === 'Outros' && aiCats[tx.descricao]) {
                    tx.categoria_nome = aiCats[tx.descricao];
                }
            }
        }

        // Map names to IDs
        const { data: categorias } = await supabaseAdmin.from('categorias').select('id, nome');
        for (const tx of resultItems.transacoes) {
            const catObj = categorias?.find(c => c.nome === tx.categoria_nome);
            if (catObj) tx.categoria_id = catObj.id;
            delete tx.categoria_nome;
        }

        const { error: txErr } = await supabaseAdmin.from('transacoes').insert(resultItems.transacoes);
        if (txErr) throw txErr;
    }

    if (resultItems.ordens.length > 0) {
        resultItems.ordens.forEach((o: any) => { 
            o.user_id = userId; 
            o.statement_upload_id = statement_upload_id; 
            // Database expects 'preco' and 'total'
        });
        await supabaseAdmin.from('ordens').insert(resultItems.ordens);
    }

    if (resultItems.proventos.length > 0) {
        resultItems.proventos.forEach((p: any) => { 
            p.user_id = userId; 
            p.statement_upload_id = statement_upload_id; 
            // Database expects 'data_pagamento'
        });
        await supabaseAdmin.from('proventos').insert(resultItems.proventos);
    }

    await supabaseAdmin.from('statement_uploads').update({ status: 'completed' }).eq('id', statement_upload_id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error('Error:', error);
    await supabaseAdmin.from('statement_uploads').update({ status: 'failed', error_message: error.message }).eq('id', statement_upload_id);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
