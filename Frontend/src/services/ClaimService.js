import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const ClaimService = {
  /**
   * Predict claim amount using trained ML model
   * @param {Object} formData - All claim form fields
   * @returns {Promise<Object>} { predicted_amount, feature_importance }
   */
  predictClaim: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/predict-claim`, formData, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error predicting claim:', error);
      throw error;
    }
  },
};
