import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { borewellService } from '../services/borewellService';
import { weatherService } from '../services/weatherService';
import { Borewell, WeatherData, WaterLevelPrediction } from '../types';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [borewells, setBorewells] = useState<Borewell[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [waterPrediction, setWaterPrediction] = useState<WaterLevelPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user's borewells
      const borewellResponse = await borewellService.getMyBorewells();
      if (borewellResponse.success && borewellResponse.data) {
        setBorewells(borewellResponse.data);
      }

      // Get user's location and fetch weather
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Fetch weather
            const weatherData = await weatherService.getCurrentWeather(latitude, longitude);
            if (weatherData) {
              setWeather(weatherData);
              
              // Predict water level
              const prediction = await weatherService.predictWaterLevel(
                weatherData.temperature,
                weatherData.precipitation?.rain_1h || 0,
                weatherData.humidity,
                weatherData.pressure
              );
              setWaterPrediction(prediction);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast.error('Unable to get your location for weather data');
          }
        );
      }
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your groundwater management overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Borewells</p>
                <p className="text-2xl font-bold text-gray-900">{borewells.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Wells</p>
                <p className="text-2xl font-bold text-gray-900">
                  {borewells.filter(b => b.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Temperature</p>
                <p className="text-2xl font-bold text-gray-900">
                  {weather ? `${weather.temperature}°C` : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Predicted Level</p>
                <p className="text-2xl font-bold text-gray-900">
                  {waterPrediction ? `${waterPrediction.waterLevel}ft` : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weather and Prediction Section */}
        {weather && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Weather</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{weather.temperature}°C</p>
                  <p className="text-gray-600 capitalize">{weather.description}</p>
                  <p className="text-sm text-gray-500">{weather.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Humidity: {weather.humidity}%</p>
                  <p className="text-sm text-gray-600">Pressure: {weather.pressure} hPa</p>
                  <p className="text-sm text-gray-600">Wind: {weather.windSpeed} m/s</p>
                </div>
              </div>
            </div>

            {waterPrediction && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Water Level Prediction</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">
                      {waterPrediction.waterLevel} {waterPrediction.unit}
                    </p>
                    <p className="text-gray-600">Confidence: {Math.round(waterPrediction.confidence * 100)}%</p>
                    <p className="text-sm text-gray-500">Method: {waterPrediction.method}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>Based on:</p>
                    <p>• Temperature: {waterPrediction.factors.temperature}°C</p>
                    <p>• Precipitation: {waterPrediction.factors.precipitation}mm</p>
                    <p>• Humidity: {waterPrediction.factors.humidity}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Borewells */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Your Borewells</h2>
            <Link
              to="/map"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Add New Borewell
            </Link>
          </div>
          
          {borewells.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 mb-4">You haven't registered any borewells yet.</p>
              <Link
                to="/map"
                className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Register Your First Borewell
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Depth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {borewells.slice(0, 5).map((borewell) => (
                    <tr key={borewell.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {borewell.location.address || `${borewell.location.latitude.toFixed(4)}, ${borewell.location.longitude.toFixed(4)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {borewell.wellType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {borewell.exactDepth}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          borewell.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : borewell.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {borewell.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {borewell.createdAt ? new Date(borewell.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
