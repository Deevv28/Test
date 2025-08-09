import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Eye,
  Upload,
  Image as ImageIcon,
  Star,
  Users,
  DollarSign,
  MapPin,
  Camera,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AdminTables = () => {
  const { apiCall } = useAuth();
  const { addNotification } = useNotification();
  
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableImages, setTableImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [newTable, setNewTable] = useState({
    table_number: '',
    capacity: 2,
    type: 'couple',
    min_spend: '',
    description: '',
    features: '',
    x_position: 0,
    y_position: 0
  });

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    filterTables();
  }, [tables, searchTerm]);

  const loadTables = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/tables');
      if (response.success) {
        setTables(response.data);
      }
    } catch (error) {
      addNotification('Failed to load tables', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableImages = async (tableId) => {
    try {
      const response = await apiCall(`/tables/${tableId}/images`);
      if (response.success) {
        setTableImages(response.data);
        setCurrentImageIndex(0);
      }
    } catch (error) {
      addNotification('Failed to load table images', 'error');
    }
  };

  const filterTables = () => {
    let filtered = [...tables];

    if (searchTerm) {
      filtered = filtered.filter(table => 
        table.table_number.toString().includes(searchTerm) ||
        table.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (table.description && table.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredTables(filtered);
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const response = await apiCall('/tables', {
        method: 'POST',
        body: {
          ...newTable,
          table_number: parseInt(newTable.table_number),
          min_spend: parseFloat(newTable.min_spend)
        }
      });

      if (response.success) {
        addNotification('Table added successfully', 'success');
        setShowAddModal(false);
        setNewTable({
          table_number: '',
          capacity: 2,
          type: 'couple',
          min_spend: '',
          description: '',
          features: '',
          x_position: 0,
          y_position: 0
        });
        loadTables();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to add table', 'error');
    }
  };

  const handleUpdateTable = async (tableId, updates) => {
    try {
      const response = await apiCall(`/tables/${tableId}`, {
        method: 'PUT',
        body: updates
      });

      if (response.success) {
        addNotification('Table updated successfully', 'success');
        setEditingTable(null);
        loadTables();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to update table', 'error');
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!confirm('Are you sure you want to delete this table? This action cannot be undone.')) return;

    try {
      const response = await apiCall(`/tables/${tableId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        addNotification('Table deleted successfully', 'success');
        loadTables();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to delete table', 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`http://localhost:5000/api/tables/${selectedTable.id}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        addNotification(`${files.length} image(s) uploaded successfully`, 'success');
        loadTableImages(selectedTable.id);
        loadTables(); // Refresh tables to update image counts
      } else {
        addNotification(result.message || 'Failed to upload images', 'error');
      }
    } catch (error) {
      addNotification('Failed to upload images', 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    try {
      const response = await apiCall(`/tables/${selectedTable.id}/images/${imageId}/primary`, {
        method: 'PUT'
      });

      if (response.success) {
        addNotification('Primary image updated successfully', 'success');
        loadTableImages(selectedTable.id);
        loadTables();
      }
    } catch (error) {
      addNotification('Failed to update primary image', 'error');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await apiCall(`/tables/${selectedTable.id}/images/${imageId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        addNotification('Image deleted successfully', 'success');
        loadTableImages(selectedTable.id);
        loadTables();
      }
    } catch (error) {
      addNotification('Failed to delete image', 'error');
    }
  };

  const openImageModal = (table) => {
    setSelectedTable(table);
    setShowImageModal(true);
    loadTableImages(table.id);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % tableImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + tableImages.length) % tableImages.length);
  };

  const tableTypes = [
    { value: 'couple', label: 'Couple Table', icon: '💕' },
    { value: 'family', label: 'Family Table', icon: '👨‍👩‍👧‍👦' },
    { value: 'group', label: 'Large Group Table', icon: '👥' },
    { value: 'private', label: 'Private Dining', icon: '🏠' },
    { value: 'outdoor', label: 'Outdoor Seating', icon: '🌿' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-600">Manage restaurant tables and seating arrangements</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Table</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map((table) => (
          <div key={table.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {table.thumbnail_image ? (
                  <img
                    src={`http://localhost:5000${table.thumbnail_image}`}
                    alt={`Table ${table.table_number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No image</p>
                  </div>
                )}
              </div>
              
              <div className="absolute top-4 right-4 flex space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  table.status === 'available' ? 'bg-green-100 text-green-800' :
                  table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                  table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {table.status}
                </span>
                {table.image_count > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {table.image_count} photos
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold">{table.capacity}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Table {table.table_number}</h3>
                  <p className="text-sm text-gray-600 capitalize">{table.type} table</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">${table.min_spend}</p>
                  <p className="text-xs text-gray-500">min spend</p>
                </div>
              </div>
              
              {table.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{table.description}</p>
              )}
              
              {table.features && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {table.features.split(',').slice(0, 3).map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {feature.trim()}
                    </span>
                  ))}
                  {table.features.split(',').length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{table.features.split(',').length - 3} more
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => openImageModal(table)}
                  className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Camera className="w-4 h-4" />
                  <span>Images</span>
                </button>
                <button
                  onClick={() => setEditingTable(table)}
                  className="bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
          <p className="text-gray-500">No tables match your search criteria.</p>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Table</h3>
              <form onSubmit={handleAddTable} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                    <input
                      type="number"
                      min="1"
                      value={newTable.table_number}
                      onChange={(e) => setNewTable({...newTable, table_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                    <select
                      value={newTable.capacity}
                      onChange={(e) => setNewTable({...newTable, capacity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[2, 4, 6, 8, 10, 12].map(num => (
                        <option key={num} value={num}>{num} guests</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Table Type</label>
                  <select
                    value={newTable.type}
                    onChange={(e) => setNewTable({...newTable, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {tableTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Spend ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTable.min_spend}
                    onChange={(e) => setNewTable({...newTable, min_spend: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newTable.description}
                    onChange={(e) => setNewTable({...newTable, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the table's ambiance and special features..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features (comma separated)</label>
                  <input
                    type="text"
                    value={newTable.features}
                    onChange={(e) => setNewTable({...newTable, features: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="WiFi, Window view, Power outlet..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Table
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Table {editingTable.table_number}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateTable(editingTable.id, {
                  table_number: parseInt(editingTable.table_number),
                  capacity: editingTable.capacity,
                  type: editingTable.type,
                  min_spend: parseFloat(editingTable.min_spend),
                  description: editingTable.description,
                  features: editingTable.features,
                  status: editingTable.status
                });
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                    <input
                      type="number"
                      min="1"
                      value={editingTable.table_number}
                      onChange={(e) => setEditingTable({...editingTable, table_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                    <select
                      value={editingTable.capacity}
                      onChange={(e) => setEditingTable({...editingTable, capacity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[2, 4, 6, 8, 10, 12].map(num => (
                        <option key={num} value={num}>{num} guests</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Table Type</label>
                  <select
                    value={editingTable.type}
                    onChange={(e) => setEditingTable({...editingTable, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {tableTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingTable.status}
                    onChange={(e) => setEditingTable({...editingTable, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Spend ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingTable.min_spend}
                    onChange={(e) => setEditingTable({...editingTable, min_spend: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editingTable.description || ''}
                    onChange={(e) => setEditingTable({...editingTable, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <input
                    type="text"
                    value={editingTable.features || ''}
                    onChange={(e) => setEditingTable({...editingTable, features: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="WiFi, Window view, Power outlet..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingTable(null)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Table
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {showImageModal && selectedTable && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Images - Table {selectedTable.table_number}
                </h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Image Upload */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Upload New Images</h4>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={uploadingImages}
                  />
                  {uploadingImages && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select multiple images. The first image will be used as the thumbnail.
                </p>
              </div>

              {/* Image Gallery */}
              {tableImages.length > 0 ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Table Images ({tableImages.length})</h4>
                  
                  {/* Main Image Viewer */}
                  <div className="relative mb-4">
                    <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={`http://localhost:5000${tableImages[currentImageIndex]?.image_path}`}
                        alt={`Table ${selectedTable.table_number} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {tableImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 p-2 rounded-full shadow-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 p-2 rounded-full shadow-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    
                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {tableImages.length}
                    </div>
                    
                    {tableImages[currentImageIndex]?.is_primary && (
                      <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Primary</span>
                      </div>
                    )}
                  </div>

                  {/* Image Actions */}
                  <div className="flex justify-center space-x-3 mb-6">
                    {!tableImages[currentImageIndex]?.is_primary && (
                      <button
                        onClick={() => handleSetPrimaryImage(tableImages[currentImageIndex].id)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
                      >
                        <Star className="w-4 h-4" />
                        <span>Set as Primary</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteImage(tableImages[currentImageIndex].id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Image</span>
                    </button>
                  </div>

                  {/* Thumbnail Grid */}
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {tableImages.map((image, index) => (
                      <div
                        key={image.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={`http://localhost:5000${image.image_path}`}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-16 object-cover"
                        />
                        {image.is_primary && (
                          <div className="absolute top-1 right-1 bg-yellow-500 text-white p-1 rounded-full">
                            <Star className="w-2 h-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Images</h4>
                  <p className="text-gray-500">Upload images to showcase this table to customers</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTables;