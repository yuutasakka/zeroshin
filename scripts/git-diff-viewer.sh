#!/bin/bash

# Git差分可視化スクリプト
# 使用方法: ./scripts/git-diff-viewer.sh

echo "🔍 MoneyTicket Git差分可視化ツール"
echo "=================================="

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 引数チェック
if [ $# -eq 0 ]; then
    echo "使用方法:"
    echo "  $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  -r, --recent        最近の変更を表示"
    echo "  -f, --files         変更されたファイル一覧"
    echo "  -s, --stats         統計情報"
    echo "  -c, --commits N     最新N件のコミット詳細"
    echo "  -d, --diff FILE     特定ファイルの差分"
    echo "  -b, --blame FILE    特定ファイルの編集者情報"
    echo "  -h, --help          このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 -r               # 最近の変更を表示"
    echo "  $0 -f               # 変更されたファイル一覧"
    echo "  $0 -c 5             # 最新5件のコミット詳細"
    echo "  $0 -d App.tsx       # App.tsxの差分"
    exit 1
fi

# 関数定義
show_recent_changes() {
    echo -e "${BLUE}📊 最近の変更 (last 10 commits)${NC}"
    echo "================================="
    git log --oneline --graph --decorate -10
    echo ""
    
    echo -e "${BLUE}📝 変更されたファイル${NC}"
    echo "================================="
    git log --name-status --oneline -5
}

show_changed_files() {
    echo -e "${BLUE}📁 変更されたファイル一覧${NC}"
    echo "================================="
    
    echo -e "${YELLOW}🔄 ステージング済み:${NC}"
    git diff --name-only --cached
    echo ""
    
    echo -e "${YELLOW}📝 作業中:${NC}"
    git diff --name-only
    echo ""
    
    echo -e "${YELLOW}🆕 追跡されていない:${NC}"
    git ls-files --others --exclude-standard
}

show_stats() {
    echo -e "${BLUE}📈 統計情報${NC}"
    echo "================================="
    
    echo -e "${YELLOW}📊 コミット統計:${NC}"
    git shortlog -sn
    echo ""
    
    echo -e "${YELLOW}📅 今週の活動:${NC}"
    git log --since="1 week ago" --oneline | wc -l | xargs echo "コミット数:"
    echo ""
    
    echo -e "${YELLOW}🔥 最も変更されたファイル:${NC}"
    git log --name-only --pretty=format: | sort | uniq -c | sort -rn | head -10
}

show_commit_details() {
    local num_commits=${1:-5}
    echo -e "${BLUE}📋 最新 ${num_commits} 件のコミット詳細${NC}"
    echo "================================="
    
    for i in $(seq 0 $((num_commits-1))); do
        echo -e "${PURPLE}🔸 コミット $((i+1)):${NC}"
        git log --stat -1 HEAD~$i
        echo ""
    done
}

show_file_diff() {
    local file=$1
    if [ -z "$file" ]; then
        echo -e "${RED}❌ ファイル名を指定してください${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📄 $file の差分${NC}"
    echo "================================="
    
    if [ -f "$file" ]; then
        echo -e "${YELLOW}🔄 ワーキングディレクトリ vs ステージング:${NC}"
        git diff "$file"
        echo ""
        
        echo -e "${YELLOW}📝 ステージング vs 最新コミット:${NC}"
        git diff --cached "$file"
        echo ""
        
        echo -e "${YELLOW}📚 最新コミット vs 前のコミット:${NC}"
        git diff HEAD~1 HEAD "$file"
    else
        echo -e "${RED}❌ ファイル '$file' が見つかりません${NC}"
    fi
}

show_file_blame() {
    local file=$1
    if [ -z "$file" ]; then
        echo -e "${RED}❌ ファイル名を指定してください${NC}"
        return 1
    fi
    
    echo -e "${BLUE}👤 $file の編集者情報${NC}"
    echo "================================="
    
    if [ -f "$file" ]; then
        git blame --line-porcelain "$file" | grep "^author " | sort | uniq -c | sort -rn
        echo ""
        echo -e "${YELLOW}📋 詳細な編集者情報:${NC}"
        git blame "$file"
    else
        echo -e "${RED}❌ ファイル '$file' が見つかりません${NC}"
    fi
}

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--recent)
            show_recent_changes
            shift
            ;;
        -f|--files)
            show_changed_files
            shift
            ;;
        -s|--stats)
            show_stats
            shift
            ;;
        -c|--commits)
            show_commit_details $2
            shift 2
            ;;
        -d|--diff)
            show_file_diff $2
            shift 2
            ;;
        -b|--blame)
            show_file_blame $2
            shift 2
            ;;
        -h|--help)
            echo "Git差分可視化ツールのヘルプは上記を参照してください"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 不明なオプション: $1${NC}"
            exit 1
            ;;
    esac
done