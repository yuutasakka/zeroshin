export interface ReasonToChoose {
  iconClass: string;
  title: string;
  value: string;
  description: string;
  animationDelay: string;
}

export interface ReasonsToChooseData {
  title: string;
  subtitle: string;
  reasons: ReasonToChoose[];
}

export interface FirstConsultationOffer {
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  borderColor: string;
}

export const defaultReasonsToChooseData: ReasonsToChooseData = {
  title: "選ばれる理由があります",
  subtitle: "多くのお客様から信頼をいただいている、確かな実績をご紹介します",
  reasons: [
    {
      iconClass: "fas fa-thumbs-up",
      title: "お客様満足度",
      value: "98.8%",
      description: "継続的なサポートによる高い満足度を実現",
      animationDelay: "0s"
    },
    {
      iconClass: "fas fa-users",
      title: "提携FP数",
      value: "1,500+",
      description: "全国の優秀な専門家ネットワーク",
      animationDelay: "0.5s"
    },
    {
      iconClass: "fas fa-trophy",
      title: "相談実績",
      value: "2,500+",
      description: "豊富な経験に基づく最適なご提案",
      animationDelay: "1s"
    }
  ]
};

export const defaultFirstConsultationOffer: FirstConsultationOffer = {
  title: "初回相談限定特典",
  description: "投資戦略ガイドブック（通常価格2,980円）を無料プレゼント中",
  icon: "fas fa-gift",
  backgroundColor: "rgba(212, 175, 55, 0.1)",
  borderColor: "var(--accent-gold)"
}; 