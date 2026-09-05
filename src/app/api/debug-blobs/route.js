import { NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';

export async function GET() {
  try {
    const store = getStore('survey-cloud-store');
    await store.setJSON('debug_test', { time: new Date().toISOString(), ok: true });
    const val = await store.get('debug_test', { type: 'json' });
    return NextResponse.json({ success: true, val, env: {
      hasNetlify: Boolean(process.env.NETLIFY),
      hasBlobsContext: Boolean(process.env.NETLIFY_BLOBS_CONTEXT),
      keys: Object.keys(process.env).filter(k => k.includes('NETLIFY') || k.includes('BLOB'))
    }});
  } catch (err) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack,
      name: err.name,
      keys: Object.keys(process.env).filter(k => k.includes('NETLIFY') || k.includes('BLOB'))
    }, { status: 500 });
  }
}
