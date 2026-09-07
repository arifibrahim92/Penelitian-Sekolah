import { NextResponse } from 'next/server';
import { generateExcelSurveyTemplateBuffer } from '@/lib/excelTemplate.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buffer = generateExcelSurveyTemplateBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Template_Input_Kuesioner_Respon_Siswa.xlsx"',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err) {
    console.error('Error generating survey Excel template:', err);
    return NextResponse.json({ error: 'Gagal membuat template berkas Excel kuesioner' }, { status: 500 });
  }
}
