import api from './api';
import { PredictionRequest, PredictionResult, PredictionResponse } from '../types';

class PredictionService {
  async predictGroundwaterLevel(request: PredictionRequest): Promise<PredictionResponse> {
    try {
      const response = await api.post('/prediction/groundwater', request);
      return response.data;
    } catch (error: any) {
      console.error('Prediction service error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to predict groundwater level'
      };
    }
  }
}

export const predictionService = new PredictionService();
