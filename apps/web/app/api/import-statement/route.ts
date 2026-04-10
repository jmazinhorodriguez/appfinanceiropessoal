import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const supabaseClient = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Need admin privileges for crossing RLS if upload fails or calling Edge function specifically with secrets
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const fileExtension = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExtension}`;
  const storagePath = `${user.id}/${fileName}`;

  try {
    // 1. Upload do arquivo para o Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('statement_uploads')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload file to storage: ${uploadError.message}`);
    }

    // 2. Registrar o upload na tabela public.statement_uploads
    const { data: uploadRecord, error: insertError } = await supabaseClient
      .from('statement_uploads')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        storage_path: storagePath,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      await supabaseAdmin.storage.from('statement_uploads').remove([storagePath]);
      throw new Error(`Failed to record upload in database: ${insertError.message}`);
    }

    // 3. Invocar a Edge Function para parsing
    const { data: edgeFunctionResponse, error: edgeFunctionError } = await supabaseAdmin.functions.invoke('parse-statement', {
      body: {
        storage_path: storagePath,
        statement_upload_id: uploadRecord.id,
        file_type: file.type,
        gemini_api_key: process.env.GEMINI_API_KEY,
      },
    });

    if (edgeFunctionError) {
      console.error('Edge Function invocation error:', edgeFunctionError);
      await supabaseAdmin.from('statement_uploads').update({ status: 'failed', error_message: edgeFunctionError.message }).eq('id', uploadRecord.id);
      throw new Error(`Failed to invoke parsing function: ${edgeFunctionError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded and parsing initiated.',
      uploadId: uploadRecord.id,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Import statement API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during import.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
