import { API_ENDPOINTS } from '../constants/api';
import { apiRequest } from '../utils/api';

const complaintService = {
    /**
     * Submit a new complaint
     * @param {FormData|Object} complaintData - The complaint details
     */
    submitComplaint: async (complaintData) => {
        const isFormData = complaintData instanceof FormData;
        const response = await apiRequest(API_ENDPOINTS.COMPLAINTS, {
            method: 'POST',
            body: complaintData,
            headers: isFormData ? {} : { 'Content-Type': 'application/json' },
            isMultipart: isFormData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || error.message || 'Failed to submit complaint');
        }

        return await response.json();
    },

    /**
     * Get all complaints for the current user
     */
    getComplaints: async () => {
        const response = await apiRequest(API_ENDPOINTS.COMPLAINTS);
        if (!response.ok) {
            throw new Error('Failed to fetch complaints');
        }
        return await response.json();
    },

    /**
     * Get a single complaint by ID
     */
    getComplaintById: async (id) => {
        const response = await apiRequest(`${API_ENDPOINTS.COMPLAINTS}${id}/`);
        if (!response.ok) {
            throw new Error('Failed to fetch complaint details');
        }
        return await response.json();
    },

    /**
     * Update an existing complaint
     */
    updateComplaint: async (id, complaintData) => {
        const isFormData = complaintData instanceof FormData;
        const response = await apiRequest(`${API_ENDPOINTS.COMPLAINTS}${id}/`, {
            method: 'PUT',
            body: complaintData,
            headers: isFormData ? {} : { 'Content-Type': 'application/json' },
            isMultipart: isFormData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || error.message || 'Failed to update complaint');
        }

        return await response.json();
    },

    /**
     * Delete a complaint
     */
    deleteComplaint: async (id) => {
        const response = await apiRequest(`${API_ENDPOINTS.COMPLAINTS}${id}/`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete complaint');
        }

        return true;
    }
};

export default complaintService;
