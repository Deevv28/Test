import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  ChefHat, 
  Bell, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, path: '/admin' },
    { id: 'tables', label: 'Table Management', icon: Users, path: '/admin/tables' },
    { id: 'bookings', label: 'Table Booking', icon: Calendar, path: '/admin/bookings' },
    { id: 'orders', label: 'Order Management', icon: ShoppingBag, path: '/admin/orders' },
    { id: 'customers', label: 'Customer Data', icon: Users, path: '/admin/customers' },
    { id: 'analytics', label: 'Sales Analytics', icon: TrendingUp, path: '/admin/analytics' },
    { id: 'menu', label: 'Menu Management', icon: ChefHat, path: '/admin/menu' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/admin/notifications' },
    { id: 'settings', label: 'Restaurant Settings', icon: Settings, path: '/admin/settings' }
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Admin Panel</h2>
            <p className="text-sm text-slate-400">{user?.restaurantName}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">{user?.name?.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-slate-400">Restaurant Admin</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-2 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;