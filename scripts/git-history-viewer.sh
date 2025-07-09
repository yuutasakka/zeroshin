#!/bin/bash

# Git履歴可視化スクリプト
# 使用方法: ./scripts/git-history-viewer.sh

echo "🔍 MoneyTicket Git履歴可視化ツール"
echo "=================================="

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 最近のコミット履歴（グラフ形式）
echo -e "${BLUE}📊 最近のコミット履歴 (グラフ形式)${NC}"
echo "================================"
git log --oneline --graph --decorate --all -10

echo -e "\n${BLUE}📝 最近編集されたファイル一覧${NC}"
echo "================================"
git log --name-status --oneline -5

echo -e "\n${BLUE}📈 ファイル変更統計${NC}"
echo "================================"
git log --stat -5

echo -e "\n${BLUE}🔥 よく変更されるファイル TOP 10${NC}"
echo "================================"
git log --name-only --pretty=format: | sort | uniq -c | sort -rn | head -10

echo -e "\n${BLUE}👤 コミット者別統計${NC}"
echo "================================"
git shortlog -sn

echo -e "\n${BLUE}📅 今日の変更${NC}"
echo "================================"
git log --since="midnight" --oneline --name-status

echo -e "\n${BLUE}🏷️ 最近のタグ${NC}"
echo "================================"
git tag -l | tail -5

echo -e "\n${BLUE}🌿 ブランチ情報${NC}"
echo "================================"
git branch -v

echo -e "\n${GREEN}✅ 詳細な履歴を見るには以下のコマンドを使用:${NC}"
echo "git log --oneline --graph --all"
echo "git log --stat"
echo "git log --name-status"
echo "git log -p [ファイル名] # 特定ファイルの変更差分"
echo "git log --follow [ファイル名] # ファイルの移動も追跡"
echo "git blame [ファイル名] # 各行の最終編集者を表示"

echo -e "\n${GREEN}🔍 Web UIで履歴を見る:${NC}"
echo "docker-compose up gitiles # http://localhost:8080"
echo "docker-compose up gitlab # http://localhost:8081"