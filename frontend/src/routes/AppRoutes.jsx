import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';

import HomePage from '../pages/HomePage';
import ExplorePage from '../pages/ExplorePage';
import PropertyDetails from '../pages/ListingDetails';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import CreateListing from '../pages/CreateListing';
import FavoritesPage from '../pages/FavoritesPage';
import BookingsPage from '../pages/BookingsPage';
import AccountPage from '../pages/AccountPage';
import AdminDashboard from '../pages/AdminDashboard';

function AppRoutes() {
  useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/properties" element={<ExplorePage />} />
      <Route path="/properties/:listingId" element={<PropertyDetails />} />

      {/* Protected routes */}
      <Route path="/favorites" element={
        <ProtectedRoute><FavoritesPage /></ProtectedRoute>
      } />
      <Route path="/bookings" element={
        <ProtectedRoute><BookingsPage /></ProtectedRoute>
      } />
      <Route path="/create-listing" element={
        <ProtectedRoute><CreateListing /></ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute><AccountPage /></ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default AppRoutes;
