'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Package, TrendingUp, Gift, Users, RefreshCw, AlertTriangle, XCircle, ArrowUp, ArrowDown, Heart } from 'lucide-react';
import { formatDateTime, formatDate, formatCurrency } from '@/lib/date-utils';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  averageOrderValue: number;
  activeGiftCards: number;
  totalVAT: number;
  totalDiscounts: number;
  totalShipping: number;
  netRevenue: number;
  revenueTrend: Array<{ date: string; revenue: number; orderCount: number }>;
  revenueByStatus: Array<{ status: string; count: number; revenue: number }>;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockProducts: Array<{ id: number; name: string; quantity: number; image: string }>;
  newCustomersMonth: number;
  returningCustomers: number;
  topCustomers: Array<{ id: number; email: string; name: string; totalSpent: number; orderCount: number; membershipTier: string }>;
  todayRevenue: number;
  yesterdayRevenue: number;
  recentOrders: any[];
  topProducts: any[];
  topWishlistedProducts?: any[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);

  useEffect(() => {
    fetchDashboardStats(selectedDays);
  }, [selectedDays]);

  const fetchDashboardStats = async (days: number) => {
    try {
      const [dashboardResponse, wishlistResponse] = await Promise.all([
        fetch(`/api/admin/dashboard?days=${days}`),
        fetch('/api/admin/wishlist?limit=5')
      ]);

      const dashboardData = await dashboardResponse.json();
      const wishlistData = await wishlistResponse.json();

      setStats({
        ...dashboardData,
        topWishlistedProducts: wishlistData.success ? wishlistData.data : []
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const revenueChange = stats?.yesterdayRevenue
    ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100
    : 0;

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'pending_payment_confirmation': return 'bg-orange-100 text-orange-800';
      case 'payment_received': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Comprehensive overview of your store</p>
        </div>

        {/* Stats Cards Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats?.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalOrders?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Average Order Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats?.averageOrderValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-pink-500 rounded-md p-3">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Active Gift Cards</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.activeGiftCards || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
            <div className="flex gap-2">
              {[
                { days: 7, label: '7 Days' },
                { days: 30, label: '30 Days' },
                { days: 90, label: '90 Days' },
                { days: 180, label: '180 Days' },
                { days: 365, label: '1 Year' }
              ].map((option) => (
                <button
                  key={option.days}
                  onClick={() => setSelectedDays(option.days)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedDays === option.days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {stats?.revenueTrend && stats.revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number | undefined) => value ? [formatCurrency(value), 'Revenue'] : ['0 ₫', 'Revenue']}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No revenue data available</p>
          )}
        </div>

        {/* Revenue by Status & Today vs Yesterday */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Order Status</h2>
            {stats?.revenueByStatus && stats.revenueByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.revenueByStatus}
                    dataKey="revenue"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(props: any) => `${formatStatus(props.status)}: ${(props.revenue / 1000).toFixed(0)}k`}
                  >
                    {stats.revenueByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : '0 ₫'} />
                  <Legend formatter={(value) => formatStatus(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No status data</p>
            )}
          </div>

          {/* Today vs Yesterday */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today vs Yesterday</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(stats?.todayRevenue)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Yesterday's Revenue</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {formatCurrency(stats?.yesterdayRevenue)}
                  </p>
                </div>
                <Package className="h-8 w-8 text-gray-600" />
              </div>
              <div className={`p-4 rounded-lg flex items-center justify-between ${revenueChange >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div>
                  <p className="text-sm text-gray-600">Change</p>
                  <p className={`text-xl font-bold ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                  </p>
                </div>
                {revenueChange >= 0 ? (
                  <ArrowUp className="h-8 w-8 text-green-600" />
                ) : (
                  <ArrowDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total VAT Collected</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(stats?.totalVAT)}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Discounts</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(stats?.totalDiscounts)}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Shipping Fees</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats?.totalShipping)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Net Revenue</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(stats?.netRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Inventory Alerts</h2>
            <div className="flex gap-4">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Low Stock: {stats?.lowStockCount || 0}
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full flex items-center gap-1">
                <XCircle className="h-4 w-4" /> Out of Stock: {stats?.outOfStockCount || 0}
              </span>
            </div>
          </div>
          {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <img
                      src={product.image || '/placeholder.png'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-red-600">Only {product.quantity} left in stock!</p>
                    </div>
                  </div>
                  <a
                    href={`/admin/inventory?search=${encodeURIComponent(product.name)}`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Restock
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">All products well-stocked!</p>
          )}
        </div>

        {/* Customer Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">New Customers This Month</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.newCustomersMonth || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Returning Customers</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.returningCustomers || 0}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Spending</h2>
            {stats?.topCustomers && stats.topCustomers.length > 0 ? (
              <div className="space-y-3">
                {stats.topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <div className="ml-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          {customer.membershipTier && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${customer.membershipTier === 'gold' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              customer.membershipTier === 'silver' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                              {customer.membershipTier}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{customer.orderCount} orders</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No customer data</p>
            )}
          </div>
        </div>

        {/* Recent Orders, Top Products & Top Wishlisted */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="p-6">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentOrders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-start justify-between pb-4 border-b border-gray-100 last:border-0">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-medium text-gray-900 truncate" title={order.order_number}>#{order.order_number}</p>
                        <p className="text-sm text-gray-500 truncate" title={order.customer_name}>{order.customer_name}</p>
                      </div>
                      <div className="text-right flex-shrink-0 max-w-[50%]">
                        <p className="font-semibold text-gray-900 mb-1">{formatCurrency(order.total)}</p>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent orders</p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="p-6">
              {stats?.topProducts && stats.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {stats.topProducts.slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <img
                          src={product.primary_image || '/placeholder.png'}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{product.sold} sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No top products</p>
              )}
            </div>
          </div>

          {/* Top Wishlisted Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Top Wishlisted</h2>
              <a href="/admin/wishlist" className="text-sm text-blue-600 hover:text-blue-800">
                View All →
              </a>
            </div>
            <div className="p-6">
              {stats?.topWishlistedProducts && stats.topWishlistedProducts.length > 0 ? (
                <div className="space-y-4">
                  {stats.topWishlistedProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-pink-600 flex items-center gap-1">
                          <Heart className="h-4 w-4 fill-current" /> {product.wishlist_count}
                        </p>
                        <p className="text-xs text-gray-500">{product.unique_users} users</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No wishlist data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
