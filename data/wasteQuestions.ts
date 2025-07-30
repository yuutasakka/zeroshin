// data/wasteQuestions.ts - Zero神 ムダ遣い診断質問データ

export interface WasteQuestion {
  id: number;
  title: string;
  subtitle?: string;
  options: {
    id: string;
    text: string;
    emoji: string;
    description?: string;
  }[];
}

export const wasteQuestions: WasteQuestion[] = [
  {
    id: 1,
    title: '年齢を教えてください',
    subtitle: 'あなたの世代の平均と比較します',
    options: [
      { id: '20s', text: '20代', emoji: '💸', description: '社会人デビューの時期' },
      { id: '30s', text: '30代', emoji: '💰', description: '支出が増える年代' },
      { id: '40s', text: '40代', emoji: '💳', description: '家計管理が重要な時期' },
      { id: '50s', text: '50代', emoji: '📊', description: '将来を見据えた管理' },
      { id: '60plus', text: '60代以上', emoji: '🏆', description: 'ベテランの知恵' }
    ]
  },
  {
    id: 2,
    title: 'あなたの無駄遣いレベルは？',
    subtitle: '正直にお答えください',
    options: [
      { id: 'low', text: 'ほとんど無駄遣いしない', emoji: '🏆', description: '計画的な支出を心がけている' },
      { id: 'medium', text: 'たまに無駄遣いしてしまう', emoji: '😅', description: '月に数回衝動買いをする' },
      { id: 'high', text: 'よく無駄遣いしてしまう', emoji: '💸', description: '週に何度か不要な買い物をする' },
      { id: 'extreme', text: '無駄遣いが止まらない', emoji: '🚨', description: 'ほぼ毎日何かを買ってしまう' }
    ]
  },
  {
    id: 3,
    title: '最も無駄遣いしてしまうカテゴリは？',
    subtitle: '一番当てはまるものを選んでください',
    options: [
      { id: 'food', text: '食費・外食', emoji: '🍕', description: 'コンビニ弁当、デリバリー、外食など' },
      { id: 'fashion', text: 'ファッション・美容', emoji: '👗', description: '服、化粧品、アクセサリーなど' },
      { id: 'entertainment', text: 'エンタメ・趣味', emoji: '🎮', description: 'ゲーム、本、映画、音楽など' },
      { id: 'shopping', text: 'ネットショッピング', emoji: '📦', description: 'Amazon、楽天などでの衝動買い' },
      { id: 'subscription', text: 'サブスク・アプリ', emoji: '📱', description: '使っていない月額サービス' },
      { id: 'impulse', text: '衝動買い全般', emoji: '🛒', description: '様々なジャンルで衝動的に購入' }
    ]
  },
  {
    id: 4,
    title: '月にどのくらい無駄遣いしていますか？',
    subtitle: '大体の金額で構いません',
    options: [
      { id: 'less_5k', text: '5千円未満', emoji: '😊', description: '比較的コントロールできている' },
      { id: '5k_15k', text: '5千円〜1万5千円', emoji: '😐', description: '平均的な無駄遣いレベル' },
      { id: '15k_30k', text: '1万5千円〜3万円', emoji: '😰', description: 'やや多めの無駄遣い' },
      { id: '30k_50k', text: '3万円〜5万円', emoji: '😱', description: 'かなり多い無駄遣い' },
      { id: 'more_50k', text: '5万円以上', emoji: '🚨', description: '緊急対策が必要なレベル' }
    ]
  },
  {
    id: 5,
    title: '節約への意識はどの程度ですか？',
    subtitle: '現在の心境をお聞かせください',
    options: [
      { id: 'unaware', text: '全く気にしていない', emoji: '😴', description: '特に節約を意識していない' },
      { id: 'sometimes', text: 'たまに意識する', emoji: '🤔', description: '時々節約を考える程度' },
      { id: 'trying', text: '節約を心がけている', emoji: '💪', description: '意識して支出を抑えようとしている' },
      { id: 'serious', text: '本気で節約したい', emoji: '🔥', description: '真剣に家計改善に取り組みたい' }
    ]
  }
];

// 診断結果計算用の重み付け
export const wasteScoreWeights = {
  wasteLevel: { low: 1, medium: 2, high: 3, extreme: 4 },
  monthlyWaste: { less_5k: 1, '5k_15k': 2, '15k_30k': 3, '30k_50k': 4, more_50k: 5 },
  awareness: { serious: 1, trying: 2, sometimes: 3, unaware: 4 },
  category: { 
    subscription: 1.2, // サブスクは改善しやすい
    food: 1.1, 
    shopping: 1.0,
    entertainment: 0.9,
    fashion: 0.8,
    impulse: 1.3 // 衝動買いは最も問題
  }
};

// 年代別の補正係数
export const ageMultipliers = {
  '20s': 0.9, // 若い世代は相対的に支出が少ない
  '30s': 1.0,
  '40s': 1.1,
  '50s': 1.2,
  '60plus': 0.8 // 固定収入で節約傾向
};