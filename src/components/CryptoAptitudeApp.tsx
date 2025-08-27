import React, { useEffect, useMemo, useRef, useState } from "react";

// Exchange registry and affiliate link configuration
type Exchange = { key: string; name: string; link: string; notes?: string[] };

const EXCHANGES: Record<string, Exchange> = {
  coincheck: { 
    key: 'coincheck', 
    name: 'Coincheck', 
    link: import.meta.env.VITE_AFF_COINCHECK ?? '#',
    notes: ['最初の口座として検討しやすい']
  },
  gmo: { 
    key: 'gmo', 
    name: 'GMOコイン', 
    link: import.meta.env.VITE_AFF_GMO ?? '#',
    notes: ['国内の主要事業者の一つ']
  },
  bitbank: { 
    key: 'bitbank', 
    name: 'bitbank', 
    link: import.meta.env.VITE_AFF_BITBANK ?? '#',
    notes: ['板取引に慣れたい方向け']
  },
  bitflyer: { 
    key: 'bitflyer', 
    name: 'bitFlyer', 
    link: import.meta.env.VITE_AFF_BITFLYER ?? '#',
    notes: ['アプリ中心で始めたい方向け']
  },
  sbivc: { 
    key: 'sbivc', 
    name: 'SBI VCトレード', 
    link: import.meta.env.VITE_AFF_SBIVC ?? '#',
    notes: ['大手金融グループの関連会社']
  },
  okj: { 
    key: 'okj', 
    name: 'OKCoinJapan (OKJ)', 
    link: import.meta.env.VITE_AFF_OKJ ?? '#',
    notes: ['海外グループの日本法人']
  },
  bitpoint: { 
    key: 'bitpoint', 
    name: 'BITPOINT', 
    link: import.meta.env.VITE_AFF_BITPOINT ?? '#',
    notes: ['積立などの現物取引から']
  },
};

const RECO_BY_PERSONA: Record<PersonaKey, string[]> = {
  shortTerm: ['bitbank', 'bitflyer', 'sbivc'],
  swing: ['bitbank', 'gmo', 'bitflyer'],
  dca: ['coincheck', 'bitpoint', 'gmo'],
  learnFirst: ['coincheck', 'bitflyer', 'okj'],
  notRecommended: ['coincheck', 'gmo'],
};

/**
 * Zero神 → 暗号資産トレード適性診断 v1
 * - 単一ファイルで「トップ / 設問 / 結果」まで完結
 * - Tailwind想定（クラス付き）。無くても動作はします
 * - Next.js の pages/ や app/(routes) 配下に配置して使えます
 * - 主要編集ポイント：COPY, QUESTIONS, CATEGORY_WEIGHTS, persona の閾値
 */

// ---------- コピー（トップ/フッター/FAQ） ----------
const COPY = {
  brand: "CoinChoice診断",
  title: "暗号資産トレード適性 30秒診断",
  subtitle:
    "あなたのリスク許容度・時間・知識・セキュリティ意識から最適な始め方を提案します。投資助言ではなく、自己判断の参考情報です。",
  cta: "無料で診断をはじめる",
  trust: [
    "メール登録不要・匿名OK",
    "全16問・所要30-60秒",
    "結果に合った学習/スタート手順を提示",
  ],
  howSteps: [
    { n: 1, t: "質問に答える", d: "全16問、直感でOK" },
    { n: 2, t: "スコア算出", d: "8領域×重み付けで評価" },
    { n: 3, t: "最適ルート", d: "あなた向けの始め方と注意点" },
  ],
  disclaimers: [
    "結果ページには結果ごとのユーザーにおすすめの取引先の口座開設の案内を設置します。アフィリエイトリンクになっていますので結果ページは広告を含みます。",
    "本サービスは情報提供のみを目的とし、特定の暗号資産や金融商品等の勧誘・助言ではありません。",
    "暗号資産は価格変動が大きく、元本割れのリスクがあります。取引は余剰資金で行い、ご自身の判断と責任で実施してください。",
    "税制・法令・各サービス仕様は変更されることがあります。最新の公式情報をご確認ください。",
  ],
  faq: [
    {
      q: "誰向けの診断ですか？",
      a: "これから暗号資産を始めたい方〜経験者まで、現在の適性を俯瞰する目的で使えます。",
    },
    {
      q: "結果は投資助言ですか？",
      a: "いいえ。行動の判断は必ずご自身で行ってください。必要に応じて専門家へ相談を。",
    },
    {
      q: "未成年でも使えますか？",
      a: "診断の閲覧は可能ですが、実際の取引は各サービスの年齢規約や法令に従ってください。",
    },
    {
      q: "個人情報は必要ですか？",
      a: "この診断ではメール登録は不要です（任意で結果の保存/共有機能はあります）。",
    },
  ],
  pdfGift: {
    badge: "特典",
    title: "診断に回答してくれた方へ「仮想通貨の始め方 完全ガイド（PDF）」を無料プレゼント",
    subtitle: "初心者が最初につまずきやすい本人確認・2FA・初回入金・最初の購入・安全対策を1冊に整理。※投資助言ではありません",
    ctaTop: "診断に回答してPDFを受け取る",
    ctaResult: "完全ガイド（PDF）をダウンロード",
    note: "このPDFは情報提供を目的としたもので、投資助言ではありません。内容・制度は変更される場合があります。必ず最新の公式情報をご確認ください。"
  },
};

// ---------- 設問定義 ----------
// 選択肢（0〜4）: 0=まったくそう思わない / 1=あまり / 2=どちらとも / 3=やや / 4=とてもそう思う
// direction: "pos" は高いほど良い, "neg" は高いほど悪い（スコア反転）
// category は8領域（risk, emotion, discipline, time, knowledge, security, compliance, capital）

export type CategoryKey =
  | "risk"
  | "emotion"
  | "discipline"
  | "time"
  | "knowledge"
  | "security"
  | "compliance"
  | "capital";

export type Question = {
  id: string;
  text: string;
  category: CategoryKey;
  direction: "pos" | "neg";
  help?: string; // 注釈
};

const CHOICES_3 = ["はい", "わからない", "いいえ"] as const;
type Choice3 = 0 | 1 | 2; // 0=はい,1=わからない,2=いいえ

const QUESTIONS: Question[] = [
  { 
    id: "start_small", 
    text: "まずは少額からコツコツ始めたい", 
    category: "discipline", 
    direction: "pos" 
  },
  { 
    id: "spare_money", 
    text: "生活費とは別に、失っても生活に影響しないお金がある", 
    category: "capital", 
    direction: "pos",
    help: "余剰資金＝生活に必要なお金とは別に用意した、減っても生活に支障が出にくいお金"
  },
  { 
    id: "drop_ok", 
    text: "価格が下がっても慌てずに様子を見る自信がある", 
    category: "emotion", 
    direction: "pos" 
  },
  { 
    id: "weekly_time", 
    text: "週に30分〜1時間は学習やアプリ操作の時間を作れそう", 
    category: "time", 
    direction: "pos" 
  },
  { 
    id: "device_ok", 
    text: "スマホやパソコンの基本操作に不安はない", 
    category: "knowledge", 
    direction: "pos" 
  },
  { 
    id: "id_docs", 
    text: "本人確認書類（運転免許証やマイナンバーカードなど）を用意できる", 
    category: "compliance", 
    direction: "pos" 
  },
  { 
    id: "2fa", 
    text: "ログイン時に使う2段階認証（2FA）を設定できる", 
    category: "security", 
    direction: "pos",
    help: "2FA＝ID/パスワードに加え、アプリやSMSのコードでもう1段階確認する仕組み"
  },
  { 
    id: "phish", 
    text: "偽サイトやフィッシングに注意し、公式URLをブックマークして使うつもり", 
    category: "security", 
    direction: "pos",
    help: "検索広告やDMから偽サイトに誘導される被害が多く報告。公式URLを保存して直接アクセスするのが安全"
  },
  { 
    id: "tax", 
    text: "利益が出たら税金が必要になる場合があることを理解している", 
    category: "compliance", 
    direction: "pos",
    help: "日本では暗号資産の売買差益などは原則『雑所得』。状況により確定申告が必要になる場合があります"
  },
  { 
    id: "dca_like", 
    text: "一度にまとめて買うより、『毎月一定額で積み立てる』方が安心だと感じる", 
    category: "risk", 
    direction: "pos",
    help: "積立（DCA）＝価格に関係なく一定額を定期購入して平均取得単価をならす方法"
  },
  { 
    id: "journal", 
    text: "始めたら簡単な記録（買った日・理由など）をつけるつもり", 
    category: "discipline", 
    direction: "pos" 
  },
  { 
    id: "fomo", 
    text: "SNSで『今すぐ買え』と言われても、すぐには飛びつかない自信がある", 
    category: "emotion", 
    direction: "pos" 
  },
];

// カテゴリ重み（合計1.0を推奨）
const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  risk: 0.2,
  emotion: 0.15,
  discipline: 0.15,
  time: 0.1,
  knowledge: 0.15,
  security: 0.1,
  compliance: 0.05,
  capital: 0.1,
};

// ---------- スコアリング ----------
export type Answers = Record<string, Choice3>; // id → 0..2

function normalize3(v: Choice3) {
  // 0=はい, 1=わからない, 2=いいえ
  // pos: はい=1.0, わからない=0.5, いいえ=0.0
  return v === 0 ? 1 : v === 1 ? 0.5 : 0;
}

function questionScore3(q: Question, choice: Choice3) {
  const base = normalize3(choice);
  return q.direction === "pos" ? base : 1 - base;
}

function categoryScores(answers: Answers) {
  const byCat: Record<CategoryKey, { sum: number; count: number }> = {
    risk: { sum: 0, count: 0 },
    emotion: { sum: 0, count: 0 },
    discipline: { sum: 0, count: 0 },
    time: { sum: 0, count: 0 },
    knowledge: { sum: 0, count: 0 },
    security: { sum: 0, count: 0 },
    compliance: { sum: 0, count: 0 },
    capital: { sum: 0, count: 0 },
  };

  for (const q of QUESTIONS) {
    const choice = answers[q.id] ?? 1; // 未回答は「わからない」
    const s = questionScore3(q, choice);
    byCat[q.category].sum += s;
    byCat[q.category].count += 1;
  }

  const out: Record<CategoryKey, number> = {
    risk: 0,
    emotion: 0,
    discipline: 0,
    time: 0,
    knowledge: 0,
    security: 0,
    compliance: 0,
    capital: 0,
  };

  (Object.keys(byCat) as CategoryKey[]).forEach((k) => {
    const { sum, count } = byCat[k];
    out[k] = count ? sum / count : 0.5;
  });

  return out; // 各0..1
}

function overallScore(cat: Record<CategoryKey, number>) {
  let total = 0;
  (Object.keys(cat) as CategoryKey[]).forEach((k) => {
    total += cat[k] * (CATEGORY_WEIGHTS[k] || 0);
  });
  return Math.round(total * 100); // 0..100
}

// 結果タイプ
export type PersonaKey =
  | "shortTerm"
  | "swing"
  | "dca"
  | "learnFirst"
  | "notRecommended";

const PERSONA_COPY: Record<PersonaKey, { title: string; desc: string; tips: string[]; color: string }> = {
  shortTerm: {
    title: "短期トレード（低レバ）候補",
    desc:
      "規律・感情コントロール・時間投下が平均以上。まずは現物/低レバで、明確なルールと記録を徹底しましょう。",
    tips: [
      "週次でトレード日誌→改善点を1つだけ固定",
      "レバは低倍数から（必要時のみ）。同時ポジションを増やしすぎない",
      "イベント前後はサイズ調整/見送りを徹底",
    ],
    color: "from-indigo-500 to-sky-500",
  },
  swing: {
    title: "スイング現物型",
    desc:
      "知識と規律がバランス良好。日足〜週足のサイクルで無理なく継続を。分割エントリー/利確とリスク管理が鍵。",
    tips: [
      "週1回の定点観測と計画更新",
      "損切り/利確のトレードルールを事前に文字化",
      "ボラ拡大時はポジションサイズを下げる",
    ],
    color: "from-green-500 to-lime-500",
  },
  dca: {
    title: "長期積立（DCA）推奨",
    desc:
      "時間や経験が限られても続けやすい手法。主要銘柄の積立とセキュリティ/税制リテラシーの強化を優先。",
    tips: [
      "自動積立の設定/上限と見直しタイミングを決める",
      "2FA/パス管理/詐欺対策の徹底",
      "税申告の流れを早めに把握（ソフト活用など）",
    ],
    color: "from-yellow-500 to-amber-500",
  },
  learnFirst: {
    title: "まず学習＋現物のみで小さく",
    desc:
      "セキュリティ・税制・規律/感情のいずれかに弱点。少額の現物のみで、記録と学習を積み上げましょう。",
    tips: [
      "典型的な詐欺パターンの学習とブラウザ安全設定",
      "トレード記録テンプレで振り返りを習慣化",
      "指値/逆指値など基本オーダーの実践練習",
    ],
    color: "from-slate-500 to-zinc-500",
  },
  notRecommended: {
    title: "今は取引非推奨（準備から）",
    desc:
      "余剰資金やセキュリティ/規律が不足。生活防衛資金の確保と基礎学習、デモ/紙上トレードから始めましょう。",
    tips: [
      "家計の可視化と余剰資金づくり（緊急資金3〜6か月）",
      "2FA導入・パスワード管理・バックアップ体制",
      "学習→小額現物→記録→改善の反復",
    ],
    color: "from-rose-500 to-red-500",
  },
};

function decidePersona(cat: Record<CategoryKey, number>, score: number): PersonaKey {
  // ガード条件
  const weakSecurity = cat.security < 0.5;
  const weakCapital = cat.capital < 0.5;
  if (weakCapital || (weakSecurity && score < 70)) {
    return weakCapital ? "notRecommended" : "learnFirst";
  }

  // しきい値判定（必要条件）
  if (
    score >= 80 &&
    cat.discipline >= 0.6 &&
    cat.emotion >= 0.6 &&
    cat.time >= 0.6 &&
    cat.risk >= 0.6
  ) {
    return "shortTerm";
  }

  if (score >= 65 && cat.discipline >= 0.5 && cat.security >= 0.5) return "swing";
  if (score >= 50) return "dca";
  if (score >= 35) return "learnFirst";
  return "notRecommended";
}

// ---------- UI ----------

function InlineHelp({ text }: { text?: string }) {
  if (!text) return null;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <span ref={ref} className="relative ml-2 inline-flex">
      <button
        type="button"
        aria-label="用語の説明"
        onClick={() => setOpen(v => !v)}
        className="text-xs inline-flex items-center justify-center w-5 h-5 rounded-full border text-gray-600 hover:bg-gray-50 transition-colors"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-[120%] w-72 p-3 rounded-xl border bg-white shadow-lg text-sm leading-relaxed break-words">
          {text}
        </div>
      )}
    </span>
  );
}

// Top Gift Banner component for PDF promotion
function TopGiftBanner({ onStart }: { onStart: () => void }) {
  return (
    <section className="mt-8">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full border border-blue-300 bg-blue-100 text-blue-700 font-medium">
            {COPY.pdfGift.badge}
          </span>
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-relaxed mb-3">
          {COPY.pdfGift.title}
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          {COPY.pdfGift.subtitle}
        </p>
        <div>
          <button
            onClick={onStart}
            className="px-6 py-3 rounded-2xl bg-red-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            aria-label="診断に回答してPDFを受け取る"
          >
            {COPY.pdfGift.ctaTop}
          </button>
        </div>
      </div>
    </section>
  );
}

// Result PDF CTA component for download
function ResultPdfCTA() {
  const PDF_URL = import.meta.env.VITE_PDF_BEGINNERS_GUIDE_URL || "";
  const disabled = !PDF_URL;

  const onClick = () => {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'pdf_download_click', { item: 'beginners_guide' });
      }
    } catch (e) {
      // Ignore analytics errors
    }
  };

  return (
    <section className="mt-10">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 shadow-sm">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-3">
          {COPY.pdfGift.title}
        </h3>
        <p className="text-gray-700 text-[15px] md:text-[16px] leading-relaxed mb-6">
          {COPY.pdfGift.subtitle}
        </p>
        <div className="mb-4">
          <a
            href={disabled ? undefined : PDF_URL}
            onClick={disabled ? (e) => e.preventDefault() : onClick}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={disabled}
            className={
              "inline-block px-6 py-3 rounded-2xl font-semibold transition-colors " +
              (disabled
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-red-500 text-white cursor-not-allowed")
            }
            aria-label="仮想通貨の始め方 完全ガイド（PDF）をダウンロード"
          >
            {COPY.pdfGift.ctaResult}
          </a>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          {COPY.pdfGift.note}
        </p>
      </div>
    </section>
  );
}

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  risk: "リスク許容",
  emotion: "感情コントロール",
  discipline: "規律",
  time: "時間投下",
  knowledge: "知識",
  security: "セキュリティ",
  compliance: "コンプライアンス",
  capital: "余剰資金",
};

function Progress({ value }: { value: number }) {
  return (
    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-sm">
      {children}
    </span>
  );
}

export default function CryptoAptitudeApp() {
  const [stage, setStage] = useState<"home" | "quiz" | "result">("home");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const progress = Math.round(((idx) / QUESTIONS.length) * 100);

  const cats = useMemo(() => categoryScores(answers), [answers]);
  const total = useMemo(() => overallScore(cats), [cats]);
  const persona = useMemo(() => decidePersona(cats, total), [cats, total]);

  const start = () => {
    setStage("quiz");
    setIdx(0);
    setAnswers({});
  };

  const onSelect = (choice: Choice3) => {
    const q = QUESTIONS[idx];
    if (q) {
      setAnswers((prev) => ({ ...prev, [q.id]: choice }));
      // 軽いフィードバック後に自動遷移
      setTimeout(() => {
        if (idx < QUESTIONS.length - 1) {
          setIdx(idx + 1);
        } else {
          setStage("result");
        }
      }, 120);
    }
  };

  const current = QUESTIONS[idx];

  if (!current) {
    return null; // Safety check
  }

  const shareText = useMemo(() => {
    const p = PERSONA_COPY[persona];
    return `【${COPY.brand}】診断結果\nスコア: ${total}/100\nタイプ: ${p.title}\n要点: ${p.desc}\n#暗号資産 #トレード適性`; // 140字程度
  }, [persona, total]);

  return (
    <>
      <style>
        {`html { overflow-y: scroll; }`}
      </style>
      <div className="min-h-screen bg-white text-gray-900 text-[15px] md:text-[16px] leading-relaxed">
      <div className="container mx-auto max-w-screen-lg px-4 md:px-5 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700" />
            <h1 className="font-semibold text-gray-900 tracking-tight">{COPY.brand}</h1>
          </div>
          <a
            href="#disclaimers"
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            重要な注意事項
          </a>
        </header>

        {stage === "home" && (
          <main>
            {/* Hero */}
            <section className="text-center py-12">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight text-gray-900">
                {COPY.title}
              </h2>
              <p className="mt-6 text-gray-600 max-w-2xl mx-auto leading-relaxed">{COPY.subtitle}</p>
              <div className="mt-8">
                <button
                  onClick={start}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {COPY.cta}
                </button>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {COPY.trust.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            </section>

            {/* PDF Gift Banner */}
            <TopGiftBanner onStart={start} />

            {/* How it works */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch content-stretch mt-8">
              {COPY.howSteps.map((s, index) => {
                const colors = [
                  "bg-blue-50 border-blue-200",
                  "bg-green-50 border-green-200", 
                  "bg-purple-50 border-purple-200"
                ];
                return (
                  <div key={s.n} className={`p-6 rounded-2xl shadow-sm border h-full flex flex-col ${colors[index]}`}>
                    <div className="text-sm text-gray-500">STEP {s.n}</div>
                    <div className="text-lg font-semibold mt-3 text-gray-900 break-words break-keep min-w-0">{s.t}</div>
                    <div className="text-gray-600 mt-2 leading-relaxed grow min-h-[56px]">{s.d}</div>
                  </div>
                );
              })}
            </section>

            {/* FAQ */}
            <section className="mt-16">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">よくある質問</h3>
              <div className="space-y-4">
                {COPY.faq.map(({ q, a }) => (
                  <details key={q} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <summary className="font-semibold cursor-pointer text-gray-900 hover:text-gray-700">{q}</summary>
                    <p className="text-gray-600 mt-3 leading-relaxed">{a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* Disclaimers */}
            <section id="disclaimers" className="mt-16">
              <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
                {COPY.disclaimers.map((d, i) => (
                  <p key={i}>• {d}</p>
                ))}
              </div>
            </section>
          </main>
        )}

        {stage === "quiz" && (
          <main>
            <div className="flex items-center gap-4 mb-6 min-h-[28px]">
              <button
                onClick={() => setStage("home")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← トップへ
              </button>
              <div className="flex-1" />
              <div className="text-sm text-gray-500">
                {idx + 1}/{QUESTIONS.length}
              </div>
            </div>

            <Progress value={progress} />

            <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="text-sm text-gray-500 mb-2">質問 {idx + 1}</div>
              <h2 className="text-xl font-semibold mt-1 text-gray-900 leading-relaxed flex items-start">
                {current.text}
                <InlineHelp text={current.help} />
              </h2>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CHOICES_3.map((label, i) => {
                  const selected = (answers[current.id] ?? -1) === i;
                  return (
                    <button
                      key={i}
                      onClick={() => onSelect(i as Choice3)}
                      className={
                        "text-center rounded-2xl border p-4 text-base transition-all min-h-[60px] font-medium break-words break-keep " +
                        (selected 
                          ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" 
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50")
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setIdx((v) => Math.max(0, v - 1))}
                  disabled={idx === 0}
                  className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  戻る
                </button>
                <div className="text-sm text-gray-500">
                  回答を選択すると自動で次の質問へ進みます
                </div>
              </div>
            </div>
          </main>
        )}

        {stage === "result" && (
          <main>
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setStage("home")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                ← トップへ
              </button>
              <button onClick={() => setStage("quiz")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                設問に戻る
              </button>
              <div className="flex-1" />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(shareText);
                  alert("結果テキストをコピーしました");
                }}
                className="text-sm px-4 py-2 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                結果をコピー
              </button>
            </div>

            <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="text-sm text-gray-500">総合スコア</div>
              <div className="flex items-end gap-4 mt-3">
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{total}</div>
                <div className="text-gray-600 mb-2">/ 100</div>
              </div>
              <div className="mt-4">
                <Progress value={total} />
              </div>

              <PersonaCard persona={persona} />

              <PrimaryCTA persona={persona} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch content-stretch mt-8">
                {(Object.keys(cats) as CategoryKey[]).map((k, index) => {
                  const colors = [
                    "bg-gradient-to-r from-blue-500 to-blue-600",
                    "bg-gradient-to-r from-green-500 to-green-600",
                    "bg-gradient-to-r from-purple-500 to-purple-600",
                    "bg-gradient-to-r from-yellow-500 to-yellow-600",
                    "bg-gradient-to-r from-indigo-500 to-indigo-600",
                    "bg-gradient-to-r from-pink-500 to-pink-600",
                    "bg-gradient-to-r from-cyan-500 to-cyan-600",
                    "bg-gradient-to-r from-red-500 to-red-600"
                  ];
                  return (
                    <div key={k} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-gray-500 break-words break-keep min-w-0">{CATEGORY_LABEL[k]}</div>
                        <div className="text-xs font-semibold text-gray-700">{Math.round(cats[k] * 100)} / 100</div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden grow">
                        <div
                          className={`h-full transition-all duration-300 ${colors[index % colors.length]}`}
                          style={{ width: `${Math.round(cats[k] * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Secondary Exchange Recommendations */}
              <ExchangeRecommendations persona={persona} />

              <div className="text-xs text-gray-600 leading-relaxed space-y-2">
                ※ スコアは自己申告に基づく簡易評価です。投資判断の基礎資料としては使用できません。
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch content-stretch mt-6">
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm h-full flex flex-col">
                <div className="text-xs text-gray-500 mb-2">次の一歩</div>
                <div className="font-semibold text-gray-900 mb-3 break-words break-keep min-w-0">学ぶ</div>
                <ul className="text-sm list-disc list-inside text-gray-700 space-y-1 leading-relaxed grow min-h-[64px]">
                  <li>基本用語：成行/指値/逆指値、ボラティリティ、ポジションサイズ</li>
                  <li>安全：2FA/パス管理/詐欺対策（偽サイト/DMに注意）</li>
                  <li>記録：トレード日誌テンプレで振り返り</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm h-full flex flex-col">
                <div className="text-xs text-gray-500 mb-2">次の一歩</div>
                <div className="font-semibold text-gray-900 mb-3 break-words break-keep min-w-0">はじめる</div>
                <ul className="text-sm list-disc list-inside text-gray-700 space-y-1 leading-relaxed grow min-h-[64px]">
                  <li>本人確認/セキュリティ設定→少額現物で操作確認</li>
                  <li>自動積立 or 小額・低頻度のスイングから</li>
                  <li>税申告フローの把握（ツール活用）</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm h-full flex flex-col">
                <div className="text-xs text-gray-500 mb-2">次の一歩</div>
                <div className="font-semibold text-gray-900 mb-3 break-words break-keep min-w-0">守る</div>
                <ul className="text-sm list-disc list-inside text-gray-700 space-y-1 leading-relaxed grow min-h-[64px]">
                  <li>2FA必須/機種変更時のバックアップ運用</li>
                  <li>公式URLのブックマーク、検索広告の偽サイトに注意</li>
                  <li>SNSの勧誘/高利回り案件は原則スルー</li>
                </ul>
              </div>
            </section>

            {/* PDF Download CTA */}
            <ResultPdfCTA />

            <section id="disclaimers" className="mt-16">
              <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
                {COPY.disclaimers.map((d, i) => (
                  <p key={i}>• {d}</p>
                ))}
              </div>
            </section>
          </main>
        )}

        {/* Footer */}
        <footer className="mt-20 mb-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {COPY.brand}. これは投資助言ではありません。
        </footer>
      </div>
      
      {/* Sticky CTA for result stage */}
      {stage === "result" && <StickyCTA persona={persona} />}
    </div>
    </>
  );
}

function PersonaCard({ persona }: { persona: PersonaKey }) {
  const p = PERSONA_COPY[persona];
  return (
    <div className="mt-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <div className="text-sm text-gray-500 mb-2">あなたのタイプ</div>
      <div className="text-xl md:text-[20px] font-semibold mt-1 tracking-tight text-gray-900 mb-3">{p.title}</div>
      <p className="mt-1 text-gray-700 leading-relaxed mb-4">{p.desc}</p>
      <ul className="mt-3 text-sm leading-relaxed list-disc list-inside text-gray-700 space-y-1">
        {p.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

// Primary CTA component for enhanced conversion
function PrimaryCTA({ persona }: { persona: PersonaKey }) {
  const primaryKey = (RECO_BY_PERSONA[persona] || [])[0];
  if (!primaryKey) return null;
  const ex = EXCHANGES[primaryKey];
  if (!ex) return null;

  const handleClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'aff_click', {
        exchange: primaryKey,
        persona: persona,
        position: 'primary'
      });
    }
  };

  return (
    <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900">最初の一歩におすすめの口座</h3>
        <span className="text-xs px-2 py-0.5 rounded-full border border-purple-300 bg-purple-100 text-purple-700 font-medium">広告</span>
      </div>
      <p className="text-gray-700 text-[15px] md:text-[16px] leading-relaxed mb-6">
        CoinChoice診断のあなたの結果に基づく提案です。手数料・取扱銘柄・最新情報は必ず公式でご確認ください。
      </p>
      <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50 h-full flex flex-col">
        <div className="font-semibold text-[15px] md:text-base text-gray-900 mb-3 break-words break-keep min-w-0">{ex.name}</div>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1 mb-4 leading-relaxed grow min-h-[64px]">
          {(ex.notes || []).map(n => <li key={n}>{n}</li>)}
          <li>本人確認で準備：身分証／メール／2段階認証</li>
        </ul>
        <a 
          href={ex.link} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleClick}
          aria-label={`${ex.name}の口座開設（公式）`}
          className="inline-block w-full text-center px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl mt-auto"
        >
          口座開設へ（公式）
        </a>
        <p className="text-xs font-medium text-gray-600 leading-relaxed mt-3">
          ※このリンクはアフィリエイトを含みます。投資判断はご自身の責任で行ってください。
        </p>
      </div>
    </div>
  );
}

// Sticky CTA bar for enhanced conversion
function StickyCTA({ persona }: { persona: PersonaKey }) {
  const primaryKey = (RECO_BY_PERSONA[persona] || [])[0];
  if (!primaryKey) return null;
  const ex = EXCHANGES[primaryKey];
  if (!ex) return null;
  
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("sticky_seen");
    function onScroll() {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (!seen && scrolled > 0.5) { 
        setOpen(true); 
        sessionStorage.setItem("sticky_seen", "1"); 
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'aff_click', {
        exchange: primaryKey,
        persona: persona,
        position: 'sticky'
      });
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-screen-lg m-3 p-3 bg-white/95 backdrop-blur border border-gray-200 rounded-2xl shadow-sm flex items-center gap-3">
        <div className="text-sm text-gray-800 flex-1 break-words break-keep min-w-0">
          <span className="font-semibold">あなたの結果に合う口座：</span>{ex.name}
        </div>
        <a 
          href={ex.link} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleClick}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 whitespace-nowrap"
        >
          口座開設へ（公式）
        </a>
        <button 
          aria-label="閉じる" 
          onClick={() => setOpen(false)}
          className="ml-2 text-gray-600 hover:text-gray-900 px-2 py-1 transition-colors flex-shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ExchangeRecommendations({ persona }: { persona: PersonaKey }) {
  const keys = RECO_BY_PERSONA[persona] || [];
  
  const handleExchangeClick = (exchangeKey: string) => {
    // Optional: Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'aff_click', {
        exchange: exchangeKey,
        persona: persona
      });
    }
  };
  
  return (
    <div className="mt-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold tracking-tight text-gray-900">あなたにおすすめの国内取引所</h3>
        <span className="text-xs px-2 py-1 rounded-full border border-gray-300 bg-gray-50 text-gray-600">広告</span>
      </div>
      <p className="text-sm text-gray-600 mb-6 text-[15px] md:text-[16px] leading-relaxed">
        このセクションにはアフィリエイトリンクが含まれます。各社の最新情報・手数料・取扱商品は必ず公式サイトでご確認ください。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch content-stretch">
        {keys.map((k) => {
          const ex = EXCHANGES[k];
          if (!ex) return null;
          return (
            <div key={ex.key} className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm h-full flex flex-col">
              <div className="font-semibold text-[15px] md:text-base text-gray-900 mb-3 break-words break-keep min-w-0">{ex.name}</div>
              {ex.notes && (
                <ul className="mt-2 text-sm leading-relaxed text-gray-700 space-y-1 list-disc list-inside mb-4 grow min-h-[64px]">
                  {ex.notes.map((n) => <li key={n}>{n}</li>)}
                  <li>詳細仕様・手数料は公式を確認</li>
                </ul>
              )}
              <a 
                href={ex.link} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => handleExchangeClick(ex.key)}
                className="inline-block w-full text-center px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl mt-auto"
              >
                口座開設へ（公式）
              </a>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-600 mt-6 leading-relaxed">
        ※本表示は診断結果に基づく一般的な提案であり、投資助言ではありません。
      </p>
    </div>
  );
}