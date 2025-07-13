import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-static'; // Add this line

export async function GET() {
  try {
    // 废弃 name.txt 的内容，直接返回空数组
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to load audio configurations:', error);
    return new Response(JSON.stringify({ error: 'Failed to load audio configurations' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}