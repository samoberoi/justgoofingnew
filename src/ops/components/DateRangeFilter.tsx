import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateRange = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'custom';

const DATE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

export const getDateRange = (range: DateRange, customFrom?: string, customTo?: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return { from: today.toISOString(), to: now.toISOString() };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: y.toISOString(), to: today.toISOString() };
    }
    case 'this_week': {
      const dow = today.getDay();
      const monday = new Date(today);
      monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));
      return { from: monday.toISOString(), to: now.toISOString() };
    }
    case 'last_week': {
      const dow = today.getDay();
      const thisMonday = new Date(today);
      thisMonday.setDate(thisMonday.getDate() - (dow === 0 ? 6 : dow - 1));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      return { from: lastMonday.toISOString(), to: thisMonday.toISOString() };
    }
    case 'this_month': {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: firstOfMonth.toISOString(), to: now.toISOString() };
    }
    case 'custom':
      return {
        from: customFrom ? new Date(customFrom).toISOString() : today.toISOString(),
        to: customTo ? new Date(customTo + 'T23:59:59').toISOString() : now.toISOString(),
      };
    default:
      return { from: today.toISOString(), to: now.toISOString() };
  }
};

interface Props {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
}

const DateRangeFilter = ({ dateRange, onDateRangeChange, customFrom, customTo, onCustomFromChange, onCustomToChange }: Props) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {DATE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => {
              onDateRangeChange(opt.key);
              if (opt.key === 'custom') setShowPicker(true);
              else setShowPicker(false);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors flex items-center gap-1 ${
              dateRange === opt.key
                ? 'bg-secondary/20 text-secondary border-secondary/30'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {opt.key === 'custom' && <Calendar size={12} />}
            {opt.label}
          </button>
        ))}
      </div>
      {dateRange === 'custom' && showPicker && (
        <div className="flex gap-2 mt-2">
          <input type="date" value={customFrom} onChange={e => onCustomFromChange(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground" />
          <input type="date" value={customTo} onChange={e => onCustomToChange(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground" />
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
