"use client";
import { useState, useCallback } from 'react';
import apiClient from '../services/api';

function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const fetchBookings = useCallback(async (filters = {}, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWithQuery('/bookings', {
        ...filters,
        page,
        limit: filters.limit || pagination.limit,
      });
      setBookings(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          ...response.pagination,
        }));
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  const createBooking = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/bookings', bookingData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBookingById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/bookings/${id}`);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBooking = useCallback(async (id, bookingData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(`/bookings/${id}`, bookingData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBooking = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/bookings/${id}`);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bookings,
    loading,
    error,
    pagination,
    fetchBookings,
    createBooking,
    getBookingById,
    updateBooking,
    deleteBooking,
    cancelBooking: deleteBooking,
  };
}

export { useBookings };