import React from 'react';
import { PredictionResult } from '../types';

interface PredictionResultsProps {
  prediction: PredictionResult;
  onClose: () => void;
}

const PredictionResults: React.FC<PredictionResultsProps> = ({ prediction, onClose }) => {
  const getSuitabilityColor = (suitable: boolean) => {
    return suitable ? 'text-green-600' : 'text-red-600';
  };

  const getSuitabilityBg = (suitable: boolean) => {
    return suitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const getWaterLevelColor = (level: number) => {
    if (level > 20) return 'text-green-600';
    if (level > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Groundwater Prediction Results
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Location Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-1">Location</h4>
          <p className="text-sm text-gray-600">
            Lat: {prediction.location.latitude.toFixed(6)}, 
            Lng: {prediction.location.longitude.toFixed(6)}
          </p>
        </div>

        {/* Current Water Level */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-700 mb-1">Current Water Level</h4>
          <p className={`text-xl font-semibold ${getWaterLevelColor(prediction.currentWaterLevel)}`}>
            {prediction.currentWaterLevel.toFixed(2)} meters
          </p>
        </div>

        {/* Future Prediction */}
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <h4 className="font-medium text-gray-700 mb-1">Predicted Water Level (Next 6 Months)</h4>
          <p className={`text-xl font-semibold ${getWaterLevelColor(prediction.futureWaterLevel)}`}>
            {prediction.futureWaterLevel.toFixed(2)} meters
          </p>
        </div>

        {/* Suitability for Borewell */}
        <div className={`p-3 rounded-lg border ${getSuitabilityBg(prediction.isSuitableForBorewell)}`}>
          <h4 className="font-medium text-gray-700 mb-1">Borewell Suitability</h4>
          <p className={`text-lg font-semibold ${getSuitabilityColor(prediction.isSuitableForBorewell)}`}>
            {prediction.isSuitableForBorewell ? '✓ Suitable' : '✗ Not Suitable'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Confidence: {(prediction.confidence * 100).toFixed(1)}%
          </p>
        </div>

        {/* Monthly Predictions */}
        {prediction.monthlyPredictions && prediction.monthlyPredictions.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Monthly Predictions</h4>
            <div className="space-y-1">
              {prediction.monthlyPredictions.slice(0, 6).map((monthPred, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{monthPred.month}</span>
                  <span className={`font-medium ${getWaterLevelColor(monthPred.predictedLevel)}`}>
                    {monthPred.predictedLevel.toFixed(2)}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {prediction.recommendations && prediction.recommendations.length > 0 && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-gray-700 mb-2">Recommendations</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {prediction.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PredictionResults;
