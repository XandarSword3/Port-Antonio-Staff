import { createClient } from '@supabase/supabase-js';

// Analytics types
export interface AnalyticsMetrics {
  uniqueVisitors: number;
  totalPageViews: number;
  dailyPageViews: DailyMetric[];
  conversionFunnel: ConversionFunnel;
  topPages: PageMetric[];
  topSelectors: SelectorMetric[];
}

export interface DailyMetric {
  date: string;
  value: number;
}

export interface ConversionFunnel {
  pageViews: number;
  reservationStarts: number;
  reservationSubmits: number;
  conversionRate: number;
}

export interface PageMetric {
  page: string;
  views: number;
  avgTimeOnPage: number;
}

export interface SelectorMetric {
  selector: string;
  clicks: number;
  page: string;
}

/**
 * Fetch unique visitors for the last N days
 */
async function getUniqueVisitors(days: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase
      .from('visitors')
      .select('id')
      .gte('first_visit', cutoffDate.toISOString());
    
    if (error) {
      console.warn('Visitors table query failed:', error);
      // Return fallback data
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.warn('Analytics query failed:', error);
    return 0;
  }
}

/**
 * Fetch daily page views for the last N days
 */
async function getDailyPageViews(days: number = 30): Promise<DailyMetric[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase
      .from('analytics_events')
      .select('timestamp')
      .gte('timestamp', cutoffDate.toISOString())
      .eq('event_type', 'page_view')
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.warn('Analytics events query failed:', error);
      // Return empty data
      return Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 0
      }));
    }
    
    // Group by date
    const dailyCounts: { [key: string]: number } = {};
    data?.forEach(row => {
      const date = new Date(row.timestamp).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    // Fill in missing dates with 0
    const result: DailyMetric[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      result.push({
        date,
        value: dailyCounts[date] || 0
      });
    }
    
    return result;
  } catch (error) {
    console.warn('Analytics query failed:', error);
    // Return empty data
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 0
    }));
  }
}

/**
 * Fetch conversion funnel metrics
 */
async function getConversionFunnel(days: number = 30): Promise<ConversionFunnel> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get page views
    const { data: pageViews } = await supabase
      .from('analytics_events')
      .select('id')
      .gte('timestamp', cutoffDate.toISOString())
      .eq('event_type', 'page_view');
    
    // Get reservation starts (visiting reservation page)
    const { data: reservationStarts } = await supabase
      .from('analytics_events')
      .select('id')
      .gte('timestamp', cutoffDate.toISOString())
      .eq('event_type', 'page_view')
      .ilike('page_url', '%reservation%');
    
    // Get actual reservations created
    const { data: reservationSubmits } = await supabase
      .from('reservations')
      .select('id')
      .gte('created_at', cutoffDate.toISOString());
    
    const pageViewCount = pageViews?.length || 0;
    const reservationStartCount = reservationStarts?.length || 0;
    const reservationSubmitCount = reservationSubmits?.length || 0;
    
    const conversionRate = pageViewCount > 0 ? (reservationSubmitCount / pageViewCount) * 100 : 0;
    
    return {
      pageViews: pageViewCount,
      reservationStarts: reservationStartCount,
      reservationSubmits: reservationSubmitCount,
      conversionRate: Number(conversionRate.toFixed(2))
    };
  } catch (error) {
    console.warn('Conversion funnel query failed:', error);
    // Return empty funnel data
    return {
      pageViews: 0,
      reservationStarts: 0,
      reservationSubmits: 0,
      conversionRate: 0
    };
  }
}

/**
 * Fetch top pages by views and time on page
 */
async function getTopPages(days: number = 30): Promise<PageMetric[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data, error } = await supabase
      .from('analytics_events')
      .select('page_url, metadata')
      .gte('timestamp', cutoffDate.toISOString())
      .eq('event_type', 'page_view')
      .not('page_url', 'is', null);
    
    if (error) {
      console.warn('Top pages query failed:', error);
      // Return empty data
      return [];
    }
    
    // Group by page and calculate metrics
    const pageMetrics: { [key: string]: { views: number; totalTime: number } } = {};
    
    data?.forEach(row => {
      const page = row.page_url || '/';
      const timeOnPage = row.metadata?.time_on_page || 0;
      
      if (!pageMetrics[page]) {
        pageMetrics[page] = { views: 0, totalTime: 0 };
      }
      pageMetrics[page].views++;
      pageMetrics[page].totalTime += timeOnPage;
    });
    
    // Convert to array and calculate averages
    const result: PageMetric[] = Object.entries(pageMetrics)
      .map(([page, metrics]) => ({
        page,
        views: metrics.views,
        avgTimeOnPage: metrics.views > 0 ? Math.round(metrics.totalTime / metrics.views) : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
    
    return result;
  } catch (error) {
    console.warn('Analytics query failed:', error);
    // Return empty data
    return [];
  }
}

/**
 * Fetch top clicked selectors
 */
async function getTopSelectors(days: number = 30): Promise<SelectorMetric[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data, error } = await supabase
      .from('analytics_events')
      .select('metadata, page_url')
      .gte('timestamp', cutoffDate.toISOString())
      .eq('event_type', 'click')
      .not('metadata', 'is', null);
    
    if (error) {
      console.warn('Top selectors query failed:', error);
      // Return empty data
      return [];
    }
    
    // Group by selector and count clicks
    const selectorCounts: { [key: string]: { clicks: number; page: string } } = {};
    
    data?.forEach(row => {
      const selector = row.metadata?.selector || row.metadata?.element;
      const page = row.page_url || '/';
      
      if (selector) {
        const key = `${selector}-${page}`;
        if (!selectorCounts[key]) {
          selectorCounts[key] = { clicks: 0, page };
        }
        selectorCounts[key].clicks++;
      }
    });
    
    // Convert to array and sort
    const result: SelectorMetric[] = Object.entries(selectorCounts)
      .map(([key, data]) => ({
        selector: key.split('-')[0],
        clicks: data.clicks,
        page: data.page
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
    
    return result;
  } catch (error) {
    console.warn('Analytics query failed:', error);
    // Return empty data
    return [];
  }
}

/**
 * Main function to fetch all analytics metrics
 */
export async function getAnalyticsMetrics(supabase: any, days: number = 30): Promise<AnalyticsMetrics> {
  try {
    const [
      uniqueVisitors,
      dailyPageViews,
      conversionFunnel,
      topPages,
      topSelectors
    ] = await Promise.all([
      getUniqueVisitors(days),
      getDailyPageViews(days),
      getConversionFunnel(days),
      getTopPages(days),
      getTopSelectors(days)
    ]);

    const totalPageViews = dailyPageViews.reduce((sum, day) => sum + day.value, 0);

    return {
      uniqueVisitors,
      totalPageViews,
      dailyPageViews,
      conversionFunnel,
      topPages,
      topSelectors
    };
  } catch (error) {
    console.error('Failed to fetch analytics metrics:', error);
    throw error;
  }
}

/**
 * Generate simple SVG sparkline chart
 */
export function generateSparkline(data: number[], width: number = 100, height: number = 20): string {
  if (data.length === 0) return '';
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <polyline
        fill="none"
        stroke="#3b82f6"
        stroke-width="1.5"
        points="${points}"
      />
    </svg>
  `;
}
