describe('Diagnosis Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('completes the full diagnosis flow successfully', () => {
    // ホームページが表示されることを確認
    cy.contains('あなたの未来の資産を診断').should('be.visible');
    
    // 診断開始ボタンをクリック
    cy.contains('診断を開始する').click();
    
    // Step 1: 年齢と経験
    cy.contains('年齢と投資経験').should('be.visible');
    cy.get('[data-testid="age-experience-option"]').first().click();
    cy.contains('次へ').click();
    
    // Step 2: 目的と予算
    cy.contains('投資の目的と予算').should('be.visible');
    cy.get('[data-testid="purpose-budget-option"]').first().click();
    cy.contains('次へ').click();
    
    // Step 3: 電話番号入力
    cy.contains('電話番号の入力').should('be.visible');
    cy.get('input[type="tel"]').type('09012345678');
    
    // 利用規約に同意
    cy.get('input[type="checkbox"]').check();
    
    // 送信ボタンをクリック
    cy.contains('診断結果を見る').click();
    
    // 電話番号認証ページに遷移
    cy.url().should('include', 'verification');
    cy.contains('SMS認証').should('be.visible');
  });

  it('validates required fields', () => {
    cy.contains('診断を開始する').click();
    
    // 何も選択せずに次へボタンをクリック
    cy.contains('次へ').should('be.disabled');
    
    // オプションを選択すると次へボタンが有効になる
    cy.get('[data-testid="age-experience-option"]').first().click();
    cy.contains('次へ').should('not.be.disabled');
  });

  it('allows navigation back to previous steps', () => {
    cy.contains('診断を開始する').click();
    
    // Step 1を完了
    cy.get('[data-testid="age-experience-option"]').first().click();
    cy.contains('次へ').click();
    
    // Step 2に到達
    cy.contains('投資の目的と予算').should('be.visible');
    
    // 戻るボタンをクリック
    cy.contains('戻る').click();
    
    // Step 1に戻る
    cy.contains('年齢と投資経験').should('be.visible');
  });

  it('validates phone number format', () => {
    // 診断フローを進める
    cy.completeDiagnosisFlow({
      age: '20代',
      experience: 'なし',
      purpose: '老後の資金準備',
      amount: '1万円〜3万円',
      timing: '今すぐ',
      phone: '123', // 無効な電話番号
    });
    
    // エラーメッセージが表示される
    cy.contains('有効な電話番号を入力してください').should('be.visible');
    
    // 正しい形式の電話番号を入力
    cy.get('input[type="tel"]').clear().type('09012345678');
    cy.contains('診断結果を見る').click();
    
    // エラーが消えて次に進める
    cy.url().should('include', 'verification');
  });

  it('preserves form data when navigating', () => {
    cy.contains('診断を開始する').click();
    
    // Step 1で選択
    const selectedOption = '20代・投資経験なし';
    cy.contains(selectedOption).click();
    cy.contains('次へ').click();
    
    // Step 2に進む
    cy.contains('投資の目的と予算').should('be.visible');
    
    // 戻る
    cy.contains('戻る').click();
    
    // 選択が保持されている
    cy.contains(selectedOption).parent().should('have.class', 'selected');
  });

  it('shows progress indicator', () => {
    cy.contains('診断を開始する').click();
    
    // Step 1
    cy.get('[data-testid="progress-indicator"]').should('contain', '1/3');
    
    // Step 2
    cy.get('[data-testid="age-experience-option"]').first().click();
    cy.contains('次へ').click();
    cy.get('[data-testid="progress-indicator"]').should('contain', '2/3');
    
    // Step 3
    cy.get('[data-testid="purpose-budget-option"]').first().click();
    cy.contains('次へ').click();
    cy.get('[data-testid="progress-indicator"]').should('contain', '3/3');
  });

  it('handles API errors gracefully', () => {
    // APIエラーをシミュレート
    cy.intercept('POST', '**/api/send-otp', {
      statusCode: 500,
      body: { error: 'Server error' },
    }).as('sendOTPError');
    
    // 診断フローを完了
    cy.completeDiagnosisFlow({
      age: '30代',
      experience: 'あり',
      purpose: '資産運用',
      amount: '5万円以上',
      timing: '今すぐ',
      phone: '09012345678',
    });
    
    cy.wait('@sendOTPError');
    
    // エラーメッセージが表示される
    cy.contains('エラーが発生しました').should('be.visible');
    cy.contains('もう一度お試しください').should('be.visible');
  });

  it('is accessible', () => {
    cy.contains('診断を開始する').click();
    
    // アクセシビリティチェック
    cy.checkA11y();
    
    // キーボードナビゲーション
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'age-experience-option');
    
    // Enterキーで選択
    cy.focused().type('{enter}');
    cy.focused().should('contain', '次へ');
  });

  it('works on mobile viewport', () => {
    cy.viewport('iphone-x');
    
    cy.contains('あなたの未来の資産を診断').should('be.visible');
    cy.contains('診断を開始する').click();
    
    // モバイルでも全ての要素が表示される
    cy.contains('年齢と投資経験').should('be.visible');
    cy.get('[data-testid="age-experience-option"]').should('have.length.at.least', 4);
  });
});