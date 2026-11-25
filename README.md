# EN•joy Stage 1 テスト版（GitHub Pages デプロイ用）

10人テストで「30秒で登録 → デジタル名刺プレビュー → EN開発ルームでマッチング」を検証するための軽量フロントエンド構成です。

## ファイル構成
- `index.html`：画面構造（4ステップ登録・デジタル名刺・EN開発ルーム・ロック中タブ）
- `style.css`：2〜3色和モダンミニマル設計・スクロール連動ナビ・スマホ幅プレビュー
- `data.js`：業種/活動マスタ・担当者省略コード・localStorageラッパー（将来のDB差し替え口）
- `app.js`：インタラクション全般（2段階開示・担当者コード自動発行・簡易トーク）

## GitHub Pages 公開手順（3分）
1. GitHub で新しいリポジトリ（例：`enjoy-stage1`）を **Public** で作成する
2. このフォルダ内の4ファイル（`index.html`, `style.css`, `data.js`, `app.js`）をアップロード（または `git push`）する
3. リポジトリ上部の **Settings** → 左メニュー **Pages** を開く
4. Branch を `main` / Folder を `/ (root)` にして **Save** を押す
5. 1〜2分で `https://あなたのID.github.io/enjoy-stage1/` が公開されます！
