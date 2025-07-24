# タスカル アプリケーション

タスカル プロジェクトの本番環境アプリケーション

## セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
```bash
cp .env.example .env.local
# .env.local に実際の認証情報を設定
```

3. 開発サーバーの起動
```bash
npm run dev
```

## ドキュメント

詳細なドキュメントは [docs/](./docs/) ディレクトリを参照してください。

- [環境セットアップ](./docs/ENVIRONMENT_SETUP.md)
- [デプロイメントガイド](./docs/DEPLOYMENT_GUIDE.md)
- [セキュリティ監査](./docs/FINAL_SECURITY_AUDIT.md)