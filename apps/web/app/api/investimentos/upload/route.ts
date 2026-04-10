import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import pdfParse from 'pdf-parse';
import * as xlsx from 'xlsx';
import { parse as parseCSV } from 'csv-parse/sync';
import { parseB3File, B3Trade } from '@/lib/parsers/b3-parser';
import { parseB3WithAI } from '@/lib/ai/b3-extractor';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json({ error: 'ArquivoAusente' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let contentStr = '';
    
    if (fileType === 'pdf') {
      const data = await pdfParse(buffer);
      contentStr = data.text;
    } else if (fileType === 'xlsx') {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const rows = xlsx.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], { header: 1 });
      contentStr = rows.map(r => Object.values(r).join(' ')).join('\n');
    } else if (fileType === 'csv') {
      const records = parseCSV(buffer, { 
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
        bom: true,
        delimiter: [',', ';', '\t']
      }) as any[][];
      contentStr = records.map(r => r.join(' ')).join('\n');
    } else {
      contentStr = buffer.toString('utf-8');
    }

    let result = parseB3File(contentStr);

    // Fallback absoluto: Se a heurística e as regexes falharem (layout exótico) ou se quiser achar proventos.
    // Sempre passamos pela IA caso não haja trades encontrados (ex: planilha só de proventos)
    let aiExtractions: any = null;
    if (result.trades.length === 0) {
       console.log('Regex parser failed. Falling back to Gemini AI for B3/Proventos extraction...');
       const aiResult = await parseB3WithAI(contentStr);
       aiExtractions = aiResult;
       
       if ((aiResult.trades && aiResult.trades.length > 0) || (aiResult.proventos && aiResult.proventos.length > 0)) {
         result.trades = aiResult.trades || [];
         (result as any).proventos = aiResult.proventos || [];
         result.errors = [];
       }
    }

    const trades = result.trades || [];
    const proventos = (result as any).proventos || (aiExtractions ? aiExtractions.proventos : []);

    if (result.errors.length > 0 && trades.length === 0 && proventos.length === 0) {
      return NextResponse.json({ 
        error: 'Não foi possível ler as notas de corretagem. Verifique se é um formato suportado.' 
      }, { status: 400 });
    }

    // Prepare inserts into `ordens` table
    const ordensToInsert = trades.map((t: B3Trade) => ({
      user_id: user.id,
      ticker: t.ticker,
      tipo: t.type === 'compra' ? 'compra' : 'venda',
      quantidade: t.quantity,
      preco: t.unit_price,
      total: t.net_value,
      taxas: t.fees,
      corretagem: 0,
      data: t.date,
      mercado: t.market,
      nota_corretagem: Object.keys(trades).length.toString() // placeholder
    }));

    if (ordensToInsert.length > 0) {
      const { error } = await supabase.from('ordens').insert(ordensToInsert);
      if (error) {
        console.error('Insert error:', error);
        return NextResponse.json({ error: 'Erro ao salvar ordens no banco de dados.' }, { status: 500 });
      }
    }

    // Prepare inserts into `proventos` table
    const proventosToInsert = proventos.map((p: any) => ({
      user_id: user.id,
      ticker: p.ticker,
      tipo: p.tipo,
      quantidade_custodia: p.quantidade_custodia,
      valor_por_cota: p.valor_por_cota,
      valor_bruto: p.valor_liquido,
      ir_retido: 0,
      valor_liquido: p.valor_liquido,
      data_pagamento: p.data,
      data_ex: p.data,
      observacao: 'Importado por nota/planilha inteligente'
    }));

    if (proventosToInsert.length > 0) {
      const { error: provError } = await supabase.from('proventos').insert(proventosToInsert);
      if (provError) {
        console.error('Insert proventos error:', provError);
        return NextResponse.json({ error: 'Erro ao salvar proventos no banco de dados.' }, { status: 500 });
      }
    }

    return NextResponse.json({
      status: 'concluido',
      count: ordensToInsert.length + proventosToInsert.length,
      trades: ordensToInsert,
      proventos: proventosToInsert
    });

  } catch (err: any) {
    console.error('Upload Note API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

