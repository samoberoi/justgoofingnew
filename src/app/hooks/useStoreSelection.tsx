import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Store {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  delivery_radius: number | null;
  is_active: boolean;
}

interface StoreSelectionState {
  selectedStore: Store | null;
  outOfArea: boolean;
  locationLoading: boolean;
  locationError: string | null;
}

const StoreSelectionContext = createContext<StoreSelectionState>({
  selectedStore: null,
  outOfArea: false,
  locationLoading: true,
  locationError: null,
});

export const useStoreSelection = () => useContext(StoreSelectionContext);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const StoreSelectionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [outOfArea, setOutOfArea] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const detect = async () => {
      // 1. Fetch all active stores
      const { data: stores } = await supabase
        .from('stores')
        .select('id, name, latitude, longitude, delivery_radius, is_active')
        .eq('is_active', true);

      if (!stores || stores.length === 0) {
        setOutOfArea(true);
        setLocationLoading(false);
        return;
      }

      // 2. Get user location
      if (!navigator.geolocation) {
        // Fallback: pick the first store if geolocation unavailable
        setSelectedStore(stores[0] as Store);
        setLocationLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;

          // 3. Find nearest store within its delivery radius
          let nearest: Store | null = null;
          let nearestDist = Infinity;

          for (const store of stores) {
            if (store.latitude == null || store.longitude == null) continue;
            const dist = haversineKm(userLat, userLng, Number(store.latitude), Number(store.longitude));
            const radius = Number(store.delivery_radius) || 5;
            if (dist <= radius && dist < nearestDist) {
              nearest = store as Store;
              nearestDist = dist;
            }
          }

          if (nearest) {
            setSelectedStore(nearest);
            setOutOfArea(false);
          } else {
            setOutOfArea(true);
          }
          setLocationLoading(false);
        },
        (err) => {
          // Permission denied or error — fallback to first store
          console.warn('Geolocation error:', err.message);
          setLocationError(err.message);
          setSelectedStore(stores[0] as Store);
          setLocationLoading(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    };

    detect();
  }, []);

  return (
    <StoreSelectionContext.Provider value={{ selectedStore, outOfArea, locationLoading, locationError }}>
      {children}
    </StoreSelectionContext.Provider>
  );
};
