# 📁 AI ConectX ファイル変更追跡ガイド

## 🚀 クイックスタート

### 1. 開発ツールセットアップ
```bash
# 必要なツールを一括インストール
./scripts/setup-dev-tools.sh
```

### 2. 基本的な使用方法
```bash
# Git履歴を見やすく表示
./scripts/git-history-viewer.sh

# 変更差分を詳細表示
./scripts/git-diff-viewer.sh -r

# リアルタイムでファイル変更を監視
npm run file-monitor
```

## 🔧 利用可能なツール

### 📊 Git履歴可視化
```bash
# 基本的な履歴表示
git log --oneline --graph --all

# 最近の変更ファイル
git log --name-status -5

# 統計情報
git shortlog -sn

# 専用スクリプト
./scripts/git-history-viewer.sh
```

### 📋 差分表示
```bash
# 最近の変更
./scripts/git-diff-viewer.sh -r

# 特定ファイルの差分
./scripts/git-diff-viewer.sh -d components/App.tsx

# 編集者情報
./scripts/git-diff-viewer.sh -b components/App.tsx
```

### 👀 リアルタイム監視
```bash
# Node.jsスクリプト
node scripts/file-change-monitor.js

# Docker使用
docker-compose up filewatcher
```

## 🌐 Web UI ツール

### 1. Gitiles (Git履歴ブラウザ)
```bash
docker-compose up -d gitiles
# http://localhost:8080
```

### 2. GitLab CE (完全なGit管理)
```bash
docker-compose up -d gitlab
# http://localhost:8081
```

### 3. SonarQube (コード分析)
```bash
docker-compose up -d sonarqube
# http://localhost:9000
```

## 🎯 具体的な使用例

### 最近の変更を確認
```bash
# 今日の変更
git log --since="midnight" --oneline --name-status

# 最新10件のコミット
git log --oneline -10

# 変更されたファイル統計
git log --stat -5
```

### 特定ファイルの履歴
```bash
# App.tsxの変更履歴
git log --follow components/App.tsx

# 差分付きで表示
git log -p components/App.tsx

# 編集者情報
git blame components/App.tsx
```

### ファイル変更監視
```bash
# 全ファイル監視
npm run file-monitor

# 特定ディレクトリのみ
chokidar "components/**" -c "echo 'Changed: {path}'"
```

## 📈 高度な使用方法

### 1. 変更パターン分析
```bash
# 最も変更されたファイル
git log --name-only --pretty=format: | sort | uniq -c | sort -rn | head -10

# 時間帯別の変更
git log --pretty=format:"%h %ad %s" --date=format:"%H" | cut -d' ' -f2 | sort | uniq -c

# 週別の変更
git log --pretty=format:"%h %ad %s" --date=format:"%u" --since="1 month ago" | cut -d' ' -f2 | sort | uniq -c
```

### 2. 協業者の分析
```bash
# 貢献者別統計
git shortlog -sn

# 特定期間の貢献
git log --since="1 week ago" --pretty=format:"%an" | sort | uniq -c
```

### 3. ファイルサイズ追跡
```bash
# 大きなファイルの特定
git ls-files | xargs ls -la | sort -k5 -rn | head -10

# バイナリファイルの確認
git ls-files | xargs file | grep -v text
```

## 🔍 VS Code拡張機能

### 推奨拡張機能
```json
{
  "recommendations": [
    "eamodio.gitlens",
    "donjayamanne.git-extension-pack",
    "mhutchie.git-graph",
    "huizhou.githd",
    "waderyan.gitblame"
  ]
}
```

### 設定例
```json
{
  "gitlens.advanced.messages": {
    "suppressCommitHasNoPreviousCommitWarning": false,
    "suppressCommitNotFoundWarning": false
  },
  "gitlens.blame.highlight.enabled": true,
  "gitlens.currentLine.enabled": true,
  "gitlens.hovers.currentLine.over": "line"
}
```

## 📋 チェックリスト

### 日常的な確認項目
- [ ] 最新の変更を確認
- [ ] 変更されたファイルの差分確認
- [ ] テストファイルの更新状況
- [ ] 設定ファイルの変更
- [ ] ドキュメントの更新

### 定期的な分析
- [ ] 最も変更されたファイル
- [ ] 貢献者別統計
- [ ] コード品質メトリクス
- [ ] 未追跡ファイルの確認

## 🐞 トラブルシューティング

### よくある問題
1. **ファイル監視が動かない**
   - Node.jsとnpmがインストールされているか確認
   - `chokidar-cli`をグローバルインストール

2. **Dockerコンテナが起動しない**
   - Dockerが起動しているか確認
   - ポート競合がないか確認

3. **Git履歴が表示されない**
   - Gitリポジトリ内で実行しているか確認
   - `.git`ディレクトリが存在するか確認

### 解決方法
```bash
# 権限問題の解決
chmod +x scripts/*.sh

# 依存関係の再インストール
npm install -g chokidar-cli

# Docker環境のリセット
docker-compose down && docker-compose up -d
```

## 💡 ベストプラクティス

1. **定期的な履歴確認**: 毎日の開発開始時に変更を確認
2. **差分レビュー**: コミット前に必ず差分を確認
3. **ファイル監視**: 重要な変更時は監視を有効化
4. **統計分析**: 週次で変更パターンを分析
5. **ドキュメント更新**: 大きな変更時は記録を残す

これらのツールを使って、AI ConectXプロジェクトの変更を効率的に追跡しましょう！