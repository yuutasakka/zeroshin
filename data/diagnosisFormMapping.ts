
// data/diagnosisFormMapping.ts - Zero神 ムダ遣い診断マッピング

// ムダ遣い診断フォームの回答コードを人間が読める形式にマッピング
// 管理ダッシュボードなどで使用

export const diagnosisFormMapping = {
  age: {
    '20s': '20代 💸',
    '30s': '30代 💰',
    '40s': '40代 💳',
    '50s': '50代 📊',
    '60plus': '60代以上 🏆',
  },
  wasteLevel: {
    'low': 'ほとんど無駄遣いしない 🏆',
    'medium': 'たまに無駄遣いしてしまう 😅',
    'high': 'よく無駄遣いしてしまう 💸',
    'extreme': '無駄遣いが止まらない 🚨',
  },
  category: {
    'food': '食費・外食 🍕',
    'fashion': 'ファッション・美容 👗',
    'entertainment': 'エンタメ・趣味 🎮',
    'shopping': 'ネットショッピング 📦',
    'subscription': 'サブスク・アプリ 📱',
    'impulse': '衝動買い全般 🛒',
  },
  monthlyWaste: {
    'less_5k': '5千円未満 😊',
    '5k_15k': '5千円〜1万5千円 😐',
    '15k_30k': '1万5千円〜3万円 😰',
    '30k_50k': '3万円〜5万円 😱',
    'more_50k': '5万円以上 🚨',
  },
  awareness: {
    'unaware': '全く気にしていない 😴',
    'sometimes': 'たまに意識する 🤔',
    'trying': '節約を心がけている 💪',
    'serious': '本気で節約したい 🔥',
  },
};