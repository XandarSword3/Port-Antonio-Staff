'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  ChefHat,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Dish } from '../types';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import DashboardOverview from './DashboardOverview';
import ReservationManager from './ReservationManager';
import OrderManager from './OrderManager';
import StaffManager from './StaffManager';
import KitchenDisplay from './KitchenDisplay';
import AnalyticsView from './AnalyticsView';
import MenuManagerReal from './MenuManagerReal';
import CategoryManager from './CategoryManager';
import EventManager from './EventManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import ContentSettings from './ContentSettings';
import JobsManager from './JobsManager';

const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['worker', 'admin', 'owner'] },
  { id: 'menu', label: 'Menu Manager', icon: ChefHat, roles: ['worker', 'admin', 'owner'] },
  { id: 'reservations', label: 'Reservations', icon: Calendar, roles: ['worker', 'admin', 'owner'] },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, roles: ['worker', 'admin', 'owner'] },
  { id: 'events', label: 'Events', icon: Calendar, roles: ['admin', 'owner'] },
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat, roles: ['admin', 'owner'] },
  { id: 'staff', label: 'Staff', icon: Users, roles: ['admin', 'owner'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'owner'] },
  { id: 'content', label: 'Content', icon: Settings, roles: ['admin', 'owner'] },
  { id: 'jobs', label: 'Careers', icon: Settings, roles: ['admin', 'owner'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['owner'] },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) return null;

  const availableItems = NAVIGATION_ITEMS.filter(item => 
    item.roles.includes(user.role)
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'menu':
        return <MenuManagerWrapper />;
      case 'reservations':
        return <ReservationManager />;
      case 'orders':
        return <OrderManager />;
      case 'events':
        return <EventManagerWrapper />;
      case 'kitchen':
        return <KitchenDisplay />;
      case 'staff':
        return <StaffManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'settings':
        return <div className="p-6">Settings coming soon...</div>;
      case 'content':
        return <ContentSettings/>;
      case 'jobs':
        return <JobsManager/>;
      default:
        return <DashboardOverview />;
    }
  };

  // Menu Manager Wrapper with real database data
  const MenuManagerWrapper = () => {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string; order: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      Promise.all([loadDishes(), loadCategories()]).finally(() => setLoading(false));
    }, []);

    async function loadDishes() {
      try {
        const res = await fetch('/api/dishes', { cache: 'no-store' });
        const json = await res.json();
        const data = (json.dishes || []).map((dish: any) => ({
          id: dish.id,
          name: dish.name,
          shortDesc: dish.short_desc || '',
          fullDesc: dish.full_desc || '',
          price: dish.price || 0,
          categoryId: dish.category_id,
          available: dish.available !== false,
          image: dish.image_url || '/images/placeholder.jpg',
          dietTags: [],
          allergens: [],
          ingredients: [],
          currency: dish.currency || 'USD',
          imageVariants: { src: dish.image_url || '/images/placeholder.jpg' },
          rating: 0,
          reviewCount: 0,
          sponsored: false
        }));
        setDishes(data);
      } catch (e) {
        console.error('Failed to load dishes via API:', e);
      }
    }

    async function loadCategories() {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        const json = await res.json();
        const data = (json.categories || []).map((c: any) => ({ id: c.id, name: c.name, order: c.order_index }));
        setCategories(data);
      } catch (e) {
        console.error('Failed to load categories via API:', e);
      }
    }

    const handleDishUpdate = (updatedDishes: Dish[]) => {
      setDishes(updatedDishes);
    };

    if (loading) {
      return (
        <div className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-staff-600"></div>
          <span className="ml-3 text-gray-600">Loading menu data...</span>
        </div>
      );
    }

    return (
      <div className="p-6">
        <MenuManagerReal 
          dishes={dishes as any} 
          categories={categories as any} 
          onUpdate={handleDishUpdate} 
        />
      </div>
    );
  };

  // Event Manager Wrapper with mock data
  const EventManagerWrapper = () => {
    const [events, setEvents] = useState([
      {
        id: '1',
        title: 'Wine Tasting Evening',
        description: 'Join us for an exclusive wine tasting event',
        date: new Date('2024-02-15'),
        startTime: '18:00',
        endTime: '21:00',
        location: 'Main Dining Room',
        maxCapacity: 30,
        currentCapacity: 12,
        price: 45,
        currency: 'USD',
        category: 'dining' as const,
        status: 'published' as const,
        createdAt: new Date(),
        createdBy: 'admin',
        updatedAt: new Date()
      }
    ]);

    const handleAddEvent = (eventData: any) => {
      const newEvent = {
        ...eventData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      setEvents([...events, newEvent]);
    };

    const handleUpdateEvent = (id: string, eventData: any) => {
      setEvents(events.map(event => 
        event.id === id ? { ...event, ...eventData } : event
      ));
    };

    const handleDeleteEvent = (id: string) => {
      if (confirm('Are you sure you want to delete this event?')) {
        setEvents(events.filter(event => event.id !== id));
      }
    };

    return (
      <div className="p-6">
        <EventManager
          events={events}
          onAddEvent={handleAddEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? '16rem' : '4rem' }}
        className="bg-white shadow-lg border-r border-gray-200 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">Staff Portal</h1>
                <p className="text-xs text-gray-500">Port San Antonio</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {availableItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  isActive 
                    ? 'bg-staff-100 text-staff-700 border border-staff-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-staff-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className={`text-xs truncate role-badge role-${user.role}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 p-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-8 h-8 bg-staff-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-sm font-medium">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4 mx-auto" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {availableItems.find(item => item.id === currentView)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500">
                Welcome back, {user.firstName}!
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Time */}
              <div className="text-sm text-gray-500">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
