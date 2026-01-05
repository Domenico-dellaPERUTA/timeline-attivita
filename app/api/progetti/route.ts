// app/api/progetti/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool, Progetto } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const societa = searchParams.get('societa');
    const cliente = searchParams.get('cliente');
    const anno = searchParams.get('anno');

    let query = 'SELECT * FROM progetti WHERE 1=1';
    const params: any[] = [];

    if (societa) {
      query += ' AND societa = ?';
      params.push(societa);
    }
    if (cliente) {
      query += ' AND cliente = ?';
      params.push(cliente);
    }
    if (anno) {
      query += ' AND (anno_inizio <= ? AND (anno_fine IS NULL OR anno_fine >= ?))';
      params.push(anno, anno);
    }

    query += ' ORDER BY anno_inizio DESC, mese_inizio DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: Progetto = await request.json();
    
    const [result] = await pool.execute(
      `INSERT INTO progetti (nome, societa, cliente, tecnologia, descrizione, anno_inizio, mese_inizio, anno_fine, mese_fine, impegno_saltuario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [body.nome, body.societa, body.cliente, body.tecnologia, body.descrizione, 
       body.anno_inizio, body.mese_inizio, body.anno_fine, body.mese_fine, body.impegno_saltuario]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
