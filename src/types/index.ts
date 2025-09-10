// ============================================================================
// CORE BUSINESS TYPES - Migrated from Customer Site
// ============================================================================

export interface Category {
  id: string
  name: string
  order: number
  description?: string
}

export interface PriceVariant {
  label: string
  price: number
}

export interface Promotion {
  id: string
  name: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  startDate: Date
  endDate: Date
  active: boolean
  applicableCategories?: string[]
  applicableDishes?: string[]
}

export interface Dish {
  id: string
  categoryId: string
  name: string
  shortDesc: string
  fullDesc: string
  price: number
  variants?: PriceVariant[]
  currency: string
  image: string
  imageVariants: {
    src: string
    srcWebp?: string
    srcAvif?: string
    thumb?: string
    blurDataURL?: string
  }
  dietTags: string[]
  allergens: string[]
  ingredients: string[]
  calories?: number | null
  available: boolean
  sponsored: boolean
  rating: number
  reviewCount: number
  promotions?: string[] // IDs of applicable promotions
}

export interface Ad {
  id: string
  title: string
  image: string
  url: string
  position: 'side-rail' | 'mobile-banner' | 'header' | 'footer'
  weight: number
  active?: boolean
  description?: string
  targetAudience?: string
  targetKeywords?: string[]
  startDate?: Date
  endDate?: Date
  budget?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface AppData {
  categories: Category[]
  dishes: Dish[]
  ads: Ad[]
  reservations?: Reservation[]
  events?: Event[]
  jobPositions?: JobPosition[]
  pageContent?: PageContent[]
}

export interface DietFilter {
  id: string
  label: string
  active: boolean
}

export interface FilterState {
  search: string
  selectedCategory: string | null
  activeDietFilters: string[]
  availabilityOnly?: boolean
  priceBucket?: 'lte10' | 'btw11_20' | 'gt20' | null
}

export type UserRole = 'guest' | 'worker' | 'admin' | 'owner'

export interface User {
  id: string
  username: string
  email?: string
  role: UserRole
  createdAt: Date
  lastLogin?: Date
  active: boolean
}

// Staff User (extended from User for staff portal)
export interface StaffUser {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: 'worker' | 'admin' | 'owner'
  department?: string
  phone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  lastLogin?: string
}

export interface Reservation {
  id: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  partySize: number
  date: string
  time: string
  tableNumber?: string
  specialRequests?: string
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show'
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  visibleTo: string[] // Array of user IDs who can see this reservation
}

export interface Event {
  id: string
  title: string
  description: string
  date: Date
  startTime: string
  endTime: string
  location: string
  maxCapacity?: number
  currentCapacity: number
  price?: number
  currency: string
  image?: string
  category: 'conference' | 'dining' | 'entertainment' | 'special'
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  createdAt: Date
  createdBy: string // User ID
  updatedAt?: Date
  featuredUntil?: Date
}

export interface JobPosition {
  id: string
  title: string
  department: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  location: string
  description: string
  requirements: string[]
  benefits: string[]
  salary?: string
  active: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface PageContent {
  id: string
  pageId: 'careers' | 'privacy' | 'terms' | 'accessibility'
  section: string
  content: string
  updatedAt: Date
  updatedBy: string
}

export interface FooterSettings {
  id: string
  companyName: string
  description: string
  address: string
  phone: string
  email: string
  diningHours: string
  diningLocation: string
  socialLinks: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  lastUpdated: Date
  updatedBy: string
}

export interface LegalPageContent {
  id: string
  type: 'privacy' | 'terms' | 'accessibility'
  title: string
  sections: {
    id: string
    title: string
    content: string
    order: number
  }[]
  lastUpdated: Date
  updatedBy: string
}

export interface AuthPayload {
  userId: string
  username: string
  role: UserRole
  iat: number
  exp: number
}

export interface AuditLog {
  id: string
  userId: string
  username: string
  action: string
  resource?: string
  details?: any
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

// ============================================================================
// STAFF PORTAL SPECIFIC TYPES
// ============================================================================

export interface Order {
  id: string
  orderNumber: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  tableNumber?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  tip: number
  total: number
  paymentMethod: 'cash' | 'card' | 'stripe' | 'pending'
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded'
  stripePaymentId?: string
  status: 'draft' | 'submitted' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  orderType: 'dine-in' | 'takeout' | 'delivery'
  estimatedReadyTime?: string
  actualReadyTime?: string
  notes?: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  visibleTo: string[] // Array of user IDs who can see this order
}

export interface OrderItem {
  id: string
  dishId: string
  dishName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  customizations?: string[]
  specialInstructions?: string
}

export interface KitchenTicket {
  id: string
  orderId: string
  orderNumber: string
  tableNumber?: string
  items: KitchenTicketItem[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'acknowledged' | 'preparing' | 'ready' | 'served'
  estimatedTime: number // minutes
  actualTime?: number // minutes
  notes?: string
  assignedTo?: string // chef/cook ID
  createdAt: string
  updatedAt: string
}

export interface KitchenTicketItem {
  id: string
  dishName: string
  quantity: number
  customizations?: string[]
  specialInstructions?: string
  completed: boolean
}

export interface Analytics {
  id: string
  date: string
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  topDishes: Array<{
    dishId: string
    dishName: string
    quantity: number
    revenue: number
  }>
  peakHours: Array<{
    hour: number
    orderCount: number
    revenue: number
  }>
  paymentMethodBreakdown: {
    cash: number
    card: number
    stripe: number
  }
  createdAt: string
}

// ============================================================================
// PERMISSIONS & ROLES
// ============================================================================

export const ROLE_PERMISSIONS = {
  guest: {
    view_dashboard: false,
    manage_menu: false,
    manage_categories: false,
    manage_settings: false,
    manage_users: false,
    manage_reservations: false,
    manage_events: false,
    manage_content: false,
    canView: true,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageSettings: false,
    view_analytics: false
  },
  worker: {
    view_dashboard: true,
    manage_menu: true,
    manage_categories: false,
    manage_settings: false,
    manage_users: false,
    manage_reservations: true,
    manage_events: false,
    manage_content: false,
    canView: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageSettings: false,
    view_analytics: false
  },
  admin: {
    view_dashboard: true,
    manage_menu: true,
    manage_categories: true,
    manage_settings: true,
    manage_users: false,
    manage_reservations: true,
    manage_events: true,
    manage_content: true,
    canView: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: false,
    canViewAnalytics: true,
    canManageSettings: true,
    view_analytics: true
  },
  owner: {
    view_dashboard: true,
    manage_menu: true,
    manage_categories: true,
    manage_settings: true,
    manage_users: true,
    manage_reservations: true,
    manage_events: true,
    manage_content: true,
    canView: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canManageSettings: true,
    view_analytics: true
  }
} as const
