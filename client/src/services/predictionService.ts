import api from './api';

export interface PredictionRequest {
  latitude: number;
  longitude: number;
}

export interface PredictionResult {
  currentWaterLevel: number;
  futureWaterLevel: number;
  isSuitableForBorewell: boolean;
  confidence: number;
  location: {
    latitude: number;
    longitude: number;
  };
  recommendations: string[];
  monthlyPredictions?: Array<{
    month: string;
    predictedLevel: number;
  }>;
}

export interface PredictionResponse {
  success: boolean;
  data?: PredictionResult;
  message?: string;
}

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
