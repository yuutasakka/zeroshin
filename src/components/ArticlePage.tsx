import React from 'react';
import FixedCTA from './FixedCTA';
import Footer from './Footer';
import Header from './Header';

interface ArticlePageProps {
  onStartDiagnosis: () => void;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ onStartDiagnosis }) => {
  const handleScrollToDiagnosis = () => {
    onStartDiagnosis();
  };

  return (
    <>
      <Header />
      <main style={{ 
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        paddingTop: '80px'
      }}>
        <article style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px 20px',
          lineHeight: '1.8',
          fontSize: '16px',
          color: '#333333',
          fontFamily: 'Inter, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif'
        }}>
          {/* 記事ヘッダー */}
          <header style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: '700',
              color: '#2563eb',
              marginBottom: '20px',
              lineHeight: '1.3'
            }}>
              無駄遣いしない人の特徴：<br />
              賢いお金の使い方を身につける7つのポイント
            </h1>
            
            {/* 冒頭の診断ボタン */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              padding: '24px',
              borderRadius: '16px',
              margin: '30px 0',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)'
            }}>
              <p style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                あなたの無駄遣い度は？
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                まずは現在の状況をチェックしてみましょう
              </p>
              <button
                onClick={handleScrollToDiagnosis}
                style={{
                  width: '100%',
                  padding: '16px 32px',
                  backgroundColor: 'white',
                  color: '#3b82f6',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
              >
                30秒で無駄遣い診断を開始
              </button>
            </div>
          </header>

          {/* 記事本文 */}
          <section style={{ marginBottom: '40px' }}>
            <p style={{ marginBottom: '24px', fontSize: '18px', color: '#4b5563' }}>
              現代社会において、お金の管理能力は人生の質を大きく左右する重要なスキルです。同じような収入でも、人によって貯蓄額には大きな差が生まれます。その違いは一体何なのでしょうか？今回は、無駄遣いしない人の特徴を詳しく分析し、賢いお金の使い方を身につけるためのポイントをご紹介します。
            </p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '30px',
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '16px'
            }}>
              無駄遣いしない人の7つの特徴
            </h2>

            {/* 特徴1 */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '16px'
              }}>
                1. 計画的な金銭管理能力
              </h3>
              <p style={{ marginBottom: '16px' }}>
                無駄遣いしない人の最も重要な特徴は、計画性を持ってお金を使うことです。彼らは衝動的にお金を使うのではなく、「いつ、何を、いくらで購入するか」を事前に計画し、予算を決めてそれ以上は使わないよう徹底しています。
              </p>
              <p style={{ marginBottom: '24px' }}>
                購入する時期から逆算して貯蓄を進め、セールやキャンペーンなど安い時期を狙って買い物をします。また、本当に必要なものかどうかを冷静に判断し、無駄な買い物を避けることを当たり前に実践している点が特徴的です。
              </p>
            </div>

            {/* 特徴2 */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '16px'
              }}>
                2. 収入を全て使わない生活習慣
              </h3>
              <p style={{ marginBottom: '16px' }}>
                賢い人は収入をすべて使わないという鉄則を守っています。給料日の前後で消費行動が変わることなく、必要な支出以外には手を付けずに残します。特に「先取り貯蓄」を実践し、給与が入ったらすぐに一定額を別口座に移すことで、自動的にお金が貯まる仕組みを作っています。
              </p>
              <p style={{ marginBottom: '24px' }}>
                これにより、浪費家のように「給与が入ったときにほとんどを散財してしまい、何も残らない」という状況を避けることができます。
              </p>
            </div>

            {/* 特徴3 */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '16px'
              }}>
                3. 低コストな趣味とストレス発散方法
              </h3>
              <p style={{ marginBottom: '16px' }}>
                無駄遣いしない人は、お金がかからない趣味や娯楽を楽しむ能力に長けています。読書、散歩、自宅での料理やDIY、自然の中での散策、無料のイベントや展示会への参加など、費用をかけずに充実した時間を過ごす方法を知っています。
              </p>
              <p style={{ marginBottom: '24px' }}>
                重要なのは、お金を使うことをストレス発散の手段にしないことです。運動やヨガ、瞑想などのリラックス方法や、友人・家族との交流など、お金をかけずにストレスを解消する代替手段を持っています。
              </p>
            </div>

            {/* 文中の診断ボタン */}
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '24px',
              borderRadius: '16px',
              margin: '40px 0',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)'
            }}>
              <p style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                あなたはどのタイプ？
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                無駄遣いのパターンを診断してみましょう
              </p>
              <button
                onClick={handleScrollToDiagnosis}
                style={{
                  padding: '14px 28px',
                  backgroundColor: 'white',
                  color: '#d97706',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                診断スタート
              </button>
            </div>

            {/* 特徴4 */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '16px'
              }}>
                4. 流行に惑わされない冷静な判断力
              </h3>
              <p style={{ marginBottom: '16px' }}>
                テレビのCMやSNSのインフルエンサーの影響で流行の商品を無計画に買うことはありません。一時的な流行に流されず、冷静に物事を考えることができるのが大きな特徴です。
              </p>
              <p style={{ marginBottom: '24px' }}>
                購入する場合は、流行が過ぎ去った後も価値が続くものや、自分のライフスタイルに合ったものを慎重に選びます。衝動買いを防ぎ、将来への投資や貯金に回すことを優先しています。
              </p>
            </div>

            {/* 特徴5 */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '16px'
              }}>
                5. コストパフォーマンスを重視した選択
              </h3>
              <p style={{ marginBottom: '16px' }}>
                価格だけでなく、商品やサービスの品質、耐久性、長期的な利益を総合的に判断して購入を決定します。安いからといって物持ちの悪いものを複数個買うよりも、多少高くても長期間使える質の良いものを選ぶ賢さを持っています。
              </p>
              <p style={{ marginBottom: '24px' }}>
                リセールバリューの視点も持ち、将来的な価値まで考慮した投資的な買い物を心がけています。
              </p>
            </div>

            {/* 特徴6 */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '16px'
              }}>
                6. 整理整頓された生活環境
              </h3>
              <p style={{ marginBottom: '16px' }}>
                一見関係なさそうに見えますが、整理整頓能力も無駄遣い防止に大きく関わっています。整理された環境では必要なものが見つけやすく、すでに持っているものを重複して購入してしまうミスを防げます。
              </p>
              <p style={{ marginBottom: '24px' }}>
                食材の買い出し前に冷蔵庫の中身を確認したり、衣類の在庫を把握してから買い物に行くなど、計画的な消費行動につながります。
              </p>
            </div>

            {/* 特徴7 */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '16px'
              }}>
                7. 明確な目標設定と将来設計
              </h3>
              <p style={{ marginBottom: '16px' }}>
                無駄遣いしない人は、具体的な貯蓄目標を持っています。「子どもの大学進学費用」「マイホームの頭金」「老後の年金補填」など、明確な目標があることで節約や家計管理へのモチベーションを維持できています。
              </p>
              <p style={{ marginBottom: '24px' }}>
                目標に必要な貯金額や期間を逆算して設定し、計画的に資産を築いている点が特徴的です。
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '30px',
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '16px'
            }}>
              無駄遣いをやめるための実践方法
            </h2>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                家計簿の活用
              </h3>
              <p style={{ marginBottom: '16px' }}>
                支出を「見える化」することで、無駄な出費を発見し、改善することができます。紙でもアプリでも、自分に合った方法で継続することが重要です。
              </p>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                ポイント活用と節約術
              </h3>
              <p style={{ marginBottom: '16px' }}>
                クレジットカードのポイント還元率の高いカードを選んだり、会員カードを活用したりすることで、実質的な節約効果を得ることができます。
              </p>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                無理のない範囲での実践
              </h3>
              <p style={{ marginBottom: '16px' }}>
                最も重要なのは、無理をしすぎないことです。貯金や節約は基本的に長期間続くものなので、ストレスになりすぎない範囲で継続できるよう計画を調整することが大切です。
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '30px',
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '16px'
            }}>
              まとめ
            </h2>
            <p style={{ marginBottom: '24px' }}>
              無駄遣いしない人の特徴を理解することで、私たち自身も賢いお金の使い方を身につけることができます。重要なのは、計画性を持ち、明確な目標を設定し、自分なりの節約スタイルを見つけることです。
            </p>
            <p style={{ marginBottom: '40px' }}>
              一度にすべてを実践しようとせず、できることから少しずつ始めて、着実に改善していくことで、将来的な安定した資産形成につなげていきましょう。
            </p>

            {/* 末尾の診断ボタン */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '32px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 12px 30px rgba(16, 185, 129, 0.2)'
            }}>
              <h3 style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '16px'
              }}>
                あなたの無駄遣い診断を始めませんか？
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                marginBottom: '24px',
                lineHeight: '1.6'
              }}>
                記事を読んでいただき、ありがとうございました。<br />
                今度は実際にあなたの無駄遣いパターンを診断して、<br />
                具体的な改善ポイントを見つけてみましょう。
              </p>
              <button
                onClick={handleScrollToDiagnosis}
                style={{
                  padding: '18px 36px',
                  backgroundColor: 'white',
                  color: '#059669',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.1)';
                }}
              >
                無料で診断を開始する
              </button>
            </div>
          </section>

          {/* 参考資料 */}
          <section style={{
            backgroundColor: '#f8fafc',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '16px'
            }}>
              参考資料
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{
                marginBottom: '8px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                • 無駄遣いしない人の特徴は？上手に貯蓄できるようになる方法を伝授
              </li>
              <li style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                • 倹約家の特徴や見極め方。節約家やケチな人との違いも解説！
              </li>
            </ul>
          </section>
        </article>
      </main>
      <Footer />
      <FixedCTA onStartDiagnosis={onStartDiagnosis} />
    </>
  );
};

export default ArticlePage;