import api from './api';
import { WeatherData, WaterLevelPrediction } from '../types';

export const weatherService = {
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    try {
      const response = await api.get('/weather/current', {
        params: { lat, lng }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      console.error('Failed to fetch weather data:', error);
      return null;
    }
  },

  async getWeatherForecast(lat: number, lng: number, days: number = 5): Promise<any> {
    try {
      const response = await api.get('/weather/forecast', {
        params: { lat, lng, days }
      });
      
      if (response.data.success) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Failed to fetch weather forecast:', error);
      return null;
    }
  },

  async predictWaterLevel(
    temperature: number,
    precipitation: number,
    humidity?: number,
    pressure?: number
  ): Promise<WaterLevelPrediction | null> {
    try {
      const response = await api.post('/weather/predict-water-level', null, {
        params: {
          temperature,
          precipitation,
          humidity,
          pressure
        }
      });
      
      if (response.data.success) {
        return response.data.prediction;
      }
      return null;
    } catch (error: any) {
      console.error('Failed to predict water level:', error);
      return null;
    }
  }
};
