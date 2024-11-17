// hooks/useFetch.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchWithAuth = useCallback(
    async (url, options = {}) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token');
        }

        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.clear();
          navigate('/login');
          throw new Error('Authentication failed');
        }

        if (!response.ok) {
          throw new Error('Request failed');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  return { fetchWithAuth, loading, error };
};

export default useFetch;
