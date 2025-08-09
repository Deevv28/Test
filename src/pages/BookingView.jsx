import React, { useState } from 'react';
import { Calendar, Clock, Users, ArrowLeft, Check, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';


function App() {
  const [showTableCards, setShowTableCards] = useState(true); // Start with table cards view
  const [selectedTable, setSelectedTable] = useState(null);
  const [showImageView, setShowImageView] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tableTypes, setTableTypes] = useState([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const { apiCall } = useAuth();
  const { addNotification } = useNotification();
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    guests: 2,
    specialRequests: ''
  });

  // Load tables from backend
  React.useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setIsLoadingTables(true);
    try {
      const response = await fetch(`http://localhost:5000/api/restaurants/${id}`);
      const data = await response.json();
      
      if (data.success) {
        const restaurant = data.data;
        const tablesWithImages = await Promise.all(
          restaurant.tables.map(async (table) => {
            try {
              const imagesResponse = await fetch(`http://localhost:5000/api/restaurants/${id}/tables/${table.id}/images`);
              const imagesData = await imagesResponse.json();
              
              const images = imagesData.success ? imagesData.data : [];
              const gallery = images.map(img => `http://localhost:5000${img.image_path}`);
              
              return {
                id: table.id,
                name: getTableTypeName(table.type),
                type: table.type,
                capacity: table.capacity,
                description: table.description || getDefaultDescription(table.type),
                image: gallery[0] || getDefaultImage(table.type),
                minSpend: `$${table.min_spend || 0}`,
                features: table.features ? table.features.split(',').map(f => f.trim()) : getDefaultFeatures(table.type),
                availableSlots: getAvailableSlots(),
                gallery: gallery.length > 0 ? gallery : [getDefaultImage(table.type)],
                table_number: table.table_number,
                status: table.status
              };
            } catch (error) {
              console.error('Error loading images for table:', table.id, error);
              return {
                id: table.id,
                name: getTableTypeName(table.type),
                type: table.type,
                capacity: table.capacity,
                description: table.description || getDefaultDescription(table.type),
                image: getDefaultImage(table.type),
                minSpend: `$${table.min_spend || 0}`,
                features: table.features ? table.features.split(',').map(f => f.trim()) : getDefaultFeatures(table.type),
                availableSlots: getAvailableSlots(),
                gallery: [getDefaultImage(table.type)],
                table_number: table.table_number,
                status: table.status
              };
            }
          })
        );
        
        // Filter only available tables for customer booking
        const availableTables = tablesWithImages.filter(table => table.status === 'available');
        setTableTypes(availableTables);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
      addNotification('Failed to load tables', 'error');
    } finally {
      setIsLoadingTables(false);
    }
  };

  const getTableTypeName = (type) => {
    const typeNames = {
      couple: 'Couple Table',
      family: 'Family Table', 
      group: 'Large Group Table',
      private: 'Private Dining',
      outdoor: 'Outdoor Seating'
    };
    return typeNames[type] || 'Standard Table';
  };

  const getDefaultDescription = (type) => {
    const descriptions = {
      couple: 'Perfect for intimate dining with stunning views',
      family: 'Spacious seating in the heart of the restaurant',
      group: 'Exclusive seating for special occasions and complete privacy',
      private: 'Private dining room for exclusive experiences',
      outdoor: 'Beautiful outdoor seating with fresh air'
    };
    return descriptions[type] || 'Comfortable seating with great ambiance';
  };

  const getDefaultImage = (type) => {
    const defaultImages = {
      couple: 'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      family: 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      group: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      private: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      outdoor: 'https://images.pexels.com/photos/776538/pexels-photo-776538.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
    };
    return defaultImages[type] || 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop';
  };

  const getDefaultFeatures = (type) => {
    const features = {
      couple: ['Window view', 'Romantic ambiance', 'Perfect for couples'],
      family: ['Central location', 'Great for families', 'Vibrant atmosphere'],
      group: ['Complete privacy', 'Premium service', 'Special occasions'],
      private: ['Exclusive dining', 'Private service', 'Luxury experience'],
      outdoor: ['Fresh air', 'Garden view', 'Natural lighting']
    };
    return features[type] || ['Comfortable seating', 'Great service', 'Pleasant atmosphere'];
  };

  const getAvailableSlots = () => {
    return ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
  };


  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setCurrentImageIndex(0); // Reset to first image when selecting a new table
    setShowImageView(true);
    setBookingData(prev => ({ ...prev, guests: table.capacity }));
  };

  const handleBackToTableCards = () => {
    setShowImageView(false);
    setSelectedTable(null);
    setCurrentImageIndex(0);
  };

  
  const handleBackToMain = () => {
   navigate('/dashboard'); 
  };

  // Image navigation functions - Fixed implementation
  const nextImage = () => {
    if (selectedTable && selectedTable.gallery && selectedTable.gallery.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % selectedTable.gallery.length;
        console.log('Next image:', nextIndex, 'of', selectedTable.gallery.length); // Debug log
        return nextIndex;
      });
    }
  };

  const prevImage = () => {
    if (selectedTable && selectedTable.gallery && selectedTable.gallery.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex === 0 ? selectedTable.gallery.length - 1 : prevIndex - 1;
        console.log('Previous image:', nextIndex, 'of', selectedTable.gallery.length); // Debug log
        return nextIndex;
      });
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const handleBooking = (e) => {
    e.preventDefault();
    if (!selectedTable || !bookingData.date || !bookingData.time) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Make booking API call
    apiCall('/bookings', {
      method: 'POST',
      body: {
        restaurantId: parseInt(id),
        tableId: selectedTable.id,
        date: bookingData.date,
        time: bookingData.time,
        guests: bookingData.guests,
        specialRequests: bookingData.specialRequests
      }
    })
    .then(response => {
      if (response.success) {
        addNotification('Table booked successfully!', 'success');
        navigate('/dashboard');
      }
    })
    .catch(error => {
      addNotification(error.message || 'Failed to book table', 'error');
    });
  };

  if (isLoadingTables) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available tables...</p>
        </div>
      </div>
    );
  }

  // Choose Your Table View
  if (!showImageView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
       <header className="bg-white/90 backdrop-blur-md shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button on the left */}
            <button 
              onClick={handleBackToMain} 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors hover:bg-gray-100 px-2 py-1 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Centered Title */}
            <h1 className="text-lg font-semibold text-gray-900 text-center flex-1">
              Choose Your Table
            </h1>

            {/* Empty right spacer to balance layout */}
            <div className="w-20" />
          </div>
        </div>
      </header>


        <div className="px-4 py-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Perfect Table</h2>
            <p className="text-gray-600 text-sm">Choose from our carefully curated seating options</p>
            {tableTypes.length === 0 && (
              <p className="text-amber-600 text-sm mt-2">No tables available for booking at the moment</p>
            )}
          </div>
          
          {tableTypes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Available Tables</h3>
              <p className="text-gray-600">All tables are currently booked. Please try a different date or contact the restaurant.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2 px-6 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-300"
              >
                Back to Restaurants
              </button>
            </div>
          ) : (
          <div className="flex overflow-x-auto gap-4 px-2 snap-x snap-mandatory scroll-smooth">
            {tableTypes.map((tableType) => (
              <div key={tableType.id} className="bg-white rounded-2xl shadow-lg border min-w-[280px] max-w-xs snap-center shrink-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 aspect-[3/4]">
                <div className="relative">
                  <div className="h-40 overflow-hidden rounded-t-2xl">
                    <img
                      src={tableType.image}
                      alt={tableType.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  
                  <div className="absolute top-3 right-3">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                      {tableType.capacity} seats
                    </div>
                  </div>

                  <div className="absolute top-3 left-3">
                    <div className="bg-amber-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                      {tableType.gallery?.length || 1} photos
                    </div>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col justify-between h-[calc(100%-10rem)]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-1">{tableType.name}</h4>
                      <p className="text-gray-600 text-xs leading-relaxed">{tableType.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Table #{tableType.table_number}</p>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-sm font-bold text-green-600">{tableType.minSpend}</div>
                      <div className="text-xs text-gray-500">min spend</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tableType.features.map((feature, index) => (
                      <span key={index} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleTableSelect(tableType)}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2.5 px-4 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center space-x-2 text-sm transform hover:scale-105 active:scale-95"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View This Table</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    );
  }

  // Table Detail and Booking View with Working Image Slider
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBackToTableCards} 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors hover:bg-gray-100 px-2 py-1 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{selectedTable?.name}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Image Slider Section */}
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          <div className="relative">
            {/* Main Image Container with improved aspect ratio */}
            <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden bg-gray-100">
              <img
                src={selectedTable?.gallery?.[currentImageIndex] || selectedTable?.image}
                alt={`${selectedTable?.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain transition-all duration-500 ease-in-out"    
                style={{ objectPosition: 'center' }}
              />
              
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>
            </div>
            
            {/* Navigation Buttons with improved styling */}
            {selectedTable?.gallery && selectedTable.gallery.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl z-20 border border-white/20"
                  type="button"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl z-20 border border-white/20"
                  type="button"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Enhanced Image Counter */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium border border-white/20">
              {currentImageIndex + 1} / {selectedTable?.gallery?.length || 1}
            </div>
            
            {/* Enhanced Image Indicator Dots */}
            {selectedTable?.gallery && selectedTable.gallery.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
                {selectedTable.gallery?.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    type="button"
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
            
            {/* Table Info Overlay */}
            <div className="absolute bottom-4 left-4 right-20 text-white">
              <h2 className="text-xl font-bold mb-1 drop-shadow-lg">{selectedTable?.name}</h2>
              <p className="text-white/90 text-sm drop-shadow-md">{selectedTable?.description}</p>
              <p className="text-white/80 text-xs drop-shadow-md mt-1">Table #{selectedTable?.table_number}</p>
            </div>
          </div>
        </div>

        {/* Table Features */}
        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Features</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span className="text-gray-700">Up to {selectedTable?.capacity} guests</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-semibold">{selectedTable?.minSpend} min spend</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTable?.features.map((feature, index) => (
              <span key={index} className="bg-amber-100 text-amber-800 text-sm px-3 py-1.5 rounded-full font-medium">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Make Your Reservation</h3>
          <form onSubmit={handleBooking} className="space-y-4">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Date
              </label>
              <input
                type="date"
                value={bookingData.date}
                onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Select Time
              </label>
              <select
                value={bookingData.time}
                onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Choose a time slot</option>
                {selectedTable?.availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Number of Guests
              </label>
              <select
                value={bookingData.guests}
                onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
              >
                {Array.from({ length: selectedTable?.capacity || 2 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={bookingData.specialRequests}
                onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="Any special requirements or dietary restrictions..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>
          </form>
        </div>

        {/* Booking Summary */}
        {bookingData.date && bookingData.time && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Table Type:</span>
                <span className="font-medium">{selectedTable?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Table Number:</span>
                <span className="font-medium">#{selectedTable?.table_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{selectedTable?.capacity} guests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium">{bookingData.date} at {bookingData.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Party Size:</span>
                <span className="font-medium">{bookingData.guests} guests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Spend:</span>
                <span className="font-medium text-green-600">{selectedTable?.minSpend}</span>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Booking Button */}
        <button
          onClick={handleBooking}
          disabled={!bookingData.date || !bookingData.time}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 px-6 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-95"
        >
          <Check className="w-5 h-5" />
          <span>Confirm Booking</span>
        </button>
      </div>
    </div>
  );
}

export default App;