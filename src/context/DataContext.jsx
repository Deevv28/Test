import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};


export const DataProvider = ({ children }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState({
    restaurants: 0,
    orders: 0,
    bookings: 0
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    restaurants: false,
    orders: false,
    bookings: false
  });
  const { apiCall, isAuthenticated, authChecked, token } = useAuth();
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Load data from localStorage on mount
  useEffect(() => {
    let mounted = true;
    
    const loadStoredData = () => {
      if (!mounted) return;
      
      try {
        const storedRestaurants = localStorage.getItem('restaurants');
        const storedOrders = localStorage.getItem('orders');
        const storedBookings = localStorage.getItem('bookings');
        const storedCart = localStorage.getItem('cart');
        const storedLastFetch = localStorage.getItem('lastFetch');
        
        if (storedRestaurants) {
          const parsedRestaurants = JSON.parse(storedRestaurants);
          setRestaurants(parsedRestaurants);
          if (parsedRestaurants.length > 0) {
            setDataLoaded(true);
          }
        }
        if (storedOrders) {
          setOrders(JSON.parse(storedOrders));
        }
        if (storedBookings) {
          setBookings(JSON.parse(storedBookings));
        }
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
        if (storedLastFetch) {
          setLastFetch(JSON.parse(storedLastFetch));
        }
        
        console.log('📦 Data restored from localStorage');
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };
    
    loadStoredData();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
  }, [restaurants]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);
  
  useEffect(() => {
    localStorage.setItem('lastFetch', JSON.stringify(lastFetch));
  }, [lastFetch]);
  
  // Load restaurants from API
  const loadRestaurants = async (force = false) => {
    // Prevent multiple simultaneous calls
    if (loadingStates.restaurants && !force) {
      console.log('📦 Restaurants already loading, skipping duplicate call');
      return;
    }
    
    // Check if we need to fetch (cache is expired or force refresh)
    const now = Date.now();
    const shouldFetch = force || 
                       !dataLoaded || 
                       restaurants.length === 0 || 
                       (now - lastFetch.restaurants) > CACHE_DURATION;
    
    if (!shouldFetch) {
      console.log('📦 Using cached restaurants data');
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, restaurants: true }));
    setIsLoading(true);
    try {
      const result = await apiCall('/restaurants');
      if (result && result.success) {
        setRestaurants(result.data);
        setLastFetch(prev => ({ ...prev, restaurants: now }));
        setDataLoaded(true);
        console.log('🏪 Restaurants loaded from API');
      } else if (result && result.data) {
        setRestaurants(result.data);
        setLastFetch(prev => ({ ...prev, restaurants: now }));
        setDataLoaded(true);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load restaurants from API:', error.message);
      // Don't clear existing data on network errors
      if (restaurants.length === 0) {
        // Set fallback data if no stored data exists
        setRestaurants([
          {
            id: 1,
            name: 'The Golden Spoon',
            cuisine: 'Fine Dining',
            rating: 4.8,
            image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
            address: '123 Gourmet Street, Downtown',
            phone: '+1 (555) 123-4567',
            description: 'Exquisite fine dining experience with contemporary cuisine',
            tables: [],
            total_tables: 20,
            available_tables: 12
          },
          {
            id: 2,
            name: 'Sakura Sushi',
            cuisine: 'Japanese',
            rating: 4.6,
            image: 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg',
            address: '456 Zen Garden Ave, Midtown',
            phone: '+1 (555) 234-5678',
            description: 'Authentic Japanese cuisine with fresh sushi and sashimi',
            tables: [],
            total_tables: 15,
            available_tables: 8
          },
          {
            id: 3,
            name: "Mama's Italian",
            cuisine: 'Italian',
            rating: 4.7,
            image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
            address: '789 Pasta Lane, Little Italy',
            phone: '+1 (555) 345-6789',
            description: 'Traditional Italian flavors in a cozy family atmosphere',
            tables: [],
            total_tables: 18,
            available_tables: 10
          }
        ]);
        setDataLoaded(true);
      }
    } finally {
      setIsLoading(false);
      setLoadingStates(prev => ({ ...prev, restaurants: false }));
    }
  };

  // Load restaurants only once when authentication is ready and not already loaded
  useEffect(() => {
    let mounted = true;
    
    if (authChecked && mounted && !dataLoaded && !loadingStates.restaurants) {
      loadRestaurants();
    }
    
    return () => {
      mounted = false;
    };
  }, [authChecked]);
  
  // Force reload restaurants data
  const forceLoadRestaurants = async () => {
    console.log('🔄 Force reloading restaurants data...');
    await loadRestaurants(true);
  };

  // Admin functionality
  const updateRestaurant = (restaurantId, updates) => {
    setRestaurants(prev => prev.map(restaurant => 
      restaurant.id === restaurantId ? { ...restaurant, ...updates } : restaurant
    ));
  };

  const addToCart = (item, restaurantId) => {
    setCart(prev => [...prev, { ...item, restaurantId, id: Date.now() }]);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const addBooking = (booking) => {
    setBookings(prev => [...prev, { ...booking, id: Date.now(), status: 'confirmed' }]);
  };

  const updateTableStatus = (restaurantId, tableId, status) => {
    setRestaurants(prev => prev.map(restaurant => {
      if (restaurant.id === restaurantId) {
        return {
          ...restaurant,
          tables: restaurant.tables.map(table => 
            table.id === tableId ? { ...table, status } : table
          )
        };
      }
      return restaurant;
    }));
  };

  const loadUserOrders = async (force = false) => {
    if (!isAuthenticated || !token) return;
    
    // Prevent multiple simultaneous calls
    if (loadingStates.orders && !force) {
      console.log('📦 Orders already loading, skipping duplicate call');
      return;
    }
    
    const now = Date.now();
    const shouldFetch = force || (now - lastFetch.orders) > CACHE_DURATION;
    
    if (!shouldFetch && orders.length > 0) {
      console.log('📦 Using cached orders data');
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, orders: true }));
    try {
      const result = await apiCall('/orders');
      if (result && result.success) {
        setOrders(result.data);
        setLastFetch(prev => ({ ...prev, orders: now }));
        console.log('📋 Orders loaded from API');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load orders:', error.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, orders: false }));
    }
  };

  const loadUserBookings = async (force = false) => {
    if (!isAuthenticated || !token) return;
    
    // Prevent multiple simultaneous calls
    if (loadingStates.bookings && !force) {
      console.log('📦 Bookings already loading, skipping duplicate call');
      return;
    }
    
    const now = Date.now();
    const shouldFetch = force || (now - lastFetch.bookings) > CACHE_DURATION;
    
    if (!shouldFetch && bookings.length > 0) {
      console.log('📦 Using cached bookings data');
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, bookings: true }));
    try {
      const result = await apiCall('/bookings');
      if (result && result.success) {
        setBookings(result.data);
        setLastFetch(prev => ({ ...prev, bookings: now }));
        console.log('📅 Bookings loaded from API');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load bookings:', error.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, bookings: false }));
    }
  };

  const value = {
    restaurants,
    isLoading,
    dataLoaded,
    loadRestaurants,
    orders,
    bookings,
    cart,
    updateRestaurant,
    addToCart,
    removeFromCart,
    clearCart,
    addBooking,
    updateTableStatus,
    loadUserOrders,
    loadUserBookings,
    forceLoadRestaurants
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};