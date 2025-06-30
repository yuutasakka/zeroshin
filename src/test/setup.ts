import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Supabase API モック
export const server = setupServer(
  rest.post('*/auth/v1/signup', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'mock-token' }
      })
    );
  }),

  rest.get('*/rest/v1/registration_requests', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          full_name: 'テストユーザー',
          email: 'test@example.com',
          status: 'pending'
        }
      ])
    );
  }),

  rest.post('*/functions/v1/approve-registration', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, message: '承認が完了しました' })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// グローバルモック
global.crypto = {
  getRandomValues: (arr: any) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    digest: async () => new ArrayBuffer(32)
  }
} as any; 