import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import SEOHead from '../SEOHead';

// react-helmet-asyncのモック
const mockHelmet = jest.fn();
jest.mock('react-helmet-async', () => ({
  ...jest.requireActual('react-helmet-async'),
  Helmet: (props: any) => {
    mockHelmet(props);
    return null;
  }
}));

describe('SEOHead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithHelmet = (component: React.ReactElement) => {
    return render(
      <HelmetProvider>
        {component}
      </HelmetProvider>
    );
  };

  test('デフォルトのメタタグが正しく設定される', () => {
    renderWithHelmet(<SEOHead />);

    const helmetProps = mockHelmet.mock.calls[0][0];
    const metaTags = helmetProps.children.filter(
      (child: any) => child.type === 'meta'
    );
    const titleTag = helmetProps.children.find(
      (child: any) => child.type === 'title'
    );

    // タイトル
    expect(titleTag.props.children).toBe('AI ConnectX - お金診断アプリ');

    // description
    const descTag = metaTags.find(
      (tag: any) => tag.props.name === 'description'
    );
    expect(descTag.props.content).toContain('あなたに最適な金融商品を診断します');

    // keywords
    const keywordsTag = metaTags.find(
      (tag: any) => tag.props.name === 'keywords'
    );
    expect(keywordsTag.props.content).toContain('金融商品');
  });

  test('カスタムプロパティが正しく適用される', () => {
    const customProps = {
      title: 'カスタムタイトル',
      description: 'カスタム説明',
      keywords: 'カスタム,キーワード',
      image: '/custom-image.png',
      url: 'https://example.com/custom'
    };

    renderWithHelmet(<SEOHead {...customProps} />);

    const helmetProps = mockHelmet.mock.calls[0][0];
    const metaTags = helmetProps.children.filter(
      (child: any) => child.type === 'meta'
    );
    const titleTag = helmetProps.children.find(
      (child: any) => child.type === 'title'
    );

    expect(titleTag.props.children).toBe('カスタムタイトル');

    const descTag = metaTags.find(
      (tag: any) => tag.props.name === 'description'
    );
    expect(descTag.props.content).toBe('カスタム説明');
  });

  test('Open Graphタグが正しく設定される', () => {
    renderWithHelmet(<SEOHead />);

    const helmetProps = mockHelmet.mock.calls[0][0];
    const metaTags = helmetProps.children.filter(
      (child: any) => child.type === 'meta'
    );

    // og:title
    const ogTitle = metaTags.find(
      (tag: any) => tag.props.property === 'og:title'
    );
    expect(ogTitle).toBeDefined();
    expect(ogTitle.props.content).toBe('AI ConnectX - お金診断アプリ');

    // og:type
    const ogType = metaTags.find(
      (tag: any) => tag.props.property === 'og:type'
    );
    expect(ogType.props.content).toBe('website');

    // og:site_name
    const ogSiteName = metaTags.find(
      (tag: any) => tag.props.property === 'og:site_name'
    );
    expect(ogSiteName.props.content).toBe('AI ConnectX');
  });

  test('Twitter Cardタグが正しく設定される', () => {
    renderWithHelmet(<SEOHead />);

    const helmetProps = mockHelmet.mock.calls[0][0];
    const metaTags = helmetProps.children.filter(
      (child: any) => child.type === 'meta'
    );

    // twitter:card
    const twitterCard = metaTags.find(
      (tag: any) => tag.props.name === 'twitter:card'
    );
    expect(twitterCard.props.content).toBe('summary_large_image');

    // twitter:site
    const twitterSite = metaTags.find(
      (tag: any) => tag.props.name === 'twitter:site'
    );
    expect(twitterSite.props.content).toBe('@moneyticket');
  });

  test('構造化データが正しく設定される', () => {
    renderWithHelmet(<SEOHead />);

    const helmetProps = mockHelmet.mock.calls[0][0];
    const scriptTags = helmetProps.children.filter(
      (child: any) => child.type === 'script' && child.props.type === 'application/ld+json'
    );

    expect(scriptTags).toHaveLength(4);

    // Organization schema
    const orgSchema = JSON.parse(scriptTags[0].props.children);
    expect(orgSchema['@type']).toBe('Organization');
    expect(orgSchema.name).toBe('AI ConnectX');

    // WebApplication schema
    const webAppSchema = JSON.parse(scriptTags[1].props.children);
    expect(webAppSchema['@type']).toBe('WebApplication');
    expect(webAppSchema.applicationCategory).toBe('FinanceApplication');

    // FAQPage schema
    const faqSchema = JSON.parse(scriptTags[2].props.children);
    expect(faqSchema['@type']).toBe('FAQPage');
    expect(faqSchema.mainEntity).toHaveLength(3);

    // BreadcrumbList schema
    const breadcrumbSchema = JSON.parse(scriptTags[3].props.children);
    expect(breadcrumbSchema['@type']).toBe('BreadcrumbList');
    expect(breadcrumbSchema.itemListElement).toHaveLength(2);
  });

  test('記事タイプの場合に追加メタタグが設定される', () => {
    const articleProps = {
      type: 'article' as const,
      publishedTime: '2024-01-01T00:00:00Z',
      modifiedTime: '2024-01-02T00:00:00Z',
      author: 'Test Author'
    };

    renderWithHelmet(<SEOHead {...articleProps} />);

    const helmetProps = mockHelmet.mock.calls[0][0];
    const metaTags = helmetProps.children.filter(
      (child: any) => child.type === 'meta'
    );

    // article:published_time
    const publishedTime = metaTags.find(
      (tag: any) => tag.props.property === 'article:published_time'
    );
    expect(publishedTime.props.content).toBe('2024-01-01T00:00:00Z');

    // article:modified_time
    const modifiedTime = metaTags.find(
      (tag: any) => tag.props.property === 'article:modified_time'
    );
    expect(modifiedTime.props.content).toBe('2024-01-02T00:00:00Z');
  });

  test('パフォーマンス最適化のリンクタグが設定される', () => {
    renderWithHelmet(<SEOHead />);

    const helmetProps = mockHelmet.mock.calls[0][0];
    const linkTags = helmetProps.children.filter(
      (child: any) => child.type === 'link'
    );

    // preconnect
    const preconnectGoogle = linkTags.find(
      (tag: any) => tag.props.rel === 'preconnect' && 
                    tag.props.href === 'https://fonts.googleapis.com'
    );
    expect(preconnectGoogle).toBeDefined();

    // dns-prefetch
    const dnsPrefetchCDN = linkTags.find(
      (tag: any) => tag.props.rel === 'dns-prefetch' && 
                    tag.props.href === 'https://cdn.jsdelivr.net'
    );
    expect(dnsPrefetchCDN).toBeDefined();
  });

  test('ロボットメタタグが正しく設定される', () => {
    renderWithHelmet(<SEOHead />);

    const helmetProps = mockHelmet.mock.calls[0][0];
    const metaTags = helmetProps.children.filter(
      (child: any) => child.type === 'meta'
    );

    const robotsTag = metaTags.find(
      (tag: any) => tag.props.name === 'robots'
    );
    expect(robotsTag.props.content).toContain('index');
    expect(robotsTag.props.content).toContain('follow');
    expect(robotsTag.props.content).toContain('max-image-preview:large');
  });
});