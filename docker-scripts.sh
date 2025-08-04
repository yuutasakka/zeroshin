#!/bin/bash

# Zero神 Docker管理スクリプト
# 使用方法: ./docker-scripts.sh [command] [environment]

set -e

# 色付きログ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 環境設定
ENV=${2:-dev}
COMPOSE_FILE=""

case $ENV in
    "dev"|"development")
        COMPOSE_FILE="docker-compose.dev.yml"
        ;;
    "prod"|"production")
        COMPOSE_FILE="docker-compose.prod.yml"
        ;;
    *)
        log_error "無効な環境: $ENV (dev または prod を指定してください)"
        exit 1
        ;;
esac

# 環境変数ファイルの確認
check_env_file() {
    if [ ! -f .env ]; then
        log_warning ".env ファイルが見つかりません"
        if [ -f .env.example ]; then
            log_info ".env.example をコピーして .env を作成しますか? (y/n)"
            read -r response
            if [ "$response" = "y" ]; then
                cp .env.example .env
                log_success ".env ファイルを作成しました"
                log_warning "必要な環境変数を設定してください"
            else
                log_error ".env ファイルが必要です"
                exit 1
            fi
        else
            log_error ".env.example ファイルも見つかりません"
            exit 1
        fi
    fi
}

# Docker環境の確認
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Dockerがインストールされていません"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Composeがインストールされていません"
        exit 1
    fi
}

# ビルドとデプロイ
build_and_deploy() {
    log_info "Zero神 ($ENV環境) のビルドとデプロイを開始します..."
    
    check_env_file
    check_docker

    # ビルド引数を設定
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    export VERSION=$(cat package.json | grep version | cut -d'"' -f4)

    log_info "ビルド情報:"
    log_info "  Date: $BUILD_DATE"
    log_info "  VCS Ref: $VCS_REF" 
    log_info "  Version: $VERSION"

    # イメージのビルド
    log_info "Dockerイメージをビルドしています..."
    docker-compose -f $COMPOSE_FILE build --parallel

    # コンテナの起動
    log_info "コンテナを起動しています..."
    docker-compose -f $COMPOSE_FILE up -d

    log_success "Zero神 ($ENV環境) のデプロイが完了しました!"
    
    # 起動確認
    sleep 5
    show_status
}

# 開発環境の起動
start_dev() {
    log_info "Zero神開発環境を起動しています..."
    
    check_env_file
    check_docker

    # 開発環境専用の設定
    export NODE_ENV=development
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")
    export VERSION="dev"

    docker-compose -f docker-compose.dev.yml up -d

    log_success "開発環境が起動しました!"
    log_info "フロントエンド: http://localhost:5173"
    log_info "API: http://localhost:3000"
    log_info "pgAdmin: http://localhost:8080"
    log_info "Mailhog: http://localhost:8025"
    
    # ログの表示
    log_info "ログを表示します (Ctrl+Cで終了):"
    docker-compose -f docker-compose.dev.yml logs -f
}

# 停止
stop() {
    log_info "Zero神 ($ENV環境) を停止しています..."
    docker-compose -f $COMPOSE_FILE down
    log_success "停止しました"
}

# 完全削除
clean() {
    log_warning "Zero神 ($ENV環境) のコンテナ、ボリューム、ネットワークを削除します"
    log_warning "この操作は取り消せません。続行しますか? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        docker system prune -f
        log_success "クリーンアップが完了しました"
    else
        log_info "キャンセルしました"
    fi
}

# ステータス確認
show_status() {
    log_info "Zero神 ($ENV環境) のステータス:"
    docker-compose -f $COMPOSE_FILE ps
    
    log_info "\nコンテナのヘルスチェック:"
    docker-compose -f $COMPOSE_FILE exec zeroshin-api node -e "require('http').get('http://localhost:3000/health', (res) => { console.log(res.statusCode === 200 ? 'API: Healthy' : 'API: Unhealthy'); })" 2>/dev/null || log_warning "APIヘルスチェックに失敗"
    
    if [ "$ENV" = "prod" ]; then
        curl -s http://localhost:80/health > /dev/null && log_success "Web: Healthy" || log_warning "Web: Unhealthy"
    fi
}

# ログ表示
show_logs() {
    log_info "Zero神 ($ENV環境) のログを表示します:"
    docker-compose -f $COMPOSE_FILE logs -f --tail=100
}

# バックアップ
backup() {
    log_info "データベースをバックアップしています..."
    
    if [ "$ENV" = "dev" ]; then
        docker-compose -f $COMPOSE_FILE exec postgres pg_dump -h localhost -U zeroshin zeroshin_dev > "backup_$(date +%Y%m%d_%H%M%S).sql"
        log_success "バックアップが完了しました"
    else
        log_warning "本番環境のバックアップは手動で実行してください"
    fi
}

# セキュリティスキャン
security_scan() {
    log_info "セキュリティスキャンを実行しています..."
    
    # Dockerイメージのスキャン
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image zeroshin-web:latest
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image zeroshin-api:latest
    
    log_success "セキュリティスキャンが完了しました"
}

# ヘルプ
show_help() {
    echo "Zero神 Docker管理スクリプト"
    echo ""
    echo "使用方法:"
    echo "  $0 [command] [environment]"
    echo ""
    echo "Commands:"
    echo "  deploy      - ビルドとデプロイ"
    echo "  dev         - 開発環境の起動"
    echo "  stop        - 停止"
    echo "  clean       - 完全削除"
    echo "  status      - ステータス確認"
    echo "  logs        - ログ表示"
    echo "  backup      - バックアップ"
    echo "  security    - セキュリティスキャン"
    echo "  help        - このヘルプを表示"
    echo ""
    echo "Environment:"
    echo "  dev|development  - 開発環境 (デフォルト)"
    echo "  prod|production  - 本番環境"
    echo ""
    echo "例:"
    echo "  $0 dev           - 開発環境を起動"
    echo "  $0 deploy prod   - 本番環境をデプロイ"
    echo "  $0 status prod   - 本番環境のステータス確認"
}

# メイン処理
case ${1:-help} in
    "deploy")
        build_and_deploy
        ;;
    "dev"|"development")
        start_dev
        ;;
    "stop")
        stop
        ;;
    "clean")
        clean
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "backup")
        backup
        ;;
    "security")
        security_scan
        ;;
    "help"|*)
        show_help
        ;;
esac