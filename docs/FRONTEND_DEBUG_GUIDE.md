# フロントエンドデバッグガイド

## 問題：電話番号入力後に反応がない

### 1. ブラウザコンソールの確認

1. サイトを開く: https://moneyticket01-fk52i0ryd-seai0520s-projects.vercel.app
2. ブラウザの開発者ツールを開く:
   - Chrome/Edge: `F12` または `Ctrl+Shift+I` (Mac: `Cmd+Option+I`)
   - Firefox: `F12` または `Ctrl+Shift+K` (Mac: `Cmd+Option+K`)
3. **Console**タブを選択
4. エラーメッセージ（赤色）を確認

### 2. 診断フローの動作確認

#### A. 質問に回答する
1. 年代を選択（例：20-30代）
2. 投資経験を選択（例：初心者）
3. 投資目的と予算を選択

#### B. 電話番号入力
1. 電話番号欄に入力（例：090-1234-5678）
2. 「診断結果を見る」ボタンをクリック

### 3. ネットワークタブで確認

開発者ツールで**Network**タブを開き：
1. 電話番号入力後のリクエストを確認
2. `/api/send-otp-simple` へのリクエストがあるか
3. レスポンスのステータスコード

### 4. 考えられる原因

#### A. JavaScriptエラー
- コンソールに赤いエラーメッセージ
- 例：`Cannot read property 'xxx' of undefined`

#### B. バリデーションエラー
- 電話番号の形式が正しくない
- 必須項目が未入力

#### C. APIエラー
- 400エラー：リクエストの形式が正しくない
- 500エラー：サーバー側のエラー

### 5. 手動テスト

コンソールで以下を実行してAPIをテスト：

```javascript
// APIの直接テスト
fetch('/api/send-otp-simple', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '09012345678' })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

### 6. フォーム送信の確認

```javascript
// 診断完了ボタンの存在確認
document.querySelector('button[type="submit"]');

// クリックイベントのシミュレーション
const submitButton = document.querySelector('button[type="submit"]');
if (submitButton) {
  console.log('Button found:', submitButton.textContent);
  // submitButton.click(); // 実行する場合
}
```

### 7. よくあるエラーと解決策

| エラー | 原因 | 解決策 |
|--------|------|---------|
| `phoneNumber is required` | 電話番号が空 | 電話番号を入力 |
| `Invalid phone number` | 形式エラー | 090-xxxx-xxxx形式で入力 |
| `Network error` | 通信エラー | ページをリロード |
| `undefined is not a function` | JSエラー | キャッシュクリア |

### 8. キャッシュクリア方法

1. **Chrome/Edge**:
   - `Ctrl+Shift+Delete` (Mac: `Cmd+Shift+Delete`)
   - 「キャッシュされた画像とファイル」を選択
   - 「データを削除」

2. **強制リロード**:
   - `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`)

### 9. 動作確認チェックリスト

- [ ] 年代を選択した
- [ ] 投資経験を選択した
- [ ] 投資目的と予算を選択した
- [ ] 電話番号を入力した（形式：090-1234-5678）
- [ ] 「診断結果を見る」ボタンが表示されている
- [ ] ボタンをクリックできる
- [ ] コンソールにエラーがない
- [ ] ネットワークタブでAPIリクエストが送信されている