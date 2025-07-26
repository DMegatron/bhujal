import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { borewellService } from '../services/borewellService';
import { Borewell, BorewellFormData } from '../types';
import toast from 'react-hot-toast';

// Fix for default markers in react-leaflet
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapPage: React.FC = () => {
  const [borewells, setBorewells] = useState<Borewell[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([28.6139, 77.2090]); // Default to Delhi
  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserLocation();
    loadBorewells();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get your location. Using default location.');
        }
      );
    }
  };

  const loadBorewells = async () => {
    try {
      const response = await borewellService.getAllBorewells();
      if (response.success && response.data) {
        setBorewells(response.data);
      }
    } catch (error) {
      console.error('Failed to load borewells:', error);
      toast.error('Failed to load borewell data');
    } finally {
      setLoading(false);
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setShowForm(true);
      },
    });
    return null;
  };

  const handleSubmitBorewell = async (formData: BorewellFormData) => {
    try {
      const response = await borewellService.registerBorewell(formData);
      if (response.success) {
        toast.success('Borewell registered successfully!');
        setShowForm(false);
        setSelectedLocation(null);
        loadBorewells(); // Reload borewells
      } else {
        toast.error(response.message || 'Failed to register borewell');
      }
    } catch (error) {
      toast.error('Failed to register borewell');
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
    <div className="h-screen flex">
      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler />
          
          {/* User Location Marker */}
          <Marker position={userLocation} icon={defaultIcon}>
            <Popup>Your current location</Popup>
          </Marker>
          
          {/* Borewell Markers */}
          {borewells.map((borewell) => (
            <Marker
              key={borewell.id}
              position={[borewell.location.latitude, borewell.location.longitude]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{borewell.customer.name}'s Borewell</h3>
                  <p><strong>Type:</strong> {borewell.wellType}</p>
                  <p><strong>Depth:</strong> {borewell.exactDepth}m</p>
                  <p><strong>Status:</strong> {borewell.status}</p>
                  <p><strong>Phone:</strong> {borewell.customer.phoneNumber}</p>
                  {borewell.description && (
                    <p><strong>Description:</strong> {borewell.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Selected Location Marker */}
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={defaultIcon}>
              <Popup>Click location for new borewell</Popup>
            </Marker>
          )}
        </MapContainer>
        
        {/* Instructions */}
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-1000 max-w-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Interactive Map</h3>
          <p className="text-sm text-gray-600 mb-2">
            • View existing borewells on the map
          </p>
          <p className="text-sm text-gray-600 mb-2">
            • Click anywhere to register a new borewell
          </p>
          <p className="text-sm text-gray-600">
            • Click on markers to see details
          </p>
        </div>
      </div>
      
      {/* Borewell Registration Form */}
      {showForm && selectedLocation && (
        <div className="w-96 bg-white shadow-xl p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Register New Borewell</h2>
          <BorewellForm
            location={selectedLocation}
            onSubmit={handleSubmitBorewell}
            onCancel={() => {
              setShowForm(false);
              setSelectedLocation(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

// Borewell Registration Form Component
interface BorewellFormProps {
  location: { lat: number; lng: number };
  onSubmit: (data: BorewellFormData) => void;
  onCancel: () => void;
}

const BorewellForm: React.FC<BorewellFormProps> = ({ location, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<BorewellFormData>({
    latitude: location.lat,
    longitude: location.lng,
    wellType: 'dug-well',
    depthType: '',
    exactDepth: 0,
    motorOperated: false,
    authoritiesAware: false,
    isPublic: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
               : type === 'number' ? Number(value) 
               : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <p className="text-sm text-gray-500">
          Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Well Type</label>
        <select
          name="wellType"
          value={formData.wellType}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="dug-well">Dug Well</option>
          <option value="drilled-well">Drilled Well</option>
          <option value="tube-well">Tube Well</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Depth Type</label>
        <input
          type="text"
          name="depthType"
          value={formData.depthType}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Shallow, Deep, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Exact Depth (meters)</label>
        <input
          type="number"
          name="exactDepth"
          value={formData.exactDepth}
          onChange={handleChange}
          min="0"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="motorOperated"
            checked={formData.motorOperated}
            onChange={handleChange}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">Motor Operated</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="authoritiesAware"
            checked={formData.authoritiesAware}
            onChange={handleChange}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">Authorities Aware</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">Make Public</span>
        </label>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Register Borewell
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default MapPage;
