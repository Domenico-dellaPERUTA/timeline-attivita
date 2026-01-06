// app/api/progetti/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool, Progetto } from '@/lib/db';

type Params = {
  id: string;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const body: Progetto = await request.json();

    await pool.execute(
      `UPDATE progetti SET 
        nome=?, societa=?, cliente=?, tecnologia=?, descrizione=?, 
        anno_inizio=?, mese_inizio=?, anno_fine=?, mese_fine=?, impegno_saltuario=?
       WHERE id=?`,
      [
        body.nome,
        body.societa,
        body.cliente,
        body.tecnologia,
        body.descrizione,
        body.anno_inizio,
        body.mese_inizio,
        body.anno_fine,
        body.mese_fine,
        body.impegno_saltuario,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;

    await pool.execute('DELETE FROM progetti WHERE id=?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
