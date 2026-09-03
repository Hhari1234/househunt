"use client";
import { useState, useCallback } from 'react';
import apiClient from '../services/api';
import { toast } from 'react-toastify';

function useAdmin() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/admin/dashboard');
      setDashboard(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (filters = {}, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWithQuery('/admin/users', {
        ...filters,
        page,
        limit: pagination.limit,
      });
      setUsers(response.data || []);
      setPagination(response.pagination || {});
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  const fetchProperties = useCallback(async (filters = {}, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWithQuery('/admin/properties', {
        ...filters,
        page,
        limit: pagination.limit,
      });
      setProperties(response.data || []);
      setPagination(response.pagination || {});
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  const fetchBookings = useCallback(async (filters = {}, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWithQuery('/admin/bookings', {
        ...filters,
        page,
        limit: pagination.limit,
      });
      setBookings(response.data || []);
      setPagination(response.pagination || {});
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  const updatePropertyStatus = useCallback(async (propertyId, status) => {
    try {
      await apiClient.patch(`/admin/properties/${propertyId}/status`, { status });
      toast.success('Property status updated');
      fetchProperties();
    } catch (err) {
      console.error('Failed to update property status:', err);
      throw err;
    }
  }, [fetchProperties]);

  const updateUserStatus = useCallback(async (userId, status) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { status });
      toast.success('User status updated');
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user status:', err);
      throw err;
    }
  }, [fetchUsers]);

  const refreshAll = useCallback(() => {
    fetchDashboard();
    fetchUsers();
    fetchProperties();
    fetchBookings();
  }, [fetchDashboard, fetchUsers, fetchProperties, fetchBookings]);

  return {
    dashboard,
    users,
    properties,
    bookings,
    loading,
    error,
    pagination,
    fetchDashboard,
    fetchUsers,
    fetchProperties,
    fetchBookings,
    updatePropertyStatus,
    updateUserStatus,
    refreshAll,
  };
}

export { useAdmin };
