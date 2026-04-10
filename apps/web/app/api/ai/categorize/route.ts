import { NextResponse } from 'next/server';
import { categorizeBatchWithAI } from '@/lib/ai/categorize';

export async function POST(req: Request) {
  try {
    const { descriptions } = await req.json();

    if (!descriptions || !Array.isArray(descriptions)) {
      return NextResponse.json({ error: 'Descriptions array is required' }, { status: 400 });
    }

    const categories = await categorizeBatchWithAI(descriptions);
    return NextResponse.json({ categories });

  } catch (error) {
    console.error('Error classifying transactions via Gemini:', error);
    return NextResponse.json({ categories: {}, error: String(error) });
  }
}

