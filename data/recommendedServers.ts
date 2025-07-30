// data/recommendedServers.ts - Zero神 おすすめサーバーデータ

export interface ServerTemplate {
  id: string;
  name: string;
  description: string;
  category: 'gaming' | 'community' | 'study' | 'hobby' | 'business' | 'creative';
  emoji: string;
  features: string[];
  memberCount: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  estimatedSetupTime: string;
  popularity: number; // 1-5
  channels: {
    name: string;
    type: 'text' | 'voice' | 'category';
    description?: string;
  }[];
  roles: {
    name: string;
    color: string;
    permissions: string[];
  }[];
  bots: {
    name: string;
    purpose: string;
    optional: boolean;
  }[];
}

export const recommendedServers: ServerTemplate[] = [
  {
    id: 'zero-savings-community',
    name: 'Zero神節約コミュニティ',
    description: '節約術をシェアし、お互いに励まし合うコミュニティサーバー。無駄遣いを減らして貯金を増やそう！',
    category: 'community',
    emoji: '💰',
    features: ['節約チャレンジ', '家計簿シェア', 'お得情報交換', 'モチベーション向上'],
    memberCount: '100-500人推奨',
    difficulty: 'beginner',
    tags: ['節約', '貯金', 'コミュニティ', '相互支援'],
    estimatedSetupTime: '15分',
    popularity: 5,
    channels: [
      { name: '🏠 ウェルカム', type: 'category' },
      { name: 'ルール・お知らせ', type: 'text', description: 'サーバーのルールと重要なお知らせ' },
      { name: '自己紹介', type: 'text', description: '新メンバーの自己紹介' },
      { name: '💸 節約・貯金', type: 'category' },
      { name: '節約術シェア', type: 'text', description: '効果的な節約方法を共有' },
      { name: '家計簿公開', type: 'text', description: '月の収支を公開して相談' },
      { name: 'お得情報', type: 'text', description: 'セール・割引情報など' },
      { name: '節約チャレンジ', type: 'text', description: '月間チャレンジの進捗報告' },
      { name: '🎯 目標達成', type: 'category' },
      { name: '貯金目標', type: 'text', description: '貯金目標の設定と報告' },
      { name: '達成報告', type: 'text', description: '目標達成の喜びをシェア' },
      { name: '💬 雑談', type: 'category' },
      { name: '一般雑談', type: 'text', description: '自由な雑談スペース' },
      { name: 'ボイスチャット', type: 'voice', description: '音声での交流' }
    ],
    roles: [
      { name: 'Zero神', color: '#FFD700', permissions: ['管理者権限'] },
      { name: '節約マスター', color: '#32CD32', permissions: ['メッセージ管理'] },
      { name: '貯金ヒーロー', color: '#4169E1', permissions: ['一般権限'] },
      { name: '節約初心者', color: '#87CEEB', permissions: ['基本権限'] }
    ],
    bots: [
      { name: 'MEE6', purpose: 'レベルシステムと自動モデレーション', optional: false },
      { name: 'Carl-bot', purpose: 'カスタムコマンドと自動ロール', optional: true },
      { name: 'Dyno', purpose: '音楽再生と管理機能', optional: true }
    ]
  },
  {
    id: 'budget-gaming-guild',
    name: 'コスパゲーマーズギルド',
    description: 'お金をかけずにゲームを楽しむゲーマーのためのサーバー。セール情報や無料ゲーム情報を共有！',
    category: 'gaming',
    emoji: '🎮',
    features: ['セール情報', '無料ゲーム', '攻略情報', 'マルチプレイ募集'],
    memberCount: '200-1000人推奨',
    difficulty: 'intermediate',
    tags: ['ゲーム', 'コスパ', 'セール', 'お得'],
    estimatedSetupTime: '20分',
    popularity: 4,
    channels: [
      { name: '🎮 ゲーム情報', type: 'category' },
      { name: 'セール・無料情報', type: 'text', description: 'ゲームのセールや無料配布情報' },
      { name: 'レビュー・評価', type: 'text', description: 'コスパの良いゲームのレビュー' },
      { name: '攻略・Tips', type: 'text', description: 'お金をかけない攻略法' },
      { name: '👥 マルチプレイ', type: 'category' },
      { name: '募集・参加', type: 'text', description: 'チームメンバー募集' },
      { name: 'ゲーム別チャット', type: 'text', description: '人気ゲーム専用チャット' },
      { name: 'ボイスゲーム', type: 'voice', description: 'ボイチャでゲーム' }
    ],
    roles: [
      { name: 'ギルドマスター', color: '#FF6347', permissions: ['管理者権限'] },
      { name: 'コスパキング', color: '#FFD700', permissions: ['メッセージ管理'] },
      { name: 'セール情報提供者', color: '#32CD32', permissions: ['アナウンス権限'] },
      { name: 'ゲーマー', color: '#1E90FF', permissions: ['一般権限'] }
    ],
    bots: [
      { name: 'Game Stats', purpose: 'ゲーム統計とランキング', optional: false },
      { name: 'Rythm', purpose: '音楽BOT', optional: true }
    ]
  },
  {
    id: 'frugal-study-group',
    name: '節約勉強会',
    description: '無料教材や安価な学習リソースを活用した勉強サーバー。お金をかけずにスキルアップ！',
    category: 'study',
    emoji: '📚',
    features: ['無料教材シェア', '勉強会開催', '進捗報告', 'Q&A'],
    memberCount: '50-300人推奨',
    difficulty: 'beginner',
    tags: ['勉強', '無料教材', 'スキルアップ', '自己投資'],
    estimatedSetupTime: '15分',
    popularity: 4,
    channels: [
      { name: '📖 学習リソース', type: 'category' },
      { name: '無料教材情報', type: 'text', description: '無料で学べる教材の共有' },
      { name: '学習方法', type: 'text', description: '効果的な学習テクニック' },
      { name: 'おすすめ本・動画', type: 'text', description: 'コスパの良い学習コンテンツ' },
      { name: '🎯 勉強会', type: 'category' },
      { name: '勉強会予定', type: 'text', description: 'オンライン勉強会の予定' },
      { name: '進捗報告', type: 'text', description: '学習進捗の共有' },
      { name: '質問・相談', type: 'text', description: '学習に関する質問' },
      { name: '勉強会VC', type: 'voice', description: '勉強会用ボイスチャット' }
    ],
    roles: [
      { name: '学習マスター', color: '#8A2BE2', permissions: ['管理者権限'] },
      { name: '講師', color: '#FF8C00', permissions: ['メッセージ管理'] },
      { name: '勉強仲間', color: '#20B2AA', permissions: ['一般権限'] }
    ],
    bots: [
      { name: 'Study Bot', purpose: '学習時間の記録と統計', optional: true },
      { name: 'Reminder Bot', purpose: '勉強時間のリマインダー', optional: true }
    ]
  },
  {
    id: 'diy-crafters-hub',
    name: 'DIY・手作りハブ',
    description: '手作りでお金を節約！DIYプロジェクトやハンドメイド作品をシェアするクリエイティブサーバー',
    category: 'creative',
    emoji: '🔨',
    features: ['DIYプロジェクト', '作品シェア', '材料情報', 'チュートリアル'],
    memberCount: '100-500人推奨',
    difficulty: 'intermediate',
    tags: ['DIY', 'ハンドメイド', '節約', 'クリエイティブ'],
    estimatedSetupTime: '18分',
    popularity: 3,
    channels: [
      { name: '🔨 DIYプロジェクト', type: 'category' },
      { name: 'プロジェクト紹介', type: 'text', description: '新しいDIYプロジェクトの提案' },
      { name: '進行中の作業', type: 'text', description: '制作過程の共有' },
      { name: '完成作品', type: 'text', description: '完成した作品の発表' },
      { name: '🛠️ 材料・道具', type: 'category' },
      { name: '安い材料情報', type: 'text', description: 'コスパの良い材料の情報' },
      { name: '道具レビュー', type: 'text', description: '使用した道具の評価' },
      { name: '💡 アイデア・相談', type: 'category' },
      { name: 'アイデア交換', type: 'text', description: '創作アイデアの共有' },
      { name: '技術相談', type: 'text', description: '作り方や技術的な質問' }
    ],
    roles: [
      { name: 'マスタークラフター', color: '#8B4513', permissions: ['管理者権限'] },
      { name: 'ベテラン職人', color: '#DAA520', permissions: ['メッセージ管理'] },
      { name: 'DIY愛好家', color: '#228B22', permissions: ['一般権限'] }
    ],
    bots: [
      { name: 'Progress Tracker', purpose: 'プロジェクト進捗管理', optional: true }
    ]
  },
  {
    id: 'small-business-network',
    name: 'スモールビジネスネットワーク',
    description: '小規模事業者や副業者のための情報交換・相互支援コミュニティ。低コストでビジネスを成長させよう',
    category: 'business',
    emoji: '💼',
    features: ['ビジネス相談', '集客アイデア', 'コスト削減', 'ネットワーキング'],
    memberCount: '50-200人推奨',
    difficulty: 'advanced',
    tags: ['ビジネス', '副業', '起業', 'ネットワーキング'],
    estimatedSetupTime: '25分',
    popularity: 3,
    channels: [
      { name: '💼 ビジネス相談', type: 'category' },
      { name: '事業相談', type: 'text', description: 'ビジネスに関する相談' },
      { name: 'マーケティング', type: 'text', description: '集客・販促のアイデア' },
      { name: 'コスト削減術', type: 'text', description: '経費削減のノウハウ' },
      { name: '🤝 ネットワーキング', type: 'category' },
      { name: '自己紹介・事業紹介', type: 'text', description: '事業の紹介' },
      { name: 'コラボ提案', type: 'text', description: '協業の提案・募集' },
      { name: 'ビジネスVC', type: 'voice', description: 'ビジネス相談用VC' }
    ],
    roles: [
      { name: 'ビジネスメンター', color: '#4B0082', permissions: ['管理者権限'] },
      { name: '経験者', color: '#FF4500', permissions: ['メッセージ管理'] },
      { name: '起業家', color: '#1E90FF', permissions: ['一般権限'] }
    ],
    bots: [
      { name: 'Business News', purpose: 'ビジネスニュースの配信', optional: true }
    ]
  },
  {
    id: 'minimalist-lifestyle',
    name: 'ミニマリストライフ',
    description: '少ないもので豊かに暮らすミニマリストのためのコミュニティ。断捨離や持たない暮らしの知恵を共有',
    category: 'hobby',
    emoji: '🌿',
    features: ['断捨離', 'ミニマル生活', '購入相談', 'ライフスタイル'],
    memberCount: '100-400人推奨',
    difficulty: 'beginner',
    tags: ['ミニマリズム', '断捨離', 'シンプル', 'ライフスタイル'],
    estimatedSetupTime: '12分',
    popularity: 4,
    channels: [
      { name: '🌿 ミニマル生活', type: 'category' },
      { name: '断捨離報告', type: 'text', description: '手放したものの報告' },
      { name: 'ミニマル部屋紹介', type: 'text', description: 'シンプルな部屋の紹介' },
      { name: '購入相談', type: 'text', description: '本当に必要か相談' },
      { name: '💭 マインドセット', type: 'category' },
      { name: 'エッセイ・名言', type: 'text', description: 'ミニマリズムに関する考察' },
      { name: '悩み相談', type: 'text', description: '生活の悩みを相談' }
    ],
    roles: [
      { name: 'ミニマル導師', color: '#2F4F4F', permissions: ['管理者権限'] },
      { name: '整理上手', color: '#708090', permissions: ['メッセージ管理'] },
      { name: 'シンプリスト', color: '#A9A9A9', permissions: ['一般権限'] }
    ],
    bots: [
      { name: 'Mindfulness Bot', purpose: '日々の振り返りと瞑想', optional: true }
    ]
  }
];

// カテゴリー別の検索
export const getServersByCategory = (category: ServerTemplate['category']): ServerTemplate[] => {
  return recommendedServers.filter(server => server.category === category);
};

// 人気順の取得
export const getPopularServers = (limit: number = 3): ServerTemplate[] => {
  return recommendedServers
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

// 難易度別の取得
export const getServersByDifficulty = (difficulty: ServerTemplate['difficulty']): ServerTemplate[] => {
  return recommendedServers.filter(server => server.difficulty === difficulty);
};

// タグ検索
export const searchServersByTag = (tag: string): ServerTemplate[] => {
  return recommendedServers.filter(server => 
    server.tags.some(serverTag => 
      serverTag.toLowerCase().includes(tag.toLowerCase())
    )
  );
};