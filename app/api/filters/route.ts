// app/api/filters/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [societa] = await pool.execute<RowDataPacket[]>(
      'SELECT DISTINCT societa FROM progetti ORDER BY societa'
    );
    const [clienti] = await pool.execute<RowDataPacket[]>(
      'SELECT DISTINCT cliente FROM progetti ORDER BY cliente'
    );
    const [anni] = await pool.execute<RowDataPacket[]>(
      'SELECT DISTINCT anno_inizio as anno FROM progetti UNION SELECT DISTINCT anno_fine as anno FROM progetti WHERE anno_fine IS NOT NULL ORDER BY anno DESC'
    );

    return NextResponse.json({
      societa: societa.map(r => r.societa),
      clienti: clienti.map(r => r.cliente),
      anni: anni.map(r => r.anno)
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}