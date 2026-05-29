/**
 * Admin panel shared types.
 */

export type CategoryRow = {
  id: string;
  restaurant_id: string;
  slug: string;
  label: string;
  emoji: string | null;
  display_order: number;
  visible: boolean;
  created_at: string;
};

export type RestaurantSettingsRow = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  rating: number | null;
  prep_time: string | null;
  logo_url: string | null;
  banner_url: string | null;
  contact_phone: string | null;
  address: string | null;
  open_hours: string | null;
  gst_percent: number;
  theme_color: string;
};

export type DashboardStats = {
  ordersToday: number;
  activeOrders: number;
  completedToday: number;
  pendingOrders: number;
  revenueToday: number;
  onlineRevenue: number;
  cashRevenue: number;
  paidOrders: number;
  unpaidOrders: number;
  averageRating: number;
  totalReviews: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    short_id: string;
    table_number: number | null;
    status: string;
    total: number;
    payment_method: string | null;
    payment_status: string | null;
    created_at: string;
    item_count: number;
  }[];
};

export type MenuItemInput = {
  id?: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  veg: boolean;
  emoji?: string;
  image_url?: string;
  tags: string[];
  in_stock: boolean;
  display_order?: number;
};
