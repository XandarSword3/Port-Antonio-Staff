'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Users, 
  Eye, 
  TrendingUp, 
  Clock, 
  MousePointer, 
  RefreshCw,
  Calendar,
  Activity
} from 'lucide-react';

interface AnalyticsMetrics {
  uniqueVisitors: number;
  totalPageViews: number;
  dailyPageViews: Array<{ date: string; value: number }>;
  conversionFunnel: {
    pageViews: number;
    reservationStarts: number;
    reservationSubmits: number;
    conversionRate: number;
  };
  topPages: Array<{
    page: string;
    views: number;
    avgTimeOnPage: number;
  }>;
  topSelectors: Array<{
    selector: string;
    clicks: number;
    page: string;
  }>;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshCooldown, setRefreshCooldown] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: 30 })
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshCooldown) return;
    
    setRefreshCooldown(true);
    await fetchAnalytics();
    
    // Rate limit refresh to once per 30 seconds
    setTimeout(() => setRefreshCooldown(false), 30000);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Check if user has access to analytics
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 60) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
    return seconds + 's';
  };

  const generateSparkline = (data: number[], color: string = '#3b82f6') => {
    if (data.length === 0) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 20 - ((value - min) / range) * 20;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="100" height="20" viewBox="0 0 100 20" className="inline-block ml-2">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Last 30 days • {lastRefresh && `Updated ${lastRefresh.toLocaleTimeString()}`}
            </p>
          </div>
          <div className="flex space-x-3">
            {user.role === 'owner' && (
              <button
                onClick={() => window.open('/api/reports/value?period=30', '_blank')}
                className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Value Report
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshCooldown || loading}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {metrics && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatNumber(metrics.uniqueVisitors)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                {generateSparkline(metrics.dailyPageViews.slice(-7).map(d => d.value), '#3b82f6')}
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Page Views</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatNumber(metrics.totalPageViews)}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-green-500" />
                </div>
                {generateSparkline(metrics.dailyPageViews.slice(-7).map(d => d.value), '#10b981')}
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {metrics.conversionFunnel.conversionRate}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {metrics.conversionFunnel.reservationSubmits} reservations from {formatNumber(metrics.conversionFunnel.pageViews)} visits
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Session Time</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatTime(Math.round(metrics.topPages.reduce((sum, page) => sum + page.avgTimeOnPage, 0) / metrics.topPages.length))}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Across all pages</p>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-blue-600">
                      {formatNumber(metrics.conversionFunnel.pageViews)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Page Views</p>
                </div>
                <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-green-600">
                      {formatNumber(metrics.conversionFunnel.reservationStarts)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Started Reservations</p>
                </div>
                <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-purple-600">
                      {formatNumber(metrics.conversionFunnel.reservationSubmits)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Completed Reservations</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Pages */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h2>
                <div className="space-y-3">
                  {metrics.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{page.page}</p>
                        <p className="text-sm text-gray-500">
                          {formatTime(page.avgTimeOnPage)} avg time
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatNumber(page.views)}</p>
                        <p className="text-sm text-gray-500">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Clicked Elements */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MousePointer className="h-5 w-5 mr-2" />
                  Top Clicked Elements
                </h2>
                <div className="space-y-3">
                  {metrics.topSelectors.map((selector, index) => (
                    <div key={`${selector.selector}-${selector.page}`} className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm font-mono">{selector.selector}</p>
                        <p className="text-sm text-gray-500">{selector.page}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{selector.clicks}</p>
                        <p className="text-sm text-gray-500">clicks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Traffic Chart */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Page Views (Last 30 Days)</h2>
              <div className="h-64 flex items-end justify-between space-x-1">
                {metrics.dailyPageViews.map((day, index) => {
                  const maxValue = Math.max(...metrics.dailyPageViews.map(d => d.value));
                  const height = (day.value / maxValue) * 240;
                  
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                        style={{ height: `${height}px` }}
                        title={`${day.date}: ${day.value} views`}
                      ></div>
                      {index % 5 === 0 && (
                        <p className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                          {new Date(day.date).getMonth() + 1}/{new Date(day.date).getDate()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
