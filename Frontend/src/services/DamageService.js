import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const DamageService = {
  /**
   * Upload image and severity to backend for analysis
   * @param {File} file 
   * @param {string} severity 
   * @returns {Promise<Object>} Analysis results
   */
  analyzeClaim: async (file, severity = 'Major Damage') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('incident_severity', severity);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze-claim`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error analyzing claim:", error);
      throw error;
    }
  }
};
