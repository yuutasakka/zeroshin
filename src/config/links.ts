// アフィリエイトリンクとPDFガイドリンクの設定
export interface AffiliateLink {
  name: string;
  url: string;
  description: string;
  category: 'exchange' | 'wallet' | 'education' | 'other';
}

export interface LinkConfig {
  pdfGuideUrl: string;
  affiliateLinks: AffiliateLink[];
}

// 設定データ（管理者が編集可能）
export const linkConfig: LinkConfig = {
  // 仮想通貨の始め方完全ガイド（PDF）のURL
  pdfGuideUrl: 'https://example.com/crypto-guide.pdf',
  
  // アフィリエイトリンク一覧
  affiliateLinks: [
    // 国内取引所
    {
      name: 'Coincheck',
      url: 'https://coincheck.com/registrations?c=XXXXXX',
      description: '初心者にやさしい国内最大級の取引所',
      category: 'exchange'
    },
    {
      name: 'SBI VCトレード',
      url: 'https://www.sbivc.co.jp/account/open?referrer=XXXXXX',
      description: 'SBIグループの安心できる取引所',
      category: 'exchange'
    },
    {
      name: 'bitbank',
      url: 'https://bitbank.cc/account/signup?referrer=XXXXXX',
      description: '取引量国内No.1の本格取引所',
      category: 'exchange'
    },
    {
      name: 'GMOコイン',
      url: 'https://coin.z.com/jp/account/open?referrer=XXXXXX',
      description: '手数料が安く使いやすい取引所',
      category: 'exchange'
    },
    {
      name: 'BITPOINT',
      url: 'https://www.bitpoint.co.jp/account/create?referrer=XXXXXX',
      description: '各種手数料無料の取引所',
      category: 'exchange'
    },
    {
      name: 'BitTrade',
      url: 'https://www.bittrade.co.jp/account/signup?referrer=XXXXXX',
      description: 'フォビグループの取引所',
      category: 'exchange'
    },
    // 海外取引所
    {
      name: 'Bybit',
      url: 'https://www.bybit.com/register?affiliate_id=XXXXXX',
      description: '世界最大級のデリバティブ取引所',
      category: 'exchange'
    },
    {
      name: 'MEXC',
      url: 'https://www.mexc.com/register?inviteCode=XXXXXX',
      description: '豊富なアルトコインを取り扱う取引所',
      category: 'exchange'
    },
    {
      name: 'Bitget',
      url: 'https://www.bitget.com/register?from=XXXXXX',
      description: 'コピートレード機能が人気の取引所',
      category: 'exchange'
    },
    {
      name: 'KuCoin',
      url: 'https://www.kucoin.com/register?rcode=XXXXXX',
      description: '多様な暗号資産を取り扱う取引所',
      category: 'exchange'
    },
    // ウォレット
    {
      name: 'MetaMask',
      url: 'https://metamask.io/download/?utm_source=XXXXXX',
      description: 'イーサリアム系ウォレット',
      category: 'wallet'
    },
    {
      name: 'Phantom Wallet',
      url: 'https://phantom.app/download?ref=XXXXXX',
      description: 'Solana系ウォレット',
      category: 'wallet'
    }
  ]
};

// アフィリエイトリンクを取得する関数
export const getAffiliateLink = (name: string): AffiliateLink | undefined => {
  return linkConfig.affiliateLinks.find(link => link.name === name);
};

// カテゴリ別でアフィリエイトリンクを取得する関数
export const getAffiliateLinksByCategory = (category: AffiliateLink['category']): AffiliateLink[] => {
  return linkConfig.affiliateLinks.filter(link => link.category === category);
};

// PDFガイドのURLを取得する関数
export const getPdfGuideUrl = (): string => {
  return linkConfig.pdfGuideUrl;
};

// リンク設定を更新する関数（将来的に管理画面から使用）
export const updateLinkConfig = (newConfig: Partial<LinkConfig>): void => {
  if (newConfig.pdfGuideUrl) {
    linkConfig.pdfGuideUrl = newConfig.pdfGuideUrl;
  }
  if (newConfig.affiliateLinks) {
    linkConfig.affiliateLinks = newConfig.affiliateLinks;
  }
};