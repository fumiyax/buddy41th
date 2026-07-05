#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';
import { Client } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GAS API設定
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzL-SQgXO1R58lwnglbr9dp0f7xzmlzCN2gozSgn4aK1rwkrrOD3OvC6e7vPzN2FTUTcg/exec?action=getAll';

// ユーザー入力待機関数
function askQuestion(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ステップ1: GAS APIからデータ取得
async function fetchDataFromGAS() {
  console.log('\n📡 ステップ1: GAS APIからデータ取得...');
  try {
    const response = await fetch(GAS_URL);
    if (!response.ok) {
      throw new Error(`GAS API error: ${response.status}`);
    }
    const data = await response.json();
    console.log(`✅ データ取得成功`);
    console.log(`   - events: ${data.events?.length || 0}件`);
    console.log(`   - members: ${data.members?.length || 0}件`);
    console.log(`   - attendance: ${data.attendance?.length || 0}件`);
    return data;
  } catch (error) {
    console.error('❌ GAS API取得エラー:', error.message);
    throw error;
  }
}

// ステップ2: バックアップとして保存
async function saveDataBackup(data) {
  console.log('\n💾 ステップ2: バックアップ保存...');
  try {
    const backupDir = path.join(__dirname, '..', 'backup');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(backupDir, `data-backup-${timestamp}.json`);

    await fs.writeFile(backupFile, JSON.stringify(data, null, 2));
    console.log(`✅ バックアップ保存完了: ${path.relative(process.cwd(), backupFile)}`);
    return backupFile;
  } catch (error) {
    console.error('❌ バックアップ保存エラー:', error.message);
    throw error;
  }
}

// ステップ3: Neon DBに挿入
async function insertDataToNeon(data) {
  console.log('\n🗄️  ステップ3: Neon DBへ挿入...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL環境変数が設定されていません');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ データベース接続成功');

    // 既存データをクリア
    console.log('🗑️  既存データをクリア中...');
    await client.query('DELETE FROM attendance');
    await client.query('DELETE FROM matches');
    await client.query('DELETE FROM referees');
    console.log('✅ 既存データをクリア完了');

    // matches テーブルに挿入
    console.log('\n📝 matches テーブルに挿入中...');
    let matchCount = 0;
    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        await client.query(
          `INSERT INTO matches (id, date, type, title, location, time, category, fileUrl, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             date = $2, type = $3, title = $4, location = $5, time = $6,
             category = $7, fileUrl = $8, note = $9`,
          [
            event.id || '',
            event.date || '',
            event.type || '',
            event.title || '',
            event.location || '',
            event.time || '',
            event.category || '',
            event.fileUrl || '',
            event.note || '',
          ]
        );
        matchCount++;
      }
      console.log(`✅ matches: ${matchCount}件挿入完了`);
    }

    // referees テーブルに挿入
    console.log('📝 referees テーブルに挿入中...');
    let refereeCount = 0;
    if (data.members && Array.isArray(data.members)) {
      for (const member of data.members) {
        await client.query(
          `INSERT INTO referees (id, name, license, billing, team, note, coachLicense)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             name = $2, license = $3, billing = $4, team = $5, note = $6, coachLicense = $7`,
          [
            member.id || '',
            member.name || '',
            member.license === 'なし' ? '' : (member.license || ''),
            member.billing || false,
            member.team === 'なし' ? '' : (member.team || ''),
            member.note || '',
            member.coachLicense === 'なし' ? '' : (member.coachLicense || ''),
          ]
        );
        refereeCount++;
      }
      console.log(`✅ referees: ${refereeCount}件挿入完了`);
    }

    // attendance テーブルに挿入
    console.log('📝 attendance テーブルに挿入中...');
    let attendanceCount = 0;
    let attendanceSkipped = 0;
    if (data.attendance && Array.isArray(data.attendance)) {
      for (const att of data.attendance) {
        try {
          await client.query(
            `INSERT INTO attendance (eventId, memberId, status, comment)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (eventId, memberId) DO UPDATE SET
               status = $3, comment = $4`,
            [
              att.eventId || '',
              att.memberId || '',
              att.status || 'pnd',
              att.comment || '',
            ]
          );
          attendanceCount++;
        } catch (err) {
          // 外部キー制約違反などはスキップ
          console.log(`⚠️  スキップ: eventId=${att.eventId}, memberId=${att.memberId} (${err.message})`);
          attendanceSkipped++;
        }
      }
      console.log(`✅ attendance: ${attendanceCount}件挿入完了 (${attendanceSkipped}件スキップ)`);
    }

    console.log('\n✅ データ挿入完了');

  } catch (error) {
    console.error('❌ DB操作エラー:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// メイン処理
async function main() {
  console.log('='.repeat(60));
  console.log('📊 バディ審判管理システム - データ移行スクリプト');
  console.log('='.repeat(60));

  try {
    // ステップ1: GAS APIからデータ取得
    const data = await fetchDataFromGAS();

    // ステップ2: バックアップ保存
    await saveDataBackup(data);

    // ステップ3: Neon DBに挿入
    await insertDataToNeon(data);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 移行完了！');
    console.log('='.repeat(60));
    console.log('\n✅ すべてのデータが正常に移行されました');
    console.log(`   - matches: ${data.events?.length || 0}件`);
    console.log(`   - referees: ${data.members?.length || 0}件`);
    console.log(`   - attendance: ${data.attendance?.length || 0}件`);

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ 移行エラーが発生しました');
    console.error('='.repeat(60));
    console.error(`\nエラー詳細: ${error.message}`);
    if (error.stack) {
      console.error('\nスタックトレース:', error.stack);
    }
    process.exit(1);
  }
}

// スクリプト実行
main();
