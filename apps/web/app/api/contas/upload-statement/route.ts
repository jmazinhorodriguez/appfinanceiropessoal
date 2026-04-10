import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { parseStatement } from '@/lib/parsers/statement-parser';
import { categorizeBatchWithAI } from '@/lib/ai/categorize';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;
    const accountId = formData.get('accountId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    
    const validTypes = ['pdf', 'csv', 'ofx', 'xlsx'];
    if (!validTypes.includes(fileType)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('statements')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Create record
    const { data: record, error: dbError } = await supabase
      .from('extratos_importados')
      .insert({
        user_id: user.id,
        conta_id: accountId || null,
        nome_arquivo: file.name,
        formato: fileType,
        status: 'processando'
      })
      .select('id')
      .single();

    if (dbError) throw dbError;

    // Process synchronously since this is serverless
    await processAsync(record.id, user.id, file, fileType, accountId);

    return NextResponse.json({ uploadId: record.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processAsync(uploadId: string, userId: string, file: File, fileType: string, accountId: string) {
  const supabase = getSupabase();
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const transactions = await parseStatement(buffer, fileType);
    
    // Categorization AI Batch
    const descriptionsToCategorize = transactions.map(tx => tx.description);
    const aiCategories = await categorizeBatchWithAI(descriptionsToCategorize);

    // Fetch categories for UUID mapping
    const { data: dbCategories } = await supabase.from('categorias').select('id, nome');
    const categoryMap = new Map();
    dbCategories?.forEach(c => categoryMap.set((c.nome || '').toLowerCase(), c.id));

    // Categorize and enrich
    const enrichedTxs = transactions.map(tx => {
      const catName = aiCategories[tx.description] || tx.category || 'Outros';
      const catId = categoryMap.get(catName.toLowerCase()) || null;
      
      return {
        user_id: userId,
        conta_id: accountId || null,
        descricao: tx.description,
        valor: tx.amount,
        tipo: tx.type,
        data: tx.date,
        origem: `import_${fileType}`,
        categoria_id: catId,
        status: 'efetivado'
      };
    });

    if (enrichedTxs.length > 0) {
      const { error: insertError } = await supabase.from('transacoes').insert(enrichedTxs);
      if (insertError) throw insertError;
    }

    await supabase.from('extratos_importados').update({
      status: 'concluido',
      total_importadas: enrichedTxs.length
    }).eq('id', uploadId);

  } catch (error: any) {
    await supabase.from('extratos_importados').update({
      status: 'erro',
      erro_mensagem: error.message
    }).eq('id', uploadId);
  }
}
