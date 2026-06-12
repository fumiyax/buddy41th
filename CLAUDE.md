# 01_BUDDY41TH - バディ世田谷41期

## 概要
バディ世田谷41期の各種ツールをまとめた GitHub Pages サイト。
- リポジトリ: https://github.com/fumiyax/buddy41th
- デプロイ: GitHub Pages（main ブランチ直接 push）

## 開発ルール

### バージョン管理
- **index.html を修正するたびにヘッダーの ver 番号を1つ上げること**（`badge-ver` の表示テキスト）
- GitHub Pages への反映に時間差があるため、ver 番号で最新かどうかを判別する

### バックアップ
- **index.html を修正する前に必ずバックアップを取ること**
- 保存先: 各サブフォルダの `backup/`（referee なら `referee/backup/`）
- 命名規則: `index_ver{番号}_{変更内容の短い説明}.html`
- バックアップ後、下記のバックアップ履歴に追記すること

### Git 運用
- `backup/` は `.gitignore` で除外されているため、**git add の対象にしないこと**
- `_*/`（非デプロイプロジェクト）も `.gitignore` で除外済み
- コミット対象は `referee/index.html` や `CLAUDE.md` など、除外パターン以外のファイルのみ
- push は `main` ブランチに直接行う

## ディレクトリ構成

```
01_BUDDY41TH/
├── index.html              ← ポータルページ
├── shared/                 ← 共有アセット（ロゴ等）
├── referee/                ← 審判管理システム（Web アプリ）
│   ├── index.html
│   └── backup/
├── rakuren/                ← 将来用（Web アプリ枠）
├── backup/                 ← ポータルのバックアップ
├── _setagaya-taikai/       ← 世田谷大会監視 GAS（非デプロイ）
└── _spain-soccer/          ← スペインサッカー育成資料（非デプロイ）
```

## referee/index.html 概要

審判管理システム。単一 HTML ファイルで構成された SPA。

### 機能
- **試合管理**: 試合の追加・編集・削除、月別フィルタ（今月/翌月）、統計表示
- **審判出欠管理**: 試合ごとに審判の出欠（稼働/欠席/未定）を登録、コメント入力可能
- **審判一覧**: 審判の登録・編集・削除、名前検索・ライセンス級フィルタ
- **CONFIG**: データ再読み込み、GAS コード表示・コピー

### 技術構成
- **フロントエンド**: HTML/CSS/JS（フレームワークなし）、Noto Sans JP + Bebas Neue フォント、モバイル対応レスポンシブ
- **バックエンド**: Google Apps Script（GAS）経由で Google スプレッドシートに CRUD。POST→GET 自動フォールバック、10秒タイムアウト
- **データ**: スプレッドシート3シート構成（matches / referees / attendance）
- **UI**: スティッキーヘッダー、タブナビ、ボトムシートモーダル、トースト通知、デバッグパネル

### データスキーマ
| シート | カラム |
|---|---|
| matches | id, date, type(`official`/`friendly`), title, location, time, category, fileUrl, note |
| referees | id, name, license(`1級`〜`4級`,`女子1級`,`女子2級`,空), billing(bool), team(`A`/`B`), note, coachLicense(`S級`〜`D級`,`キッズリーダー`,空) |
| attendance | eventId, memberId, status(`ok`/`ng`/`pnd`), comment |

### GAS API
- **エンドポイント**: `https://script.google.com/macros/s/AKfycbzL-SQgXO1R58lwnglbr9dp0f7xzmlzCN2gozSgn4aK1rwkrrOD3OvC6e7vPzN2FTUTcg/exec`
- **通信方式**: POST（失敗時 GET にフォールバック）、タイムアウト10秒

| action | 説明 | 主要パラメータ |
|---|---|---|
| `getAll` | 全データ取得 | なし |
| `saveEvent` | 試合の追加/更新 | id, date, type, title, location, time, category, fileUrl, note |
| `deleteEvent` | 試合削除 | id |
| `saveMember` | 審判の追加/更新 | id, name, license, billing, team, note, coachLicense |
| `deleteMember` | 審判削除 | id |
| `setAttendance` | 出欠登録 | eventId, memberId, status, comment |

## バックアップ履歴（referee/）
| ファイル名 | 日付 | 内容 |
|---|---|---|
| `index_ver07_original.html` | 2025-03-25 | 初期状態（ver07） |
| `index_ver08_team-added.html` | 2025-03-25 | 公式戦実績タブ追加＋審判チーム(A/B)追加 |
| `index_ver08_before-team-color.html` | 2025-03-25 | ver09変更前のバックアップ |
| `index_ver09_team-color.html` | 2025-03-25 | チームカラー色分け |
| `index_ver10_wording-fix.html` | 2025-03-25 | 稼働→参加に表記変更 |
| `index_ver11_sort-members.html` | 2025-03-25 | 出欠テーブル50音順ソート |
| `index_ver12_compact-list.html` | 2025-03-25 | 審判一覧1行コンパクト化 |
| `index_ver13_aligned-list.html` | 2025-03-25 | 審判一覧レイアウト整列 |
| `index_ver14_license-colors.html` | 2025-03-25 | ライセンス色分け＋モーダル改善 |
| `index_ver15_att-tags.html` | 2025-03-25 | 出欠テーブルにタグ表示統一 |
| `index_ver16_att-layout.html` | 2025-03-25 | 出欠テーブルレイアウト整列 |
| `index_ver17_event-link.html` | 2025-03-25 | イベント直リンク機能追加 |
| `index_ver18_buttons-top.html` | 2025-03-25 | ボタンを詳細上部に移動 |
| `index_ver19_line-notify.html` | 2025-03-26 | LINE前日通知機能追加 |
| `index_ver20_month-filter.html` | 2025-03-26 | 試合フィルタに過去分追加 |
| `index_ver21_today-filter.html` | 2025-03-26 | フィルタを今日基準に変更 |
| `index_ver22_before-restructure.html` | 2026-03-28 | ディレクトリ構成リストラクチャ前 |
| `index_ver28_before-line-flex.html` | 2026-04-13 | LINE通知Flex Message化前 |
| `index_ver29_before-redesign.html` | 2026-05-02 | デザインモダン化前 |
| `index_ver30_before-line-share.html` | 2026-06-12 | LINE共有ボタン追加前 |
| `index_ver31_before-sky-blue.html` | 2026-06-12 | Sky Blueカラーテーマ適用前 |
| `index_ver32_before-logo-improve.html` | 2026-06-12 | ロゴ視認性向上前 |
| `index_ver33_before-logo-transparent.html` | 2026-06-12 | ロゴ透明背景化前 |
