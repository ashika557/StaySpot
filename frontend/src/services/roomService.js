import { API_BASE_URL } from '../constants/api';

const getRoomEndpoint = () => `${API_BASE_URL}/rooms/`;

// Helper function to get CSRF token
const getCSRFToken = () => {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name + '=')) {
      return trimmed.substring(name.length + 1);
    }
  }
  return null;
};

export const roomService = {
  // Get all rooms
  async getAllRooms() {
    const response = await fetch(getRoomEndpoint(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    
    return response.json();
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
    
    // Add new fields: gender preference and map location
    formData.append('gender_preference', roomData.genderPreference || 'Any');
    formData.append('latitude', roomData.latitude || '');
    formData.append('longitude', roomData.longitude || '');
    
    // Add images if any
    if (roomData.images && roomData.images.length > 0) {
      roomData.images.forEach(image => {
        formData.append('uploaded_images', image);
      });
    }

    const response = await fetch(getRoomEndpoint(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': getCSRFToken(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create room');
    }

    return response.json();
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
    
    // Add new fields: gender preference and map location
    formData.append('gender_preference', roomData.genderPreference || 'Any');
    formData.append('latitude', roomData.latitude || '');
    formData.append('longitude', roomData.longitude || '');
    
    // Add new images if any
    if (roomData.images && roomData.images.length > 0) {
      roomData.images.forEach(image => {
        formData.append('uploaded_images', image);
      });
    }

    const response = await fetch(`${getRoomEndpoint()}${id}/`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'X-CSRFToken': getCSRFToken(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update room');
    }

    return response.json();
  },

  // Delete room
  async deleteRoom(id) {
    const response = await fetch(`${getRoomEndpoint()}${id}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'X-CSRFToken': getCSRFToken(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete room');
    }

    return true;
  },

  // Delete specific image
  async deleteImage(roomId, imageId) {
    const response = await fetch(`${getRoomEndpoint()}${roomId}/images/${imageId}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'X-CSRFToken': getCSRFToken(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }

    return true;
  },
};