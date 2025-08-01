export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Borewell {
  id: string;
  location: Location;
  wellType: 'dug-well' | 'drilled-well' | 'tube-well' | 'other';
  depthType: string;
  wallType?: string;
  supplySystem?: string;
  exactDepth: number;
  motorOperated: boolean;
  authoritiesAware: boolean;
  description?: string;
  waterLevel?: {
    current?: number;
    predicted?: number;
    lastUpdated?: string;
  };
  status: 'active' | 'inactive' | 'maintenance' | 'dry';
  isPublic: boolean;
  customer: {
    name: string;
    phoneNumber: string;
    email: string;
    address?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  description: string;
  icon: string;
  windSpeed: number;
  windDirection: number;
  cloudiness: number;
  visibility: number;
  precipitation?: {
    rain_1h?: number;
    rain_3h?: number;
    snow_1h?: number;
    snow_3h?: number;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
}

export interface WaterLevelPrediction {
  waterLevel: number;
  unit: string;
  confidence: number;
  factors: {
    temperature: number;
    precipitation: number;
    humidity: number;
    pressure: number;
  };
  timestamp: string;
  method: 'ml_model' | 'simple_algorithm';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export interface BorewellFormData {
  latitude: number;
  longitude: number;
  address?: string;
  wellType: 'dug-well' | 'drilled-well' | 'tube-well' | 'other';
  depthType: string;
  wallType?: string;
  supplySystem?: string;
  exactDepth?: number;
  motorOperated?: boolean;
  authoritiesAware?: boolean;
  description?: string;
  isPublic?: boolean;
}

export interface PredictionRequest {
  latitude: number;
  longitude: number;
}

export interface SeasonalPattern {
  month: string;
  monthNumber: number;
  waterLevel: number;
  relativeLevel: number;
  status: string;
  description: string;
}

export interface SeasonalAnalysis {
  regionType: string;
  climateZone: string;
  seasonalPatterns: SeasonalPattern[];
  criticalMonths: string[];
  rechargePeriod: {
    months: string[];
    description: string;
  };
  stressedPeriod: {
    months: string[];
    description: string;
  };
}

export interface DrillingTimeline {
  urgency: string;
  optimalMonths: number[];
  avoidMonths: number[];
  timeline: Array<{
    month: string;
    monthNumber: number;
    monthsFromNow: number;
    recommendation: string;
    action: string;
    reasoning: string;
  }>;
  reasoning: string;
}

export interface BestDrillingTime {
  month: number;
  monthName: string;
  monthsFromNow: number;
  recommendation: string;
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
  yearlyPredictions: Array<{
    year: string;
    predictedLevel: number;
  }>;
  suitabilityNote: string;
  seasonalAnalysis: SeasonalAnalysis;
  drillingTimeline: DrillingTimeline;
  bestDrillingTime: BestDrillingTime;
  recommendations?: string[];
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
