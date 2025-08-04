# Zero神 Docker デプロイメントガイド

このドキュメントでは、Zero神アプリケーションをDockerを使用して起動・運用する方法を説明します。

## 📋 必要な環境

- **Docker**: 20.10.0以上
- **Docker Compose**: 2.0.0以上（または`docker compose`コマンド）
- **Git**: バージョン管理用
- **OS**: Linux、macOS、Windows（WSL2推奨）

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/SakkaYuta/zeroshin.git
cd zeroshin
```

### 2. 環境変数の設定

```bash
# 環境変数ファイルをコピー
cp .env.example .env

# 環境変数を編集（重要: 実際の値に変更してください）
nano .env
```

### 3. 開発環境の起動

```bash
# 管理スクリプトを使用（推奨）
./docker-scripts.sh dev

# または直接Docker Composeを使用
docker-compose -f docker-compose.dev.yml up -d
```

### 4. アクセス確認

- **フロントエンド**: http://localhost:5173
- **API**: http://localhost:3000
- **pgAdmin**: http://localhost:8080
- **Mailhog**: http://localhost:8025

## 🛠️ 管理スクリプトの使用

Zero神専用の管理スクリプト `docker-scripts.sh` を使用することを推奨します。

### 基本コマンド

```bash
# 開発環境の起動
./docker-scripts.sh dev

# 本番環境のデプロイ
./docker-scripts.sh deploy prod

# ステータス確認
./docker-scripts.sh status

# ログ表示
./docker-scripts.sh logs

# 停止
./docker-scripts.sh stop

# 完全削除（データも削除）
./docker-scripts.sh clean

# セキュリティスキャン
./docker-scripts.sh security

# ヘルプ表示
./docker-scripts.sh help
```

## 🏗️ アーキテクチャ

### 開発環境 (`docker-compose.dev.yml`)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Frontend      │  │   API Server    │  │   PostgreSQL    │
│   (Vite)        │  │   (Node.js)     │  │   (Database)    │
│   Port: 5173    │  │   Port: 3000    │  │   Port: 5432    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     Redis       │  │    pgAdmin      │  │    Mailhog      │
│   (Cache)       │  │   (DB Admin)    │  │  (Mail Test)    │
│   Port: 6379    │  │   Port: 8080    │  │   Port: 8025    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 本番環境 (`docker-compose.prod.yml`)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     Nginx       │  │   API Server    │  │     Redis       │
│  (Web Server)   │  │   (Node.js)     │  │   (Cache)       │
│   Port: 80/443  │  │   Port: 3000    │  │   Port: 6379    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Prometheus    │  │    Grafana      │  │     Trivy       │
│  (Monitoring)   │  │  (Dashboard)    │  │  (Security)     │
│   Port: 9090    │  │   Port: 3001    │  │   Port: 4954    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## ⚙️ 設定詳細

### 必須環境変数

以下の環境変数は必ず設定してください：

```bash
# Supabase設定
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# LINE認証設定
VITE_LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret

# セキュリティ設定
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

### オプション環境変数

```bash
# LINE Login設定（LINE認証を使用する場合）
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_REDIRECT_URI=https://your-domain.com/api/line-callback

# 監視設定
GRAFANA_USER=admin
GRAFANA_PASSWORD=secure-password

# Redis設定（本番環境）
REDIS_PASSWORD=secure-redis-password
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -i :5173
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

#### 2. ビルドエラー

```bash
# Dockerキャッシュをクリア
docker system prune -a

# 依存関係を再インストール
./docker-scripts.sh clean
./docker-scripts.sh dev
```

#### 3. データベース接続エラー

```bash
# PostgreSQLコンテナのログを確認
docker-compose -f docker-compose.dev.yml logs postgres

# データベースをリセット
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres
```

#### 4. 環境変数が読み込まれない

```bash
# .envファイルの確認
cat .env

# コンテナ内の環境変数を確認
docker-compose -f docker-compose.dev.yml exec zeroshin-dev env
```

## 📊 監視とログ

### ログの確認

```bash
# 全サービスのログ
./docker-scripts.sh logs

# 特定のサービスのログ
docker-compose -f docker-compose.dev.yml logs -f zeroshin-dev
```

### メトリクス監視（本番環境）

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001

### セキュリティスキャン

```bash
# セキュリティスキャンの実行
./docker-scripts.sh security
```

## 🚢 本番デプロイメント

### SSL証明書の設定

1. SSL証明書を準備：
```bash
mkdir -p ssl
# 証明書ファイルをsslディレクトリに配置
cp your-cert.crt ssl/zeroshin.crt
cp your-private.key ssl/zeroshin.key
```

2. 環境変数を設定：
```bash
SSL_CERT_PATH=/etc/ssl/certs/zeroshin.crt
SSL_KEY_PATH=/etc/ssl/private/zeroshin.key
```

### 本番環境のデプロイ

```bash
# 本番環境用の環境変数を設定
cp .env.example .env.production
nano .env.production

# 本番環境をデプロイ
./docker-scripts.sh deploy prod
```

## 🔐 セキュリティ

### セキュリティベストプラクティス

1. **環境変数の管理**
   - `.env`ファイルをGitにコミットしない
   - 強力なパスワードを使用
   - 定期的にシークレットを更新

2. **Dockerセキュリティ**
   - 非rootユーザーでコンテナを実行
   - 最小権限の原則
   - 定期的なセキュリティスキャン

3. **ネットワークセキュリティ**
   - 不要なポートを公開しない
   - ファイアウォールの設定
   - SSL/TLS証明書の使用

## 🆘 サポート

問題が発生した場合：

1. [トラブルシューティングセクション](#🔧-トラブルシューティング)を確認
2. ログを確認：`./docker-scripts.sh logs`
3. GitHubのIssuesで報告
4. 開発チームに連絡

## 📚 追加リソース

- [Docker公式ドキュメント](https://docs.docker.com/)
- [Docker Compose リファレンス](https://docs.docker.com/compose/)
- [Zero神 開発ドキュメント](./README.md)
- [セキュリティガイド](./SECURITY.md)