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
    let mounted = true;
    
    if (isAuthenticated && authChecked && !dataLoaded && mounted) {
      // Load user data with a small delay to prevent race conditions
      const timer = setTimeout(() => {
        if (mounted) {
          loadUserOrders();
          loadUserBookings();
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
        mounted = false;
      };
    }
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authChecked, dataLoaded]);

  // This component doesn't render anything
  return null;
};

export default DataPersistence;