# Zero神 Docker Configuration
# 開発・本番環境対応のセキュアなマルチステージDockerfile

# ========================================
# Stage 1: Dependencies (Base)
# ========================================
FROM node:20-alpine AS base

# セキュリティアップデート
RUN apk update && apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 非rootユーザーの作成
RUN addgroup -g 1001 -S zeroshin && \
    adduser -S zeroshin -u 1001

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# ========================================
# Stage 2: Development Dependencies
# ========================================
FROM base AS dev-deps

# 開発依存関係を含むすべての依存関係をインストール
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# ========================================
# Stage 3: Production Dependencies
# ========================================
FROM base AS prod-deps

# プロダクション依存関係のみインストール
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ========================================
# Stage 4: Builder
# ========================================
FROM base AS builder

# 開発依存関係をコピー
COPY --from=dev-deps /app/node_modules ./node_modules

# ソースコードをコピー
COPY . .

# ビルド環境変数
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0
ARG NODE_ENV=production

ENV NODE_ENV=${NODE_ENV}

# TypeScriptビルド
RUN npm run build

# 不要なファイルを削除
RUN rm -rf src/ \
    rm -rf node_modules/ \
    rm -rf .git/ \
    rm -rf .env* \
    rm -rf .github/ \
    rm -rf tests/ \
    rm -rf cypress/ \
    rm -rf docs/

# ========================================
# Stage 5: Development Environment
# ========================================
FROM base AS development

# 開発依存関係をコピー
COPY --from=dev-deps /app/node_modules ./node_modules

# ソースコードをコピー
COPY . .

# ユーザー切り替え
USER zeroshin:zeroshin

# 環境変数
ENV NODE_ENV=development
ENV PORT=5173

# ポート公開
EXPOSE 5173

# 開発サーバー起動
CMD ["dumb-init", "npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ========================================
# Stage 6: Production Environment
# ========================================
FROM nginx:alpine AS production

# セキュリティアップデート
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates && \
    rm -rf /var/cache/apk/*

# ビルド成果物をnginxにコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# カスタムnginx設定
COPY docker/nginx.conf /etc/nginx/nginx.conf

# ラベル
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.title="Zero神 Web Application" \
      org.opencontainers.image.description="Zero神 - ムダ遣い診断Webアプリケーション" \
      org.opencontainers.image.vendor="Zero神 Inc." \
      org.opencontainers.image.licenses="MIT"

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# ポート公開
EXPOSE 80

# nginxを起動
CMD ["nginx", "-g", "daemon off;"]

# ========================================
# Stage 7: Node.js Server (API用)
# ========================================
FROM node:20-alpine AS server

# セキュリティアップデート
RUN apk update && apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 非rootユーザーの作成
RUN addgroup -g 1001 -S zeroshin && \
    adduser -S zeroshin -u 1001

WORKDIR /app

# プロダクション依存関係をコピー
COPY --from=prod-deps /app/node_modules ./node_modules

# ビルド成果物とサーバーファイルをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./

# ユーザー権限を設定
RUN chown -R zeroshin:zeroshin /app

# ユーザー切り替え
USER zeroshin:zeroshin

# 環境変数
ENV NODE_ENV=production
ENV PORT=3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# ポート公開
EXPOSE 3000

# サーバー起動
CMD ["dumb-init", "node", "server/index.js"]