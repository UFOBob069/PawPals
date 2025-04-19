'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaMapMarkerAlt } from 'react-icons/fa';
import 'mapbox-gl/dist/mapbox-gl.css';

// Dynamically import MapGL to avoid SSR issues
const MapGL = dynamic(() => import('react-map-gl').then(mod => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
      <div className="animate-pulse">Loading map...</div>
    </div>
  ),
});

const Marker = dynamic(() => import('react-map-gl').then(mod => mod.Marker), {
  ssr: false,
});

const NavigationControl = dynamic(() => import('react-map-gl').then(mod => mod.NavigationControl), {
  ssr: false,
});

const Popup = dynamic(() => import('react-map-gl').then(mod => mod.Popup), {
  ssr: false,
});

interface ViewState {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface MarkerData {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  description?: string;
  rate?: string;
  rateType?: string;
  serviceType?: string;
  isProvider?: boolean;
}

interface MapComponentProps {
  markers?: MarkerData[];
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
}

const getServiceEmoji = (serviceType: string) => {
  switch (serviceType?.toLowerCase()) {
    case 'walk':
      return '🦮';
    case 'daycare':
      return '🏠';
    case 'boarding':
      return '🛏️';
    default:
      return '🐕';
  }
};

export default function MapComponent({ markers = [], center, zoom = 11 }: MapComponentProps) {
  const [viewState, setViewState] = useState<ViewState>({
    latitude: center?.lat ?? 37.7749,
    longitude: center?.lng ?? -122.4194,
    zoom: zoom,
  });

  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update viewState when center or zoom props change
  useEffect(() => {
    if (center) {
      setViewState(prev => ({
        ...prev,
        latitude: center.lat,
        longitude: center.lng,
        zoom: zoom,
      }));
    }
  }, [center, zoom]);

  // Update viewState when markers change and no center is provided
  useEffect(() => {
    if (!center && markers.length > 0) {
      setViewState(prev => ({
        ...prev,
        latitude: markers[0].position.lat,
        longitude: markers[0].position.lng,
        zoom: markers.length > 1 ? 11 : 13,
      }));
    }
  }, [markers, center]);

  if (!isMounted) {
    return (
      <div className="h-[500px] w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden relative">
      <MapGL
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        reuseMaps
        onClick={() => setSelectedMarker(null)}
      >
        <NavigationControl position="top-right" />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.position.lat}
            longitude={marker.position.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedMarker(marker);
            }}
          >
            <div className="relative cursor-pointer group">
              <div className="relative">
                <FaMapMarkerAlt 
                  className={`text-4xl transform-gpu hover:scale-110 transition-transform duration-200 ${
                    marker.isProvider ? 'text-primary-navy' : 'text-primary-coral'
                  }`}
                  style={{ 
                    filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 ${
                  marker.isProvider ? 'bg-primary-navy/20' : 'bg-white/75'
                } rounded-full flex items-center justify-center text-xs`}>
                  {marker.serviceType && getServiceEmoji(marker.serviceType)}
                </div>
              </div>
              <div 
                className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full 
                           bg-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap 
                           opacity-0 group-hover:opacity-100 transition-all duration-200 
                           border border-gray-100 z-10`}
              >
                <div className="font-medium text-primary-navy">
                  {marker.title}
                </div>
                {marker.rate && (
                  <div className={`text-xs mt-1 ${
                    marker.isProvider ? 'text-primary-navy' : 'text-primary-coral'
                  }`}>
                    ${marker.rate}/{marker.rateType}
                  </div>
                )}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 rotate-45 
                               w-2 h-2 bg-white border-t border-l border-gray-100" />
              </div>
            </div>
          </Marker>
        ))}
        {selectedMarker && (
          <Popup
            latitude={selectedMarker.position.lat}
            longitude={selectedMarker.position.lng}
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, -15]}
            className="rounded-lg overflow-hidden [&>.mapboxgl-popup-content]:p-0 [&>.mapboxgl-popup-close-button]:p-2 [&>.mapboxgl-popup-close-button]:text-lg [&>.mapboxgl-popup-close-button]:text-gray-500 [&>.mapboxgl-popup-close-button]:hover:text-gray-700 [&>.mapboxgl-popup-close-button]:hover:no-underline"
          >
            <div className="p-4 min-w-[200px]">
              <h3 className="font-semibold text-lg text-primary-navy mb-2">
                {selectedMarker.title}
              </h3>
              {selectedMarker.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {selectedMarker.description}
                </p>
              )}
              {selectedMarker.rate && (
                <p className={`font-medium mb-3 ${
                  selectedMarker.isProvider ? 'text-primary-navy' : 'text-primary-coral'
                }`}>
                  ${selectedMarker.rate}/{selectedMarker.rateType}
                </p>
              )}
              <a
                href={selectedMarker.isProvider ? `/providers/${selectedMarker.id}` : `/services/${selectedMarker.id}`}
                className={`block w-full text-center py-2 px-4 rounded-lg 
                           transition-colors duration-200 text-sm font-medium text-white ${
                             selectedMarker.isProvider 
                               ? 'bg-primary-navy hover:bg-primary-navy/90' 
                               : 'bg-primary-coral hover:bg-primary-coral/90'
                           }`}
              >
                View Details
              </a>
            </div>
          </Popup>
        )}
      </MapGL>
    </div>
  );
}