import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminOverview from '../pages/admin/AdminOverview';
import AdminTables from '../pages/admin/AdminTables';
import AdminBookings from '../pages/admin/AdminBookings';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminCustomers from '../pages/admin/AdminCustomers';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminMenu from '../pages/admin/AdminMenu';
import AdminNotifications from '../pages/admin/AdminNotifications';
import AdminSettings from '../pages/admin/AdminSettings';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/tables" element={<AdminTables />} />
          <Route path="/bookings" element={<AdminBookings />} />
          <Route path="/orders" element={<AdminOrders />} />
          <Route path="/customers" element={<AdminCustomers />} />
          <Route path="/analytics" element={<AdminAnalytics />} />
          <Route path="/menu" element={<AdminMenu />} />
          <Route path="/notifications" element={<AdminNotifications />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminLayout;