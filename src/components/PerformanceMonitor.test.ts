import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { measurePageLoad, reportWebVitals, trackResourceUsage } from './PerformanceMonitor';

describe('PerformanceMonitor', () => {
  let mockPerformanceObserver: any;

  beforeEach(() => {
    // Mock Performance API
    vi.stubGlobal('performance', {
      now: vi.fn(() => 1000),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => [
        {
          name: 'https://example.com/script.js',
          entryType: 'resource',
          startTime: 100,
          duration: 200,
          transferSize: 50000,
          encodedBodySize: 45000,
          decodedBodySize: 150000,
        },
      ]),
      getEntriesByName: vi.fn(() => [
        {
          name: 'test-measure',
          entryType: 'measure',
          startTime: 100,
          duration: 500,
        },
      ]),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    });

    // Mock PerformanceObserver
    mockPerformanceObserver = vi.fn((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
    }));
    vi.stubGlobal('PerformanceObserver', mockPerformanceObserver);

    // Mock navigator.connection
    vi.stubGlobal('navigator', {
      connection: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      },
      hardwareConcurrency: 8,
      deviceMemory: 8,
      userAgent: 'Mozilla/5.0 Test Browser',
    });

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('measurePageLoad', () => {
    it('measures page load time', async () => {
      const pageName = 'HomePage';
      const threshold = 2000;

      measurePageLoad(pageName, threshold);

      // マークが作成される
      expect(performance.mark).toHaveBeenCalledWith(`${pageName}-start`);

      // 非同期で測定が実行される
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(performance.mark).toHaveBeenCalledWith(`${pageName}-end`);
      expect(performance.measure).toHaveBeenCalledWith(
        `${pageName}-load`,
        `${pageName}-start`,
        `${pageName}-end`
      );
    });

    it('warns when page load exceeds threshold', async () => {
      vi.mocked(performance.getEntriesByName).mockReturnValue([
        {
          name: 'TestPage-load',
          entryType: 'measure',
          startTime: 0,
          duration: 3000, // 閾値を超える
        } as PerformanceMeasure,
      ]);

      measurePageLoad('TestPage', 2000);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('TestPage のロード時間が閾値を超えています')
      );
    });
  });

  describe('reportWebVitals', () => {
    it('reports Core Web Vitals', () => {
      // PerformanceObserverのコールバックを取得
      reportWebVitals();

      expect(mockPerformanceObserver).toHaveBeenCalled();
      const observerInstance = mockPerformanceObserver.mock.results[0].value;
      expect(observerInstance.observe).toHaveBeenCalledWith({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'],
      });
    });

    it('processes LCP entries correctly', () => {
      reportWebVitals();

      // コールバック関数を取得
      const callback = mockPerformanceObserver.mock.calls[0][0];

      // LCPエントリーをシミュレート
      const mockEntries = [
        {
          name: '',
          entryType: 'largest-contentful-paint',
          startTime: 2500,
          duration: 0,
          renderTime: 2500,
          loadTime: 2400,
          size: 50000,
          id: 'lcp-1',
          url: 'https://example.com/image.jpg',
        },
      ];

      callback({ getEntries: () => mockEntries });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('LCP: 2500ms')
      );
    });

    it('processes FID entries correctly', () => {
      reportWebVitals();

      const callback = mockPerformanceObserver.mock.calls[0][0];

      // FIDエントリーをシミュレート
      const mockEntries = [
        {
          name: 'first-input',
          entryType: 'first-input',
          startTime: 1000,
          duration: 50,
          processingStart: 1010,
          processingEnd: 1050,
        },
      ];

      callback({ getEntries: () => mockEntries });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('FID: 10ms')
      );
    });

    it('calculates CLS correctly', () => {
      reportWebVitals();

      const callback = mockPerformanceObserver.mock.calls[0][0];

      // CLSエントリーをシミュレート
      const mockEntries = [
        {
          name: '',
          entryType: 'layout-shift',
          startTime: 1000,
          duration: 0,
          value: 0.05,
          hadRecentInput: false,
        },
        {
          name: '',
          entryType: 'layout-shift',
          startTime: 2000,
          duration: 0,
          value: 0.1,
          hadRecentInput: false,
        },
      ];

      callback({ getEntries: () => mockEntries });

      // CLSは累積値
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('CLS:')
      );
    });
  });

  describe('trackResourceUsage', () => {
    it('tracks resource usage and performance', () => {
      const metrics = trackResourceUsage();

      expect(metrics).toEqual({
        resources: expect.arrayContaining([
          expect.objectContaining({
            name: 'https://example.com/script.js',
            type: 'resource',
            duration: 200,
            size: 50000,
            transferSize: 50000,
          }),
        ]),
        memory: {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0,
        },
        connection: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false,
        },
        deviceInfo: {
          hardwareConcurrency: 8,
          deviceMemory: 8,
        },
      });
    });

    it('warns about large resources', () => {
      vi.mocked(performance.getEntriesByType).mockReturnValue([
        {
          name: 'https://example.com/large-script.js',
          entryType: 'resource',
          startTime: 100,
          duration: 500,
          transferSize: 600000, // 500KB以上
          encodedBodySize: 600000,
          decodedBodySize: 2000000,
        } as any,
      ]);

      trackResourceUsage();

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('大きなリソース')
      );
    });

    it('handles missing performance.memory gracefully', () => {
      // performance.memoryを削除
      const originalPerformance = global.performance;
      global.performance = {
        ...originalPerformance,
        memory: undefined,
      } as any;

      const metrics = trackResourceUsage();

      expect(metrics.memory).toEqual({
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
      });

      global.performance = originalPerformance;
    });

    it('handles missing navigator.connection gracefully', () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        connection: undefined,
      });

      const metrics = trackResourceUsage();

      expect(metrics.connection).toBeUndefined();
    });
  });

  describe('Performance Budget Monitoring', () => {
    it('checks performance budget', () => {
      const budget = {
        js: 300 * 1024, // 300KB
        css: 100 * 1024, // 100KB
        images: 500 * 1024, // 500KB
        total: 1000 * 1024, // 1MB
      };

      vi.mocked(performance.getEntriesByType).mockReturnValue([
        {
          name: 'https://example.com/app.js',
          entryType: 'resource',
          initiatorType: 'script',
          transferSize: 350 * 1024, // Over budget
        } as any,
        {
          name: 'https://example.com/styles.css',
          entryType: 'resource',
          initiatorType: 'link',
          transferSize: 80 * 1024, // Within budget
        } as any,
        {
          name: 'https://example.com/image.jpg',
          entryType: 'resource',
          initiatorType: 'img',
          transferSize: 200 * 1024, // Within budget
        } as any,
      ]);

      const metrics = trackResourceUsage();
      
      const jsSize = metrics.resources
        .filter(r => r.name.endsWith('.js'))
        .reduce((sum, r) => sum + (r.transferSize || 0), 0);
      
      expect(jsSize).toBeGreaterThan(budget.js);
    });
  });

  describe('Network Information', () => {
    it('detects slow connections', () => {
      vi.stubGlobal('navigator', {
        connection: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 300,
          saveData: true,
        },
      });

      const metrics = trackResourceUsage();

      expect(metrics.connection).toEqual({
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 300,
        saveData: true,
      });

      // 低速接続の警告
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('低速な接続')
      );
    });
  });
});