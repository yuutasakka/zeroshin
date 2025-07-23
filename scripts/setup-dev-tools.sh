#!/bin/bash

# 開発ツールセットアップスクリプト
# 使用方法: ./scripts/setup-dev-tools.sh

echo "🛠️ AI ConnectX 開発ツールセットアップ"
echo "===================================="

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 必要なディレクトリ作成
mkdir -p docker/gitlab/{config,logs,data}
mkdir -p docker/sonarqube/{data,extensions,logs}
mkdir -p docker/gitiles
mkdir -p logs

# 実行権限付与
chmod +x scripts/*.sh

# Node.js依存関係のインストール
echo -e "${BLUE}📦 Node.js依存関係をインストール中...${NC}"
if command -v npm &> /dev/null; then
    npm install -g chokidar-cli
    echo -e "${GREEN}✅ chokidar-cli インストール完了${NC}"
else
    echo -e "${YELLOW}⚠️ npm が見つかりません。Node.jsをインストールしてください${NC}"
fi

# Git設定確認
echo -e "${BLUE}🔍 Git設定を確認中...${NC}"
git config --list | grep -E "(user.name|user.email|core.editor)"

# Docker設定ファイル作成
cat > docker/gitiles/gitiles.config << EOF
[gitiles]
  basePath = /git-repos
  canonicalWebUrl = http://localhost:8080/
  
[google]
  analyticsId = 
  
[markdown]
  allowHtml = true
  
[ui]
  sitename = AI ConnectX Git Repository
EOF

# package.jsonにスクリプト追加
echo -e "${BLUE}📝 package.jsonにスクリプトを追加中...${NC}"
if [ -f "package.json" ]; then
    # npm scriptsを追加
    npm pkg set scripts.git-history="./scripts/git-history-viewer.sh"
    npm pkg set scripts.git-diff="./scripts/git-diff-viewer.sh"
    npm pkg set scripts.file-monitor="node scripts/file-change-monitor.js"
    npm pkg set scripts.dev-tools="docker-compose up -d"
    echo -e "${GREEN}✅ npm scripts追加完了${NC}"
fi

# VS Code設定
mkdir -p .vscode
cat > .vscode/settings.json << EOF
{
    "git.enableSmartCommit": true,
    "git.autofetch": true,
    "git.showProgress": true,
    "gitHistory.showDetailsView": true,
    "files.watcherExclude": {
        "**/node_modules/**": true,
        "**/.git/**": true,
        "**/dist/**": true,
        "**/build/**": true
    },
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": true
    }
}
EOF

# Git hooks設定
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Pre-commit check..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint failed. Please fix the issues."
    exit 1
fi
echo "✅ Pre-commit check passed"
EOF

chmod +x .git/hooks/pre-commit

# 使用方法の表示
echo -e "${GREEN}🎉 セットアップ完了！${NC}"
echo ""
echo -e "${BLUE}📋 使用可能なツール:${NC}"
echo "================================="
echo "1. Git履歴可視化:"
echo "   ./scripts/git-history-viewer.sh"
echo "   または: npm run git-history"
echo ""
echo "2. Git差分表示:"
echo "   ./scripts/git-diff-viewer.sh -r"
echo "   または: npm run git-diff -- -r"
echo ""
echo "3. ファイル変更監視:"
echo "   node scripts/file-change-monitor.js"
echo "   または: npm run file-monitor"
echo ""
echo "4. Web UI起動:"
echo "   docker-compose up -d"
echo "   または: npm run dev-tools"
echo ""
echo "5. 特定ファイルの履歴:"
echo "   git log --follow [ファイル名]"
echo "   git log -p [ファイル名]"
echo ""
echo -e "${BLUE}🌐 Web UI アクセス:${NC}"
echo "- Git履歴: http://localhost:8080 (Gitiles)"
echo "- プロジェクト管理: http://localhost:8081 (GitLab)"
echo "- コード分析: http://localhost:9000 (SonarQube)"
echo ""
echo -e "${YELLOW}💡 ヒント:${NC}"
echo "- VS Codeで Git History 拡張機能を使用すると便利です"
echo "- GitLensなどの拡張機能も併用してください"
echo "- ファイル変更を監視しながら開発すると効率的です"