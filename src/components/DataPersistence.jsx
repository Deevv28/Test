import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

/**
 * Component to handle data persistence and prevent unnecessary API calls
 * This ensures data survives page refreshes and reduces server load
 */
const DataPersistence = () => {
  const { isAuthenticated, authChecked } = useAuth();
  const { loadUserOrders, loadUserBookings, dataLoaded } = useData();

  // Load user-specific data only once when authenticated
  useEffect(() => {
    if (isAuthenticated && authChecked && !dataLoaded) {
      // Load user data with a small delay to prevent race conditions
      const timer = setTimeout(() => {
        loadUserOrders();
        loadUserBookings();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authChecked, dataLoaded]);

  // This component doesn't render anything
  return null;
};

export default DataPersistence;