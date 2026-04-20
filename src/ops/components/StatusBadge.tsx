const statusStyles: Record<string, string> = {
  new: 'bg-sky/25 text-ink',
  accepted: 'bg-mint/30 text-ink',
  preparing: 'bg-butter/30 text-ink',
  ready: 'bg-mint/40 text-ink',
  assigned: 'bg-lavender/30 text-ink',
  picked_up: 'bg-peach/30 text-ink',
  out_for_delivery: 'bg-coral/25 text-ink',
  delivered: 'bg-mint/50 text-ink',
  cancelled: 'bg-coral/40 text-white',
  booked: 'bg-butter/30 text-ink',
  checked_in: 'bg-mint/40 text-ink',
  completed: 'bg-ink/10 text-ink/70',
  active: 'bg-mint/40 text-ink',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  accepted: 'Accepted',
  preparing: 'Cooking',
  ready: 'Ready',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  out_for_delivery: 'On The Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  booked: 'Booked',
  checked_in: 'Checked In',
  completed: 'Completed',
  active: 'Playing',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-heading ${statusStyles[status] || 'bg-ink/10 text-ink/70'}`}>
    {statusLabels[status] || status}
  </span>
);

export default StatusBadge;
