const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  accepted: 'bg-secondary/20 text-secondary border-secondary/30',
  preparing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ready: 'bg-green-500/20 text-green-400 border-green-500/30',
  assigned: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  picked_up: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  out_for_delivery: 'bg-saffron/20 text-saffron border-saffron/30',
  delivered: 'bg-green-600/20 text-green-300 border-green-600/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status] || 'bg-muted text-muted-foreground border-border'}`}>
    {statusLabels[status] || status}
  </span>
);

export default StatusBadge;
