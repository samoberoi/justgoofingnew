import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Navigation, Clock, MapPin } from 'lucide-react';

interface RiderTrackerProps {
  orderId: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  orderStatus: string;
}

interface RiderLocation {
  lat: number;
  lng: number;
  created_at: string;
}

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RiderTracker = ({ orderId, deliveryLat, deliveryLng, orderStatus }: RiderTrackerProps) => {
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  // Only show when picked_up or out_for_delivery
  const isTracking = orderStatus === 'picked_up' || orderStatus === 'out_for_delivery';

  // Fetch delivery assignment for this order
  useEffect(() => {
    if (!isTracking) return;
    supabase
      .from('delivery_assignments')
      .select('id')
      .eq('order_id', orderId)
      .in('status', ['picked_up', 'out_for_delivery'])
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setAssignmentId(data[0].id);
      });
  }, [orderId, isTracking]);

  // Poll rider location every 2 minutes + subscribe to realtime
  useEffect(() => {
    if (!assignmentId || !isTracking) return;

    const fetchLatest = async () => {
      const { data } = await (supabase
        .from('rider_locations' as any)
        .select('lat, lng, created_at')
        .eq('delivery_assignment_id', assignmentId)
        .order('created_at', { ascending: false })
        .limit(1) as any);
      if (data?.[0]) {
        setRiderLocation(data[0] as RiderLocation);
      }
    };

    fetchLatest();
    const pollInterval = setInterval(fetchLatest, 120000);

    // Also listen for realtime inserts
    const channel = supabase
      .channel(`rider-loc-${assignmentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rider_locations',
        filter: `delivery_assignment_id=eq.${assignmentId}`,
      }, (payload: any) => {
        setRiderLocation({
          lat: payload.new.lat,
          lng: payload.new.lng,
          created_at: payload.new.created_at,
        });
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [assignmentId, isTracking]);

  // Calculate progress and ETA when location updates
  useEffect(() => {
    if (!riderLocation || !deliveryLat || !deliveryLng) return;

    const distToDestination = haversineDistance(riderLocation.lat, riderLocation.lng, deliveryLat, deliveryLng);

    // Store initial distance on first location update
    if (initialDistance === null) {
      setInitialDistance(Math.max(distToDestination, 0.5)); // min 0.5km to avoid division issues
    }

    const base = initialDistance || Math.max(distToDestination, 0.5);
    const prog = Math.min(1, Math.max(0, 1 - distToDestination / base));
    setProgress(prog);

    // ETA: assume avg speed 20 km/h in city
    const etaMinutes = Math.max(1, Math.round((distToDestination / 20) * 60));
    setEta(etaMinutes);
  }, [riderLocation, deliveryLat, deliveryLng, initialDistance]);

  if (!isTracking) return null;

  const hasLocation = !!riderLocation;
  const distKm = riderLocation && deliveryLat && deliveryLng
    ? haversineDistance(riderLocation.lat, riderLocation.lng, deliveryLat, deliveryLng)
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mx-4 mt-4"
      >
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-secondary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-3 h-3 bg-green-500 rounded-full"
                />
                <span className="font-heading text-sm text-foreground">Rider is on the way</span>
              </div>
              {eta && (
                <div className="flex items-center gap-1 bg-secondary/15 px-3 py-1 rounded-full">
                  <Clock size={12} className="text-secondary" />
                  <span className="text-xs font-heading text-secondary">{eta} min</span>
                </div>
              )}
            </div>
          </div>

          {/* Animated path visualization */}
          <div className="px-4 py-5">
            {/* Route line */}
            <div className="relative flex items-center gap-3">
              {/* Start: Restaurant */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-lg">
                  🏪
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">Store</span>
              </div>

              {/* Animated progress bar */}
              <div className="flex-1 relative h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary to-secondary/70 rounded-full"
                  initial={{ width: '5%' }}
                  animate={{ width: `${Math.max(5, progress * 100)}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
                {/* Rider icon on the progress bar */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 text-xl"
                  initial={{ left: '2%' }}
                  animate={{ left: `${Math.max(2, Math.min(progress * 100 - 3, 92))}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                >
                  🛵
                </motion.div>
              </div>

              {/* End: Customer */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-lg">
                  🏠
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">You</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              {hasLocation ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <Navigation size={12} className="text-secondary" />
                    <span className="text-xs text-muted-foreground">
                      {distKm !== null ? (distKm < 1 ? `${Math.round(distKm * 1000)}m away` : `${distKm.toFixed(1)} km away`) : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-secondary" />
                    <span className="text-xs text-muted-foreground">
                      Updated {new Date(riderLocation!.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full justify-center">
                  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground">Waiting for rider location...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RiderTracker;
