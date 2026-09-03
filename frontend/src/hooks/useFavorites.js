"use client";
import { useState, useCallback } from 'react';
import apiClient from '../services/api';

function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFavoritedMap, setIsFavoritedMap] = useState({});
  const [pendingIds, setPendingIds] = useState({});

  const fetchFavorites = useCallback(async () => {
    if (!localStorage.getItem('househunt_token')) {
      setFavorites([]);
      setIsFavoritedMap({});
      return [];
    }
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/favorites');
      const data = response.data || [];
      setFavorites(data);
      const map = {};
      data.forEach(p => {
        if (p && p._id) map[p._id] = true;
      });
      setIsFavoritedMap(map);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addFavorite = useCallback(async (propertyId) => {
    if (!localStorage.getItem('househunt_token')) {
      throw new Error('Please sign in to save favorites');
    }
    setPendingIds(prev => ({ ...prev, [propertyId]: true }));
    try {
      await apiClient.post(`/favorites/${propertyId}`, {});
      setIsFavoritedMap(prev => ({ ...prev, [propertyId]: true }));
      await fetchFavorites();
    } catch (err) {
      throw err;
    } finally {
      setPendingIds(prev => ({ ...prev, [propertyId]: false }));
    }
  }, [fetchFavorites]);

  const removeFavorite = useCallback(async (propertyId) => {
    if (!localStorage.getItem('househunt_token')) {
      throw new Error('Please sign in to manage favorites');
    }
    setPendingIds(prev => ({ ...prev, [propertyId]: true }));
    // Optimistic removal for an instant feel
    setFavorites(prev => prev.filter(fav => fav && fav._id !== propertyId));
    setIsFavoritedMap(prev => ({ ...prev, [propertyId]: false }));
    try {
      await apiClient.delete(`/favorites/${propertyId}`);
      await fetchFavorites();
    } catch (err) {
      // Reconcile from server on failure
      await fetchFavorites();
      throw err;
    } finally {
      setPendingIds(prev => ({ ...prev, [propertyId]: false }));
    }
  }, [fetchFavorites]);

  const isPropertyFavorited = useCallback((propertyId) => {
    return !!isFavoritedMap[propertyId];
  }, [isFavoritedMap]);

  const isFavoritePending = useCallback((propertyId) => {
    return !!pendingIds[propertyId];
  }, [pendingIds]);

  const toggleFavorite = useCallback(async (propertyId) => {
    if (isFavoritedMap[propertyId]) {
      await removeFavorite(propertyId);
    } else {
      await addFavorite(propertyId);
    }
  }, [isFavoritedMap, addFavorite, removeFavorite]);

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isPropertyFavorited,
    isFavoritePending,
  };
}

export { useFavorites };