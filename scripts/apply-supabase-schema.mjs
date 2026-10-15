import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const connectionString = process.argv[2] || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error('BŁĄD: Podaj connection string do bazy PostgreSQL/Supabase.');
    console.error('Przykład: node scripts/apply-supabase-schema.mjs "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"');
    process.exit(1);
  }

  console.log('🔄 Łączenie z bazą PostgreSQL Supabase...');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Połączono pomyślnie z bazą danych!');

    const schemaPath = path.resolve(__dirname, '../supabase/schema.sql');
    const seedPath = path.resolve(__dirname, '../supabase/seed.sql');

    console.log(`📄 Odczytywanie schematu: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Wykonywanie tabel, typów, widoków i uprawnień RLS...');
    await client.query(schemaSql);
    console.log('✅ Schemat bazy został pomyślnie utworzony!');

    if (fs.existsSync(seedPath)) {
      console.log(`🌱 Odczytywanie danych początkowych: ${seedPath}`);
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      console.log('🚀 Wgrywanie początkowych danych osiedla Stare Stawy...');
      await client.query(seedSql);
      console.log('✅ Dane początkowe (seed) zostały wgrane!');
    }

    console.log('🎉 Wszystko gotowe! Baza danych Supabase jest w 100% przygotowana do działania.');
  } catch (error) {
    console.error('❌ Błąd podczas wdrażania bazy danych:', error.message);
    if (error.detail) console.error('Szczegóły:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
