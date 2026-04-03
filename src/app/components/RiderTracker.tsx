import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Navigation, Clock, MapPin } from 'lucide-react';

interface RiderTrackerProps {
  orderId: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  orderStatus: string;
  pickedUpAt?: string | null;
  outForDeliveryAt?: string | null;
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

const RiderTracker = ({ orderId, deliveryLat, deliveryLng, orderStatus, pickedUpAt, outForDeliveryAt }: RiderTrackerProps) => {
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [tickProgress, setTickProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTracking = orderStatus === 'picked_up' || orderStatus === 'out_for_delivery';

  // Estimate how far along the rider is based on elapsed time since pickup
  // Assume typical delivery takes ~20 minutes
  const ESTIMATED_DELIVERY_MINS = 20;

  const getTimeBasedProgress = () => {
    const startTime = outForDeliveryAt || pickedUpAt;
    if (!startTime) return 0.1;
    const elapsedMs = Date.now() - new Date(startTime).getTime();
    const elapsedMins = elapsedMs / 60000;
    // Cap at 90% — we never show 100% until delivered
    return Math.min(0.9, Math.max(0.08, elapsedMins / ESTIMATED_DELIVERY_MINS));
  };

  const getTimeBasedEta = () => {
    const startTime = outForDeliveryAt || pickedUpAt;
    if (!startTime) return ESTIMATED_DELIVERY_MINS;
    const elapsedMs = Date.now() - new Date(startTime).getTime();
    const elapsedMins = elapsedMs / 60000;
    return Math.max(1, Math.round(ESTIMATED_DELIVERY_MINS - elapsedMins));
  };

  // Smooth tick-based progress animation
  useEffect(() => {
    if (!isTracking) return;
    
    const update = () => setTickProgress(getTimeBasedProgress());
    update();
    tickRef.current = setInterval(update, 30000); // update every 30s
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isTracking, pickedUpAt, outForDeliveryAt]);

  // Fetch delivery assignment
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

  // Poll + realtime for actual rider GPS
  useEffect(() => {
    if (!assignmentId || !isTracking) return;

    const fetchLatest = async () => {
      const { data } = await (supabase
        .from('rider_locations' as any)
        .select('lat, lng, created_at')
        .eq('delivery_assignment_id', assignmentId)
        .order('created_at', { ascending: false })
        .limit(1) as any);
      if (data?.[0]) setRiderLocation(data[0] as RiderLocation);
    };

    fetchLatest();
    const pollInterval = setInterval(fetchLatest, 120000);

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

  // When we have real GPS + delivery coords, compute real distance
  useEffect(() => {
    if (!riderLocation || !deliveryLat || !deliveryLng) return;
    const dist = haversineDistance(riderLocation.lat, riderLocation.lng, deliveryLat, deliveryLng);
    if (initialDistance === null) setInitialDistance(Math.max(dist, 0.5));
  }, [riderLocation, deliveryLat, deliveryLng, initialDistance]);

  if (!isTracking) return null;

  // Use real GPS progress if available, else time-based
  let progress = tickProgress;
  let eta = getTimeBasedEta();
  let distKm: number | null = null;
  const hasRealLocation = !!riderLocation && !!deliveryLat && !!deliveryLng;

  if (hasRealLocation) {
    distKm = haversineDistance(riderLocation!.lat, riderLocation!.lng, deliveryLat!, deliveryLng!);
    const base = initialDistance || Math.max(distKm, 0.5);
    progress = Math.min(0.95, Math.max(0.05, 1 - distKm / base));
    eta = Math.max(1, Math.round((distKm / 20) * 60));
  }

  const riderLeft = Math.max(2, Math.min(progress * 100 - 2, 90));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4"
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-secondary/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="font-heading text-sm text-foreground">
              {orderStatus === 'out_for_delivery' ? 'Rider is on the way!' : 'Order picked up'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/15 px-3 py-1.5 rounded-full">
            <Clock size={13} className="text-secondary" />
            <span className="text-xs font-heading text-secondary">~{eta} min</span>
          </div>
        </div>

        {/* Animated route */}
        <div className="px-5 py-6">
          <div className="relative flex items-center gap-4">
            {/* Store */}
            <div className="flex flex-col items-center shrink-0 z-10">
              <div className="w-11 h-11 rounded-full bg-secondary/20 border-2 border-secondary/30 flex items-center justify-center text-lg">
                🏪
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">Store</span>
            </div>

            {/* Track */}
            <div className="flex-1 relative">
              {/* Background track */}
              <div className="h-2 bg-muted/60 rounded-full" />
              {/* Filled track */}
              <motion.div
                className="absolute inset-y-0 left-0 h-2 rounded-full bg-gradient-to-r from-secondary via-secondary/80 to-secondary/60"
                initial={{ width: '5%' }}
                animate={{ width: `${Math.max(5, progress * 100)}%` }}
                transition={{ duration: 2, ease: 'easeOut' }}
              />
              {/* Dashed unfilled portion hint */}
              <div className="absolute inset-y-0 right-0 h-2 flex items-center">
                <div className="border-t border-dashed border-muted-foreground/20 flex-1" />
              </div>
              {/* Rider emoji */}
              <motion.div
                className="absolute -top-3.5 text-2xl drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                initial={{ left: '2%' }}
                animate={{ left: `${riderLeft}%` }}
                transition={{ duration: 2, ease: 'easeOut' }}
              >
                🛵
              </motion.div>
            </div>

            {/* Customer */}
            <div className="flex flex-col items-center shrink-0 z-10">
              <div className="w-11 h-11 rounded-full bg-secondary/20 border-2 border-secondary/30 flex items-center justify-center text-lg">
                📍
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">You</span>
            </div>
          </div>

          {/* Info bar */}
          <div className="flex items-center justify-between mt-5 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Navigation size={13} className="text-secondary" />
              <span className="text-xs text-muted-foreground">
                {hasRealLocation && distKm !== null
                  ? (distKm < 1 ? `${Math.round(distKm * 1000)}m away` : `${distKm.toFixed(1)} km away`)
                  : `~${eta} min away`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-secondary" />
              <span className="text-xs text-muted-foreground">
                {riderLocation
                  ? `GPS ${new Date(riderLocation.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Live tracking'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RiderTracker;
