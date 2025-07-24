import React, { useEffect, useState } from 'react';
import DownloadGuideModal from './DownloadGuideModal';

interface CombatPowerResultsProps {
  diagnosisAnswers: Record<number, string>;
  onDownloadGuide: () => void;
}

interface SubScores {
  attackPower: number; // 調達ポテンシャル
  defensePower: number; // 返済余力
  mobility: number; // 資金入手スピード
}

const CombatPowerResults: React.FC<CombatPowerResultsProps> = ({ diagnosisAnswers, onDownloadGuide }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  // スコア計算ロジック
  const calculateScores = (): { total: number; rank: string; subScores: SubScores; comment: string } => {
    let attackPower = 0;
    let defensePower = 0;
    let mobility = 0;
    
    // 年収による攻撃力計算
    switch (diagnosisAnswers[1]) {
      case '～300万円': attackPower += 15; break;
      case '300～500万円': attackPower += 25; break;
      case '500～800万円': attackPower += 35; break;
      case '800万円～': attackPower += 40; break;
    }
    
    // 口座残高による防御力計算
    switch (diagnosisAnswers[2]) {
      case '～10万円': defensePower += 10; break;
      case '10～50万円': defensePower += 20; break;
      case '50～100万円': defensePower += 30; break;
      case '100万円～': defensePower += 40; break;
    }
    
    // 借入件数による減点
    switch (diagnosisAnswers[3]) {
      case '0件': defensePower += 20; attackPower += 10; break;
      case '1～2件': defensePower += 10; break;
      case '3件以上': defensePower -= 10; attackPower -= 5; break;
    }
    
    // 返済負担率による調整
    switch (diagnosisAnswers[4]) {
      case '収入に対して返済が10%未満': defensePower += 20; break;
      case '10～30%': defensePower += 10; break;
      case '30%以上': defensePower -= 10; break;
    }
    
    // 緊急度による機動力
    switch (diagnosisAnswers[5]) {
      case '今すぐ': mobility = 30; break;
      case '1週間以内': mobility = 20; break;
      case '1ヶ月以内': mobility = 10; break;
    }
    
    // スコアの正規化（各項目を0-100の範囲に）
    attackPower = Math.max(0, Math.min(100, attackPower * 2));
    defensePower = Math.max(0, Math.min(100, defensePower * 1.5));
    mobility = Math.max(0, Math.min(100, mobility * 3.33));
    
    const total = Math.round((attackPower + defensePower + mobility) / 3);
    
    // ランク判定
    let rank = 'C';
    if (total >= 80) rank = 'S';
    else if (total >= 60) rank = 'A';
    else if (total >= 40) rank = 'B';
    
    // パーソナライズドコメント
    let comment = '';
    if (rank === 'S') {
      comment = `あなたの戦闘力は${total}点（Sランク）！\n・攻撃力が高いので、まずは低金利の銀行系ローンを比較\n・防御力も十分なので、複数の選択肢から最適なものを選べます`;
    } else if (rank === 'A') {
      comment = `あなたの戦闘力は${total}点（Aランク）！\n・${attackPower > defensePower ? '攻撃力が高いので、積極的な資金調達が可能' : '防御力が高いので、安定した返済計画を立てられます'}\n・${mobility > 20 ? '急ぎの場合は即日融資も検討できます' : '時間に余裕があるので、じっくり比較検討しましょう'}`;
    } else if (rank === 'B') {
      comment = `あなたの戦闘力は${total}点（Bランク）！\n・${defensePower < 30 ? '防御力を底上げするには返済負担率の見直しを' : '攻撃力を上げるには収入証明の準備を'}\n・慎重に業者を選定することで、良い条件での借入が可能です`;
    } else {
      comment = `あなたの戦闘力は${total}点（Cランク）！\n・まずは現在の借入状況を整理することから始めましょう\n・おまとめローンや債務整理の相談も視野に入れることをお勧めします`;
    }
    
    return {
      total,
      rank,
      subScores: { attackPower, defensePower, mobility },
      comment
    };
  };
  
  const { total, rank, subScores, comment } = calculateScores();
  
  useEffect(() => {
    setIsAnimating(true);
    // スコアのカウントアップアニメーション
    const interval = setInterval(() => {
      setCurrentScore(prev => {
        if (prev >= total) {
          clearInterval(interval);
          return total;
        }
        return Math.min(prev + 2, total);
      });
    }, 30);
    
    return () => clearInterval(interval);
  }, [total]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'S': return '#FFD700'; // ゴールド
      case 'A': return '#FF6B35'; // オレンジ
      case 'B': return '#3B82F6'; // ブルー
      case 'C': return '#6B7280'; // グレー
      default: return '#6B7280';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2332 100%)',
      color: 'white',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景アニメーション */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        background: `radial-gradient(circle at 20% 30%, ${getRankColor(rank)} 0%, transparent 40%)`,
        animation: 'pulse 4s ease-in-out infinite'
      }} />
      
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* タイトル */}
        <h1 className="fade-in-1" style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: 800,
          marginBottom: '3rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          あなたの資金調達戦闘力
        </h1>
        
        {/* メインスコアカード */}
        <div className="scale-in" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '2rem',
          padding: '3rem',
          marginBottom: '2rem',
          border: `3px solid ${getRankColor(rank)}`,
          boxShadow: `0 0 30px ${getRankColor(rank)}40`,
          textAlign: 'center'
        }}>
          {/* 総合スコア */}
          <div className="score-display" style={{
            fontSize: '5rem',
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: '1rem',
            color: getRankColor(rank),
            textShadow: `0 0 20px ${getRankColor(rank)}80`
          }}>
            {currentScore}
            <span style={{ fontSize: '2rem' }}>点</span>
          </div>
          
          {/* ランク表示 */}
          <div className="rank-badge" style={{
            display: 'inline-block',
            padding: '0.5rem 2rem',
            background: getRankColor(rank),
            color: rank === 'S' ? '#000' : '#fff',
            borderRadius: '9999px',
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '2rem',
            boxShadow: `0 4px 20px ${getRankColor(rank)}60`
          }}>
            {rank}ランク
          </div>
          
          {/* サブスコア */}
          <div className="sub-scores" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                攻撃力
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {Math.round(subScores.attackPower)}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                調達ポテンシャル
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                防御力
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {Math.round(subScores.defensePower)}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                返済余力
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                機動力
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {Math.round(subScores.mobility)}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                資金入手スピード
              </div>
            </div>
          </div>
        </div>
        
        {/* パーソナライズドコメント */}
        <div className="fade-in-2" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>診断結果</h3>
          <p style={{
            whiteSpace: 'pre-line',
            lineHeight: 1.8,
            opacity: 0.9
          }}>
            {comment}
          </p>
        </div>
        
        {/* 調査前にここをチェック！ */}
        <div className="fade-in-3" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
            調査前にここをチェック！
          </h3>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.8, opacity: 0.9 }}>
            <li>必要書類を事前に準備（本人確認書類、収入証明書など）</li>
            <li>借入希望額と返済期間を明確にする</li>
            <li>複数の業者を比較して最適な条件を見つける</li>
            <li>返済シミュレーションで無理のない計画を立てる</li>
          </ul>
        </div>
        
        {/* CTA - 攻略本ダウンロード */}
        <div className="fade-in-4" style={{
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            className="cta-button"
            onClick={() => setShowDownloadModal(true)}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
              color: '#000',
              padding: '1.5rem 3rem',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '1.25rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(255, 215, 0, 0.3)',
              transform: 'scale(1)',
              transition: 'all 0.3s ease',
              animation: 'bounce 2s infinite'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 215, 0, 0.3)';
            }}
          >
            ＜攻略本ダウンロード＞
          </button>
          
          <div style={{
            marginTop: '1.5rem',
            fontSize: '1.125rem',
            opacity: 0.9
          }}>
            <strong>30秒診断後の"次の一手"を完全網羅！</strong><br />
            個人向け資金調達マニュアルPDF（無料）
          </div>
          
          <div style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            opacity: 0.7,
            lineHeight: 1.6
          }}>
            ✓ 各サブスコア改善の具体ステップ<br />
            ✓ キャッシング／個人向けファクタリング主要業者比較表<br />
            ✓ 調査時に見るべき「審査ポイント」チェックリスト
          </div>
        </div>
      </div>
      
      {/* ダウンロードモーダル */}
      <DownloadGuideModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        combatScore={total}
        rank={rank}
      />
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        /* モバイル対応スタイル */
        @media (max-width: 768px) {
          h1 {
            font-size: 2rem !important;
          }
          
          .score-display {
            font-size: 4rem !important;
          }
          
          .rank-badge {
            font-size: 1.5rem !important;
            padding: 0.5rem 1.5rem !important;
          }
          
          .sub-scores {
            gap: 1rem !important;
          }
          
          .sub-score-item {
            font-size: 0.75rem !important;
          }
          
          .sub-score-value {
            font-size: 1.25rem !important;
          }
          
          .cta-button {
            font-size: 1rem !important;
            padding: 1.25rem 2rem !important;
          }
        }
        
        /* タッチデバイス最適化 */
        @media (hover: none) {
          .cta-button:hover {
            transform: none !important;
          }
          
          .cta-button:active {
            transform: scale(0.98) !important;
          }
        }
        
        /* アニメーション順序 */
        .fade-in-1 {
          animation: slideUp 0.5s ease-out 0.1s both;
        }
        
        .fade-in-2 {
          animation: slideUp 0.5s ease-out 0.3s both;
        }
        
        .fade-in-3 {
          animation: slideUp 0.5s ease-out 0.5s both;
        }
        
        .fade-in-4 {
          animation: slideUp 0.5s ease-out 0.7s both;
        }
        
        .scale-in {
          animation: scaleIn 0.6s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
};

export default CombatPowerResults;