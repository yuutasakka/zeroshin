describe('ユーザー登録・承認・ログインフロー', () => {
  const testEmail = Cypress.env('TEST_EMAIL');
  const testPassword = Cypress.env('TEST_PASSWORD');

  beforeEach(() => {
    // テストデータクリーンアップ
    cy.task('cleanupTestData', { email: testEmail });
  });

  it('完全なユーザーライフサイクルテスト', () => {
    // 1. 新規登録申請
    cy.visit('/');
    cy.get('[data-cy="register-button"]').click();
    
    cy.get('[data-cy="full-name"]').type('テスト太郎');
    cy.get('[data-cy="email"]').type(testEmail);
    cy.get('[data-cy="phone"]').type('09012345678');
    cy.get('[data-cy="organization"]').type('テスト株式会社');
    cy.get('[data-cy="purpose"]').type('システムテストのため');
    
    cy.get('[data-cy="submit-button"]').click();
    
    // 申請完了メッセージを確認
    cy.get('[data-cy="success-message"]').should('contain', '申請を受け付けました');

    // 2. 管理者として承認処理
    cy.visit('/admin/login');
    cy.get('[data-cy="admin-username"]').type('admin');
    cy.get('[data-cy="admin-password"]').type('admin-password');
    cy.get('[data-cy="admin-login-button"]').click();

    // 承認待ち申請を確認
    cy.get('[data-cy="pending-requests"]').click();
    cy.get('[data-cy="request-item"]').should('contain', testEmail);
    
    // 承認処理
    cy.get(`[data-cy="approve-${testEmail}"]`).click();
    cy.get('[data-cy="admin-notes"]').type('テストユーザーのため承認');
    cy.get('[data-cy="confirm-approve"]').click();
    
    // 承認完了メッセージ
    cy.get('[data-cy="approval-success"]').should('contain', '承認が完了しました');

    // 3. ユーザーとして初回ログイン
    cy.get('[data-cy="admin-logout"]').click();
    cy.visit('/login');
    
    cy.get('[data-cy="user-email"]').type(testEmail);
    cy.get('[data-cy="user-password"]').type('temporary-password'); // 仮パスワード
    cy.get('[data-cy="user-login-button"]').click();

    // 4. パスワード変更
    cy.url().should('include', '/change-password');
    cy.get('[data-cy="new-password"]').type(testPassword);
    cy.get('[data-cy="confirm-password"]').type(testPassword);
    cy.get('[data-cy="change-password-button"]').click();

    // 5. ダッシュボードアクセス
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy="user-dashboard"]').should('be.visible');
    cy.get('[data-cy="user-profile"]').should('contain', 'テスト太郎');

    // 6. 基本機能テスト
    cy.get('[data-cy="diagnosis-link"]').click();
    cy.get('[data-cy="diagnosis-link"]').should('contain', '診断');
  });
}); 