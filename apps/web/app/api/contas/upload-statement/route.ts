import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { parseStatement } from '@/lib/parsers/statement-parser';

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
      .from('statement_uploads')
      .insert({
        user_id: user.id,
        account_id: accountId || null,
        file_name: file.name,
        file_type: fileType,
        file_url: fileName,
        status: 'processing'
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
    
    // Categorize and enrich
    const enrichedTxs = transactions.map(tx => ({
      ...tx,
      user_id: userId,
      account_id: accountId || null,
      source: `extrato_${fileType}`
    }));

    if (enrichedTxs.length > 0) {
      const { error: insertError } = await supabase.from('transactions').insert(enrichedTxs);
      if (insertError) throw insertError;
    }

    await supabase.from('statement_uploads').update({
      status: 'completed',
      transactions_imported: enrichedTxs.length
    }).eq('id', uploadId);

  } catch (error: any) {
    await supabase.from('statement_uploads').update({
      status: 'error',
      error_message: error.message
    }).eq('id', uploadId);
  }
}
