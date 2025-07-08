import { z } from 'zod';
import { createMcpHandler } from '@vercel/mcp-adapter';

// 財務診断データの型定義
const FinancialDataSchema = z.object({
  age: z.number().min(18).max(100),
  income: z.number().min(0),
  expenses: z.number().min(0),
  savings: z.number().min(0),
  debt: z.number().min(0),
  investmentGoal: z.string(),
  riskTolerance: z.enum(['low', 'medium', 'high'])
});

const InvestmentCalculationSchema = z.object({
  principal: z.number().min(0),
  monthlyContribution: z.number().min(0),
  annualReturn: z.number().min(0).max(1),
  years: z.number().min(1).max(50)
});

const RiskAssessmentSchema = z.object({
  portfolio: z.array(z.object({
    asset: z.string(),
    allocation: z.number().min(0).max(100)
  })),
  timeHorizon: z.number().min(1).max(50),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive'])
});

const handler = createMcpHandler(
  (server) => {
    // 財務診断ツール
    server.tool(
      'financial_health_diagnosis',
      'ユーザーの財務状況を診断し、改善提案を行います',
      FinancialDataSchema.shape,
      async (params) => {
        const { age, income, expenses, savings, debt, investmentGoal, riskTolerance } = params;
        
        // 基本的な財務指標の計算
        const savingsRate = ((income - expenses) / income) * 100;
        const debtToIncomeRatio = (debt / income) * 100;
        const emergencyFundMonths = savings / expenses;
        
        // 財務健康度スコアの計算（100点満点）
        let healthScore = 0;
        
        // 貯蓄率評価（30点）
        if (savingsRate >= 20) healthScore += 30;
        else if (savingsRate >= 10) healthScore += 20;
        else if (savingsRate >= 5) healthScore += 10;
        
        // 負債比率評価（25点）
        if (debtToIncomeRatio <= 20) healthScore += 25;
        else if (debtToIncomeRatio <= 30) healthScore += 15;
        else if (debtToIncomeRatio <= 40) healthScore += 5;
        
        // 緊急資金評価（25点）
        if (emergencyFundMonths >= 6) healthScore += 25;
        else if (emergencyFundMonths >= 3) healthScore += 15;
        else if (emergencyFundMonths >= 1) healthScore += 5;
        
        // 年齢別評価（20点）
        if (age < 30 && savings > income * 0.5) healthScore += 20;
        else if (age >= 30 && age < 50 && savings > income * 2) healthScore += 20;
        else if (age >= 50 && savings > income * 5) healthScore += 20;
        else healthScore += 10;
        
        // 改善提案の生成
        const recommendations = [];
        
        if (savingsRate < 10) {
          recommendations.push("💡 月収の10%以上の貯蓄を目標にしましょう");
        }
        
        if (debtToIncomeRatio > 30) {
          recommendations.push("⚠️ 負債比率が高いです。借金の返済計画を見直しましょう");
        }
        
        if (emergencyFundMonths < 3) {
          recommendations.push("🚨 緊急資金が不足しています。3-6ヶ月分の生活費を貯蓄しましょう");
        }
        
        // リスク許容度に基づく投資提案
        let investmentAdvice = "";
        switch (riskTolerance) {
          case 'low':
            investmentAdvice = "安定志向の方には、債券や定期預金を中心とした保守的なポートフォリオをお勧めします";
            break;
          case 'medium':
            investmentAdvice = "バランス型の方には、株式50%・債券50%の分散投資をお勧めします";
            break;
          case 'high':
            investmentAdvice = "積極的な方には、成長株や新興市場への投資を含むポートフォリオをお勧めします";
            break;
        }
        
        const diagnosis = `
# 📊 財務健康診断レポート

## 総合スコア: ${healthScore}/100点

### 🔍 財務指標分析
- **貯蓄率**: ${savingsRate.toFixed(1)}%
- **負債比率**: ${debtToIncomeRatio.toFixed(1)}%
- **緊急資金**: ${emergencyFundMonths.toFixed(1)}ヶ月分

### 💡 改善提案
${recommendations.map(rec => `- ${rec}`).join('\n')}

### 🎯 投資アドバイス
${investmentAdvice}

### 📈 目標設定
投資目標「${investmentGoal}」の実現に向けて、月々の積立投資を検討することをお勧めします。
        `;
        
        return {
          content: [{ type: 'text', text: diagnosis }],
        };
      },
    );

    // 投資計算ツール
    server.tool(
      'investment_calculator',
      '複利効果を考慮した投資シミュレーションを行います',
      InvestmentCalculationSchema.shape,
      async (params) => {
        const { principal, monthlyContribution, annualReturn, years } = params;
        
        // 複利計算
        const monthlyReturn = annualReturn / 12;
        const totalMonths = years * 12;
        
        // 元本の複利計算
        const principalGrowth = principal * Math.pow(1 + annualReturn, years);
        
        // 毎月積立の複利計算
        const monthlyGrowth = monthlyContribution * 
          ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
        
        const finalAmount = principalGrowth + monthlyGrowth;
        const totalContributions = principal + (monthlyContribution * totalMonths);
        const totalGains = finalAmount - totalContributions;
        const gainPercentage = (totalGains / totalContributions) * 100;
        
        // 年別の推移データ
        const yearlyData = [];
        for (let year = 1; year <= years; year++) {
          const months = year * 12;
          const yearPrincipalGrowth = principal * Math.pow(1 + annualReturn, year);
          const yearMonthlyGrowth = monthlyContribution * 
            ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
          const yearTotal = yearPrincipalGrowth + yearMonthlyGrowth;
          
          yearlyData.push({
            year,
            amount: Math.round(yearTotal),
            contributions: principal + (monthlyContribution * months),
            gains: Math.round(yearTotal - (principal + (monthlyContribution * months)))
          });
        }
        
        const calculation = `
# 💰 投資シミュレーション結果

## 📊 最終結果（${years}年後）
- **最終金額**: ¥${finalAmount.toLocaleString('ja-JP')}
- **総投資額**: ¥${totalContributions.toLocaleString('ja-JP')}
- **運用益**: ¥${totalGains.toLocaleString('ja-JP')}
- **利益率**: ${gainPercentage.toFixed(1)}%

## 📅 年別推移
${yearlyData.map(data => 
  `**${data.year}年目**: ¥${data.amount.toLocaleString('ja-JP')} (投資額: ¥${data.contributions.toLocaleString('ja-JP')}, 運用益: ¥${data.gains.toLocaleString('ja-JP')})`
).join('\n')}

## 💡 投資のポイント
- 元本: ¥${principal.toLocaleString('ja-JP')}
- 月次積立: ¥${monthlyContribution.toLocaleString('ja-JP')}
- 想定年利: ${(annualReturn * 100).toFixed(1)}%
- 投資期間: ${years}年間

**複利の力で資産が${(finalAmount / totalContributions).toFixed(2)}倍に成長する計算です！**
        `;
        
        return {
          content: [{ type: 'text', text: calculation }],
        };
      },
    );

    // リスク評価ツール
    server.tool(
      'portfolio_risk_assessment',
      'ポートフォリオのリスク分析と最適化提案を行います',
      RiskAssessmentSchema.shape,
      async (params) => {
        const { portfolio, timeHorizon, riskTolerance } = params;
        
        // 資産クラス別のリスク・リターン設定
        const assetMetrics: Record<string, { expectedReturn: number; volatility: number }> = {
          'domestic_stocks': { expectedReturn: 0.08, volatility: 0.20 },
          'foreign_stocks': { expectedReturn: 0.09, volatility: 0.25 },
          'bonds': { expectedReturn: 0.03, volatility: 0.05 },
          'reits': { expectedReturn: 0.06, volatility: 0.15 },
          'commodities': { expectedReturn: 0.05, volatility: 0.30 },
          'cash': { expectedReturn: 0.001, volatility: 0.001 }
        };
        
        // ポートフォリオの期待リターンとリスクの計算
        let expectedReturn = 0;
        let portfolioVariance = 0;
        
        for (const holding of portfolio) {
          const metrics = assetMetrics[holding.asset] || { expectedReturn: 0.05, volatility: 0.15 };
          const weight = holding.allocation / 100;
          
          expectedReturn += weight * metrics.expectedReturn;
          portfolioVariance += Math.pow(weight * metrics.volatility, 2);
        }
        
        const portfolioVolatility = Math.sqrt(portfolioVariance);
        const sharpeRatio = expectedReturn / portfolioVolatility;
        
        // リスク許容度との適合性評価
        let riskAssessment = "";
        const recommendations = [];
        
        if (riskTolerance === 'conservative') {
          if (portfolioVolatility > 0.10) {
            riskAssessment = "⚠️ 現在のポートフォリオは保守的な投資家には少しリスクが高めです";
            recommendations.push("債券の比率を増やすことを検討してください");
            recommendations.push("株式の比率を30%以下に抑えることをお勧めします");
          } else {
            riskAssessment = "✅ リスク許容度に適したポートフォリオです";
          }
        } else if (riskTolerance === 'moderate') {
          if (portfolioVolatility < 0.08 || portfolioVolatility > 0.18) {
            riskAssessment = "⚠️ バランス型投資家には調整の余地があります";
            recommendations.push("株式と債券のバランスを50:50程度に調整してください");
          } else {
            riskAssessment = "✅ バランスの取れたポートフォリオです";
          }
        } else {
          if (portfolioVolatility < 0.15) {
            riskAssessment = "💡 より積極的な投資も可能です";
            recommendations.push("成長株や新興市場への投資を検討してください");
            recommendations.push("株式比率を70%以上に増やすことも選択肢です");
          } else {
            riskAssessment = "✅ 積極的な投資戦略に適しています";
          }
        }
        
        // 時間軸に基づく提案
        if (timeHorizon < 5) {
          recommendations.push("短期投資のため、安定性を重視した資産配分をお勧めします");
        } else if (timeHorizon > 15) {
          recommendations.push("長期投資のため、成長性を重視した資産配分が可能です");
        }
        
        const analysis = `
# 🎯 ポートフォリオリスク分析

## 📈 リスク・リターン指標
- **期待年間リターン**: ${(expectedReturn * 100).toFixed(2)}%
- **年間ボラティリティ**: ${(portfolioVolatility * 100).toFixed(2)}%
- **シャープレシオ**: ${sharpeRatio.toFixed(2)}

## 📊 現在の資産配分
${portfolio.map((holding: any) => 
  `- **${holding.asset}**: ${holding.allocation}%`
).join('\n')}

## 🎯 リスク適合性評価
${riskAssessment}

## 💡 最適化提案
${recommendations.length > 0 ? 
  recommendations.map(rec => `- ${rec}`).join('\n') : 
  '- 現在のポートフォリオは適切です'
}

## ⏰ 投資期間考慮事項
- **投資期間**: ${timeHorizon}年
- **リスク許容度**: ${riskTolerance}

${timeHorizon >= 10 ? 
  '長期投資のメリットを活かし、複利効果を最大化しましょう。' : 
  '短中期投資のため、リスクを抑えた運用を心がけましょう。'
}
        `;
        
        return {
          content: [{ type: 'text', text: analysis }],
        };
      },
    );

    // 緊急資金計算ツール
    server.tool(
      'emergency_fund_calculator',
      '適切な緊急資金の額と貯蓄計画を提案します',
      {
        monthlyExpenses: z.number().min(0),
        currentSavings: z.number().min(0),
        jobStability: z.enum(['stable', 'moderate', 'unstable']),
        dependents: z.number().min(0)
      },
      async (params) => {
        const { monthlyExpenses, currentSavings, jobStability, dependents } = params;
        
        // 緊急資金の目標額計算
        let targetMonths = 3; // 基本
        
        if (jobStability === 'unstable') targetMonths += 3;
        if (jobStability === 'moderate') targetMonths += 1;
        if (dependents > 0) targetMonths += Math.min(dependents, 3);
        
        const targetAmount = monthlyExpenses * targetMonths;
        const shortfall = Math.max(0, targetAmount - currentSavings);
        const currentMonths = currentSavings / monthlyExpenses;
        
        // 貯蓄計画の提案
        const savingPlans = [
          { months: 6, monthlyAmount: shortfall / 6 },
          { months: 12, monthlyAmount: shortfall / 12 },
          { months: 24, monthlyAmount: shortfall / 24 }
        ];
        
        const plan = `
# 🚨 緊急資金計算結果

## 📊 現状分析
- **現在の緊急資金**: ¥${currentSavings.toLocaleString('ja-JP')}
- **現在の資金で対応可能期間**: ${currentMonths.toFixed(1)}ヶ月
- **月間生活費**: ¥${monthlyExpenses.toLocaleString('ja-JP')}

## 🎯 目標設定
- **推奨緊急資金**: ${targetMonths}ヶ月分
- **目標金額**: ¥${targetAmount.toLocaleString('ja-JP')}
- **不足額**: ¥${shortfall.toLocaleString('ja-JP')}

## 📅 貯蓄計画オプション
${shortfall > 0 ? savingPlans.map(plan => 
  `- **${plan.months}ヶ月計画**: 月々¥${Math.round(plan.monthlyAmount).toLocaleString('ja-JP')}の貯蓄`
).join('\n') : '✅ 目標額を達成済みです！'}

## 💡 緊急資金のポイント
- **雇用安定性**: ${jobStability === 'stable' ? '安定' : jobStability === 'moderate' ? '普通' : '不安定'}
- **扶養家族**: ${dependents}人
- **リスク要因を考慮した${targetMonths}ヶ月分の設定です**

## 🏦 緊急資金の管理方法
- 普通預金や定期預金など、すぐに引き出せる形で保管
- 投資に回さず、安全性を最優先
- 使用した場合は速やかに補充する
        `;
        
        return {
          content: [{ type: 'text', text: plan }],
        };
      },
    );
  },
  {},
  { basePath: '/src/app/api' },
);

export { handler as GET, handler as POST, handler as DELETE }; 