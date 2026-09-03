"use client";
import { useState, useCallback } from 'react';
import apiClient from '../services/api';
import { toast } from 'react-toastify';

function useProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  });

  const fetchProperties = useCallback(async (filters = {}, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWithQuery('/properties', {
        ...filters,
        page,
        limit: filters.limit || pagination.limit,
      });
      setProperties(response.data || []);
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

  const searchProperties = useCallback(async (searchTerm, filters = {}, page = 1) => {
    return fetchProperties({ ...filters, keyword: searchTerm }, page);
  }, [fetchProperties]);

  const getPropertyById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/properties/${id}`);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProperty = useCallback(async (propertyData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/properties', propertyData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProperty = useCallback(async (id, propertyData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(`/properties/${id}`, propertyData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProperty = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/properties/${id}`);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    properties,
    loading,
    error,
    pagination,
    fetchProperties,
    searchProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
  };
}

export { useProperties };