#!/usr/bin/env node

import fs from 'fs/promises';
import { Client } from '@neondatabase/serverless';

const client = new Client(process.env.DATABASE_URL);

try {
  await client.connect();
  console.log('✅ DB接続成功');

  // テーブル削除
  console.log('🗑️  既存テーブル削除中...');
  const dropSql = await fs.readFile('sql/drop-tables.sql', 'utf-8');
  await client.query(dropSql);
  console.log('✅ テーブル削除完了');

  // テーブル再作成
  console.log('📝 テーブル再作成中...');
  const createSql = await fs.readFile('sql/schema-bigint.sql', 'utf-8');
  await client.query(createSql);
  console.log('✅ テーブル再作成完了');

} catch (error) {
  console.error('❌ エラー:', error.message);
  process.exit(1);
} finally {
  await client.end();
}
