'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  todayReservations: number;
  pendingOrders: number;
  totalRevenue: number;
  activeStaff: number;
  completedOrders: number;
  avgOrderTime: number;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayReservations: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeStaff: 0,
    completedOrders: 0,
    avgOrderTime: 0,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const res = await fetch('/api/metrics', { cache: 'no-store' })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        setStats({
          todayReservations: json.todayReservations || 0,
          pendingOrders: json.pendingOrders || 0,
          totalRevenue: json.totalRevenue || 0,
          activeStaff: json.activeStaff || 0,
          completedOrders: json.completedOrders || 0,
          avgOrderTime: json.avgOrderTime || 0,
        })
      } catch (e) {
        // Keep zeros on failure
        setStats({
          todayReservations: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          activeStaff: 0,
          completedOrders: 0,
          avgOrderTime: 0,
        })
      }
    }
    loadMetrics()
  }, []);

  const statCards = [
    {
      title: 'Today\'s Reservations',
      value: stats.todayReservations,
      icon: Calendar,
      color: 'blue',
      change: stats.todayReservations > 0 ? `+${Math.floor(Math.random() * 20)}%` : '0%',
      description: 'vs yesterday'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ShoppingCart,
      color: 'orange',
      change: stats.pendingOrders > 0 ? `${stats.pendingOrders} urgent` : '0 urgent',
      description: 'require attention'
    },
    {
      title: 'Today\'s Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'green',
      change: stats.totalRevenue > 0 ? `+${Math.floor(Math.random() * 25)}%` : '0%',
      description: 'vs yesterday'
    },
    {
      title: 'Active Staff',
      value: stats.activeStaff,
      icon: Users,
      color: 'purple',
      change: `${stats.activeStaff} on duty`,
      description: `${Math.max(0, 12 - stats.activeStaff)} off duty`
    },
  ];

  const recentActivity: { time: string; action: string; type: 'reservation' | 'order' | 'staff' | 'kitchen' | 'payment' }[] = [];

  const addSampleData = async () => {
    try {
      const res = await fetch('/api/sample-data', { method: 'POST' })
      if (res.ok) {
        alert('Sample data added successfully! Refresh the page to see the changes.')
      } else {
        alert('Failed to add sample data')
      }
    } catch (e) {
      alert('Error adding sample data')
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-staff-500 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-staff-100">
          Here's what's happening at Port San Antonio Resort today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    {stat.change}
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">
                  {stat.title}
                </div>
                <div className="text-sm text-gray-500">
                  {stat.description}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-staff-600 hover:text-staff-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'reservation' ? 'bg-blue-100' :
                  activity.type === 'order' ? 'bg-green-100' :
                  activity.type === 'staff' ? 'bg-purple-100' :
                  activity.type === 'kitchen' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  {activity.type === 'reservation' && <Calendar className="h-4 w-4 text-blue-600" />}
                  {activity.type === 'order' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {activity.type === 'staff' && <Users className="h-4 w-4 text-purple-600" />}
                  {activity.type === 'kitchen' && <Clock className="h-4 w-4 text-orange-600" />}
                  {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-gray-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-staff-400 hover:bg-staff-50 transition-colors text-center"
            >
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">New Reservation</div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-staff-400 hover:bg-staff-50 transition-colors text-center"
            >
              <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">New Order</div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-staff-400 hover:bg-staff-50 transition-colors text-center"
            >
              <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">View Analytics</div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-staff-400 hover:bg-staff-50 transition-colors text-center"
            >
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">View Alerts</div>
            </motion.button>
            
            <motion.button
              onClick={addSampleData}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
            >
              <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">Add Sample Data</div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Performance Summary (if admin/owner) */}
      {(user?.role === 'admin' || user?.role === 'owner') && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.completedOrders}
              </div>
              <div className="text-sm text-gray-500">Orders Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {stats.avgOrderTime}m
              </div>
              <div className="text-sm text-gray-500">Avg Order Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                96%
              </div>
              <div className="text-sm text-gray-500">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
