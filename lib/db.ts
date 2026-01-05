// lib/db.ts
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export interface Progetto {
  id?: number;
  nome: string;
  societa: string;
  cliente: string;
  tecnologia: string;
  descrizione: string;
  anno_inizio: number;
  mese_inizio: number;
  anno_fine?: number | null;
  mese_fine?: number | null;
  impegno_saltuario: boolean;
}
