# 開発ルール

## バージョン管理
- **index.htmlを修正するたびにヘッダーのver番号を1つ上げること**（`badge-ver`の表示テキスト）
- GitHub Pagesへの反映に時間差があるため、ver番号で最新かどうかを判別する

## バックアップ
- **index.htmlを修正する前に必ずバックアップを取ること**
- 保存先: `01_buddy41th/backup/`
- 命名規則: `index_ver{番号}_{変更内容の短い説明}.html`
- バックアップ後、下記のバックアップ履歴に追記すること

## バックアップ履歴
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
| `index_ver22_before-date-fix.html` | 2026-03-28 | 試合編集時の日付リセット修正前 |

---

# 01_BUDDY プロジェクト概要

## バディSC（世田谷）
- 子どもが在籍している少年サッカークラブ
- 審判ライセンスを保有しており審判活動を行っている（パパコーチではない）

## tesoro
- バディの友人たちと試合数を増やすために活動している裏チーム

## ディレクトリ構成
- `01_buddy41th/` - バディSC関連
- `02_tesoro/` - tesoro関連

## index.html（01_buddy41th/）概要

バディ世田谷41期の**審判管理システム**（現在ver09）。単一HTMLファイルで構成されたSPA。

### 機能
- **試合管理**: 試合の追加・編集・削除、月別フィルタ（今月/翌月）、統計表示（審判数・登録審判・更新料請求・今月試合数）
- **審判出欠管理**: 試合ごとに審判の出欠（稼働/欠席/未定）を登録、コメント入力可能。公式戦では資格保有者のみ選択可
- **審判一覧**: 審判の登録・編集・削除、名前検索・ライセンス級フィルタ（1〜4級、女子1〜2級、なし）、更新料請求フラグ管理
- **CONFIG**: データ再読み込み、GASコード表示・コピー

### 技術構成
- **フロントエンド**: HTML/CSS/JS（フレームワークなし）、Noto Sans JP + Bebas Neueフォント、モバイル対応レスポンシブ
- **バックエンド**: Google Apps Script（GAS）経由でGoogleスプレッドシートにCRUD。POST→GET自動フォールバック、10秒タイムアウト
- **データ**: スプレッドシート3シート構成（matches / referees / attendance）
- **UI**: スティッキーヘッダー、タブナビ、ボトムシートモーダル、トースト通知、デバッグパネル

### データスキーマ
| シート | カラム |
|---|---|
| matches | id, date, type(`official`/`friendly`), title, location, time, category, fileUrl, note |
| referees | id, name, license(`1級`〜`4級`,`女子1級`,`女子2級`,`なし`), billing(bool), team(`A`/`B`), note |
| attendance | eventId, memberId, status(`ok`/`ng`/`pnd`), comment |

### GAS API
- **エンドポイント**: `https://script.google.com/macros/s/AKfycbzL-SQgXO1R58lwnglbr9dp0f7xzmlzCN2gozSgn4aK1rwkrrOD3OvC6e7vPzN2FTUTcg/exec`
- **通信方式**: POST（失敗時GETにフォールバック）、タイムアウト10秒

| action | 説明 | 主要パラメータ |
|---|---|---|
| `getAll` | 全データ取得 | なし |
| `saveEvent` | 試合の追加/更新 | id, date, type, title, location, time, category, fileUrl, note |
| `deleteEvent` | 試合削除 | id |
| `saveMember` | 審判の追加/更新 | id, name, license, billing, team, note |
| `deleteMember` | 審判削除 | id |
| `setAttendance` | 出欠登録 | eventId, memberId, status, comment |
