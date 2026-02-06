import { apiRequest } from '../utils/api';

export const roomService = {
  // Get all rooms with optional filters
  async getAllRooms(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/rooms/${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiRequest(endpoint);
      if (!response.ok) throw new Error('Failed to fetch rooms');
      return await response.json();
    } catch (error) {
      console.error('Error in getAllRooms:', error);
      throw error;
    }
  },

  // Get room by ID
  async getRoomById(id) {
    try {
      const response = await apiRequest(`/rooms/${id}/`);
      if (!response.ok) throw new Error('Failed to fetch room');
      return await response.json();
    } catch (error) {
      console.error('Error in getRoomById:', error);
      throw error;
    }
  },

  // Get suggested rooms based on user preferences
  async getSuggestedRooms() {
    try {
      const response = await apiRequest('/rooms/suggested/');
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return await response.json();
    } catch (error) {
      console.error('Error in getSuggestedRooms:', error);
      throw error;
    }
  },

  // Create new room
  async createRoom(roomData) {
    const formData = new FormData();

    // Add room fields
    formData.append('title', roomData.title);
    formData.append('location', roomData.location);
    formData.append('price', roomData.price);
    formData.append('room_number', roomData.roomNumber || '');
    formData.append('room_type', roomData.roomType);
    formData.append('floor', roomData.floor || '');
    formData.append('size', roomData.size || '');
    formData.append('status', roomData.status);
    formData.append('wifi', roomData.wifi);
    formData.append('ac', roomData.ac);
    formData.append('tv', roomData.tv);
    formData.append('parking', roomData.parking);
    formData.append('water_supply', roomData.waterSupply);
    formData.append('attached_bathroom', roomData.attachedBathroom);
    formData.append('cctv', roomData.cctv);
    formData.append('kitchen', roomData.kitchen);
    formData.append('furniture', roomData.furniture);

    // Add new fields: gender preference and map location
    formData.append('gender_preference', roomData.genderPreference || 'Any');

    // Only append coordinates if they have values to avoid conversion errors on backend
    if (roomData.latitude !== undefined && roomData.latitude !== null && roomData.latitude !== '') {
      formData.append('latitude', parseFloat(roomData.latitude).toFixed(6));
    }
    if (roomData.longitude !== undefined && roomData.longitude !== null && roomData.longitude !== '') {
      formData.append('longitude', parseFloat(roomData.longitude).toFixed(6));
    }

    // Add images if any
    if (roomData.images && roomData.images.length > 0) {
      roomData.images.forEach(image => {
        formData.append('uploaded_images', image);
      });
    }

    try {
      const response = await apiRequest('/rooms/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Bubble up the first field error if present
        const fieldError = Object.values(errorData)[0];
        const errorMessage = Array.isArray(fieldError) ? fieldError[0] : (errorData.detail || 'Failed to create room');
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in createRoom:', error);
      throw error;
    }
  },

  // Update room
  async updateRoom(id, roomData) {
    const formData = new FormData();

    formData.append('title', roomData.title);
    formData.append('location', roomData.location);
    formData.append('price', roomData.price);
    formData.append('room_number', roomData.roomNumber || '');
    formData.append('room_type', roomData.roomType);
    formData.append('floor', roomData.floor || '');
    formData.append('size', roomData.size || '');
    formData.append('status', roomData.status);
    formData.append('wifi', roomData.wifi);
    formData.append('ac', roomData.ac);
    formData.append('tv', roomData.tv);
    formData.append('parking', roomData.parking);
    formData.append('water_supply', roomData.waterSupply);
    formData.append('attached_bathroom', roomData.attachedBathroom);
    formData.append('cctv', roomData.cctv);
    formData.append('kitchen', roomData.kitchen);
    formData.append('furniture', roomData.furniture);

    // Add new fields: gender preference and map location
    formData.append('gender_preference', roomData.genderPreference || 'Any');

    // Only append coordinates if they have values to avoid conversion errors on backend
    if (roomData.latitude !== undefined && roomData.latitude !== null && roomData.latitude !== '') {
      formData.append('latitude', parseFloat(roomData.latitude).toFixed(6));
    }
    if (roomData.longitude !== undefined && roomData.longitude !== null && roomData.longitude !== '') {
      formData.append('longitude', parseFloat(roomData.longitude).toFixed(6));
    }

    // Add new images if any
    if (roomData.images && roomData.images.length > 0) {
      roomData.images.forEach(image => {
        formData.append('uploaded_images', image);
      });
    }

    try {
      const response = await apiRequest(`/rooms/${id}/`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Bubble up the first field error if present
        const fieldError = Object.values(errorData)[0];
        const errorMessage = Array.isArray(fieldError) ? fieldError[0] : (errorData.detail || 'Failed to update room');
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in updateRoom:', error);
      throw error;
    }
  },

  // Delete room
  async deleteRoom(id) {
    try {
      const response = await apiRequest(`/rooms/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete room');
      return true;
    } catch (error) {
      console.error('Error in deleteRoom:', error);
      throw error;
    }
  },

  // Delete specific image
  async deleteImage(roomId, imageId) {
    try {
      const response = await apiRequest(`/rooms/${roomId}/images/${imageId}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete image');
      return true;
    } catch (error) {
      console.error('Error in deleteImage:', error);
      throw error;
    }
  },

  getRoomReviews: async (roomId) => {
    try {
      const response = await apiRequest(`/rooms/${roomId}/reviews/`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return await response.json();
    } catch (error) {
      console.error('Error in getRoomReviews:', error);
      throw error;
    }
  },

  addRoomReview: async (reviewData) => {
    try {
      const response = await apiRequest('/reviews/', {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });
      if (!response.ok) {
        let errorMsg = 'Failed to post review';
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData)) {
            errorMsg = errorData[0];
          } else if (typeof errorData === 'object') {
            errorMsg = errorData.detail || errorData.non_field_errors?.[0] || Object.values(errorData)[0];
          }
        } catch (e) { }
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in addRoomReview:', error);
      throw error;
    }
  },

  updateRoomReview: async (reviewId, reviewData) => {
    try {
      const response = await apiRequest(`/reviews/${reviewId}/`, {
        method: 'PUT',
        body: JSON.stringify(reviewData)
      });
      if (!response.ok) {
        let errorMsg = 'Failed to update review';
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || Object.values(errorData)[0];
        } catch (e) { }
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in updateRoomReview:', error);
      throw error;
    }
  },

  deleteRoomReview: async (reviewId) => {
    try {
      const response = await apiRequest(`/reviews/${reviewId}/`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete review');
      return true;
    } catch (error) {
      console.error('Error in deleteRoomReview:', error);
      throw error;
    }
  }
};