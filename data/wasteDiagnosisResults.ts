// data/wasteDiagnosisResults.ts - Zero神 ムダ遣い診断結果データ

export interface WasteDiagnosisResult {
  level: 'zero_god' | 'saving_hero' | 'budget_warrior' | 'spender_alert' | 'waste_danger';
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
  scoreRange: [number, number];
  potentialSavings: {
    monthly: string;
    yearly: string;
  };
  recommendations: {
    title: string;
    items: string[];
  };
  tips: string[];
  motivation: string;
}

export const wasteDiagnosisResults: WasteDiagnosisResult[] = [
  {
    level: 'zero_god',
    title: 'Zero神',
    subtitle: '無駄遣いゼロの神レベル！',
    emoji: '👑',
    description: 'あなたは既に節約の神の域に達しています！計画的な支出管理ができており、無駄遣いをほとんどしていません。この調子で資産形成を続けていきましょう。',
    scoreRange: [1.0, 1.5],
    potentialSavings: {
      monthly: '0円〜2,000円',
      yearly: '0円〜24,000円'
    },
    recommendations: {
      title: '更なる高みを目指すための提案',
      items: [
        '投資による資産運用の検討',
        '固定費の最適化（保険・通信費見直し）',
        'ポイント活用の最大化',
        '副収入の検討'
      ]
    },
    tips: [
      '現在の素晴らしい家計管理を維持しましょう',
      '投資で資産を増やすことを検討してみてください',
      '他の人に節約アドバイスをしてあげるのも良いでしょう'
    ],
    motivation: 'あなたは既に理想的な家計管理ができています。この状態を維持しながら、さらなる資産形成を目指しましょう！'
  },
  {
    level: 'saving_hero',
    title: '節約ヒーロー',
    subtitle: '優秀な家計管理者',
    emoji: '🦸‍♂️',
    description: 'かなり上手に家計管理ができています。時々の小さな無駄遣いはありますが、全体的には非常に健全な支出パターンです。',
    scoreRange: [1.5, 2.5],
    potentialSavings: {
      monthly: '3,000円〜8,000円',
      yearly: '36,000円〜96,000円'
    },
    recommendations: {
      title: 'さらなる節約のための提案',
      items: [
        '家計簿アプリで支出の見える化',
        '月1回の家計見直しタイム設定',
        '特売日やタイムセールの活用',
        '不要なサブスクリプションの解約'
      ]
    },
    tips: [
      '既に良い習慣ができているので、継続することが大切です',
      'たまの自分へのご褒美は問題ありません',
      '固定費の見直しで更なる節約効果が期待できます'
    ],
    motivation: '素晴らしい家計管理能力です！あと少しの工夫でZero神レベルに到達できますよ。'
  },
  {
    level: 'budget_warrior',
    title: '予算戦士',
    subtitle: '平均的な節約レベル',
    emoji: '⚔️',
    description: '一般的な節約意識を持っていますが、まだ改善の余地があります。計画的な支出を心がけることで、大きな節約効果が期待できます。',
    scoreRange: [2.5, 3.5],
    potentialSavings: {
      monthly: '10,000円〜20,000円',
      yearly: '120,000円〜240,000円'
    },
    recommendations: {
      title: '効果的な節約方法',
      items: [
        '週単位での予算設定',
        'コンビニ利用を控えてスーパーでまとめ買い',
        '外食を月○回までと決める',
        '衝動買い防止の24時間ルール導入'
      ]
    },
    tips: [
      '買い物前にリストを作成しましょう',
      '「本当に必要？」を3回自問してから購入',
      '代替案を考える習慣をつけましょう'
    ],
    motivation: '節約戦士として基礎はできています。戦略を立てて無駄遣いと戦いましょう！年間20万円以上の節約も夢ではありません。'
  },
  {
    level: 'spender_alert',
    title: '支出アラート',
    subtitle: '注意が必要なレベル',
    emoji: '⚠️',
    description: '無駄遣いが多めで、家計に影響を与え始めています。今すぐ行動を起こすことで、大幅な改善が可能です。',
    scoreRange: [3.5, 4.5],
    potentialSavings: {
      monthly: '25,000円〜40,000円',
      yearly: '300,000円〜480,000円'
    },
    recommendations: {
      title: '緊急改善プラン',
      items: [
        '全支出の記録を1週間つける',
        '不要なサブスクを今すぐ解約',
        '外食・デリバリーを半分に削減',
        '衝動買いを防ぐアプリの活用'
      ]
    },
    tips: [
      '支出を「必要」「欲しい」「不要」に分類してみましょう',
      '買い物前に予算を決めて現金のみで買い物',
      'ストレス発散の別の方法を見つけましょう'
    ],
    motivation: '改善の余地が大きいということは、節約効果も大きいということ。今から始めれば年間48万円の節約も可能です！'
  },
  {
    level: 'waste_danger',
    title: 'ムダ遣いデンジャー',
    subtitle: '緊急対策が必要！',
    emoji: '🚨',
    description: '非常に多くの無駄遣いをしており、家計が危険な状態です。すぐに抜本的な改革が必要ですが、改善すれば劇的な効果が期待できます。',
    scoreRange: [4.5, 5.0],
    potentialSavings: {
      monthly: '50,000円〜100,000円',
      yearly: '600,000円〜1,200,000円'
    },
    recommendations: {
      title: '緊急改革プラン',
      items: [
        '支出の完全見える化（レシート写真撮影）',
        '全サブスクの即座解約',
        '現金生活への切り替え（カード封印）',
        '支出管理アプリの導入'
      ]
    },
    tips: [
      '今日から変われば人生が変わります',
      '小さな変化から始める（コンビニに立ち寄らない等）',
      '家族や友人に協力してもらいましょう',
      'プロのファイナンシャルアドバイザーへの相談も検討'
    ],
    motivation: '危機的状況ですが、逆に言えば改善の効果が最も大きい状態です。今すぐ行動すれば年間100万円以上の節約も可能。人生を変えるチャンスです！'
  }
];

// スコア計算関数
export function calculateWasteScore(answers: Record<string, string>): number {
  // 基本スコアの計算（1-5の範囲）
  let score = 2.5; // 基準値

  // 無駄遣いレベルの影響（最も重要）
  const wasteLevel = answers['wasteLevel'] || 'medium';
  const wasteLevelScores = { low: 1.2, medium: 2.5, high: 3.8, extreme: 4.8 };
  score = wasteLevelScores[wasteLevel as keyof typeof wasteLevelScores] || 2.5;

  // 月間無駄遣い額の影響
  const monthlyWaste = answers['monthlyWaste'] || '5k_15k';
  const monthlyMultipliers = { 
    less_5k: 0.8, 
    '5k_15k': 1.0, 
    '15k_30k': 1.3, 
    '30k_50k': 1.6, 
    more_50k: 2.0 
  };
  score *= monthlyMultipliers[monthlyWaste as keyof typeof monthlyMultipliers] || 1.0;

  // 節約意識の影響（逆相関）
  const awareness = answers['awareness'] || 'sometimes';
  const awarenessMultipliers = { 
    serious: 0.7, 
    trying: 0.85, 
    sometimes: 1.0, 
    unaware: 1.3 
  };
  score *= awarenessMultipliers[awareness as keyof typeof awarenessMultipliers] || 1.0;

  // 年代補正
  const age = answers['age'] || '30s';
  const ageMultipliers = { 
    '20s': 0.9, 
    '30s': 1.0, 
    '40s': 1.1, 
    '50s': 1.1, 
    '60plus': 0.8 
  };
  score *= ageMultipliers[age as keyof typeof ageMultipliers] || 1.0;

  return Math.max(1.0, Math.min(5.0, score));
}

// 診断結果取得関数
export function getWasteDiagnosisResult(score: number): WasteDiagnosisResult {
  return wasteDiagnosisResults.find(result => 
    score >= result.scoreRange[0] && score <= result.scoreRange[1]
  ) || wasteDiagnosisResults[2]; // デフォルトは予算戦士
}