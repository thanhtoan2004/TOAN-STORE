"use client";
import { useEffect, useState } from "react";
import { TrendingUp, ShoppingCart, Users, DollarSign, Package, AlertTriangle } from "lucide-react";

interface AnalyticsData {
    overview: {
        totalRevenue: number;
        totalOrders: number;
        avgOrderValue: number;
        newCustomers: number;
    };
    ordersByStatus: Array<{ status: string; count: number }>;
    revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
    topProducts: Array<{ id: number; name: string; imageUrl: string; totalSold: number; revenue: number }>;
    lowStock: Array<{ id: number; name: string; imageUrl: string; available: number }>;
    categoryPerformance: Array<{ category: string; orders: number; itemsSold: number; revenue: number }>;
}

export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/analytics?period=${period}`);
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                </select>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(data.overview.totalRevenue)}
                    icon={<DollarSign className="w-6 h-6" />}
                    trend="+12.5%"
                    trendUp={true}
                />
                <StatCard
                    title="Total Orders"
                    value={data.overview.totalOrders.toString()}
                    icon={<ShoppingCart className="w-6 h-6" />}
                    trend="+8.2%"
                    trendUp={true}
                />
                <StatCard
                    title="Avg Order Value"
                    value={formatCurrency(data.overview.avgOrderValue)}
                    icon={<TrendingUp className="w-6 h-6" />}
                    trend="+3.1%"
                    trendUp={true}
                />
                <StatCard
                    title="New Customers"
                    value={data.overview.newCustomers.toString()}
                    icon={<Users className="w-6 h-6" />}
                    trend="+15.3%"
                    trendUp={true}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {data.revenueByDay.slice(-14).map((day, index) => {
                            const maxRevenue = Math.max(...data.revenueByDay.map(d => d.revenue));
                            const height = (day.revenue / maxRevenue) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                                        style={{ height: `${height}%` }}
                                        title={`${formatCurrency(day.revenue)} - ${day.orders} orders`}
                                    />
                                    <span className="text-xs text-gray-500 mt-2">
                                        {new Date(day.date).getDate()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Orders by Status */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Orders by Status</h2>
                    <div className="space-y-3">
                        {data.ordersByStatus.map((item) => {
                            const total = data.ordersByStatus.reduce((sum, s) => sum + s.count, 0);
                            const percentage = (item.count / total) * 100;
                            return (
                                <div key={item.status}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="capitalize">{item.status}</span>
                                        <span className="font-semibold">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Top Products & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
                    <div className="space-y-3">
                        {data.topProducts.slice(0, 5).map((product) => (
                            <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{product.name}</p>
                                    <p className="text-sm text-gray-500">{product.totalSold} sold</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Low Stock Alert
                    </h2>
                    <div className="space-y-3">
                        {data.lowStock.slice(0, 5).map((product) => (
                            <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{product.name}</p>
                                    <p className="text-sm text-orange-600 font-semibold">
                                        Only {product.available} left
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Category Performance</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">Category</th>
                                <th className="text-right py-3 px-4">Orders</th>
                                <th className="text-right py-3 px-4">Items Sold</th>
                                <th className="text-right py-3 px-4">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.categoryPerformance.map((cat, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{cat.category}</td>
                                    <td className="py-3 px-4 text-right">{cat.orders}</td>
                                    <td className="py-3 px-4 text-right">{cat.itemsSold}</td>
                                    <td className="py-3 px-4 text-right font-semibold">
                                        {formatCurrency(cat.revenue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    trendUp: boolean;
}

function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">{title}</span>
                <div className="text-gray-400">{icon}</div>
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className={`text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend} from last period
            </div>
        </div>
    );
}
