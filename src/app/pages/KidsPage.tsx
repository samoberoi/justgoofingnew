import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Baby, Cake, GraduationCap, Trash2, Edit3, X, Check, Phone, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { useKids, calcAge, Kid } from '../hooks/useKids';
import { Star, Sparkle, Cloud } from '../components/Stickers';
import { toast } from 'sonner';

const GENDERS = [
  { v: 'boy', label: '👦 Boy' },
  { v: 'girl', label: '👧 Girl' },
  { v: 'other', label: '🧒 Other' },
];

const KID_COLORS = [
  'bg-gradient-coral shadow-pop-coral',
  'bg-gradient-mint shadow-pop-mint',
  'bg-gradient-butter shadow-pop-butter',
  'bg-gradient-lavender shadow-pop-lavender',
  'bg-gradient-sky shadow-pop',
  'bg-gradient-bubblegum shadow-pop',
];

interface FormState {
  name: string;
  gender: string;
  date_of_birth: string;
  school: string;
  notes: string;
  parent1_name: string;
  parent1_phone: string;
  parent2_name: string;
  parent2_phone: string;
}

const empty: FormState = {
  name: '', gender: '', date_of_birth: '', school: '', notes: '',
  parent1_name: '', parent1_phone: '', parent2_name: '', parent2_phone: '',
};

const KidsPage = () => {
  const navigate = useNavigate();
  const { userId } = useAppStore();
  const { kids, loading, addKid, updateKid, deleteKid } = useKids(userId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const openAdd = () => {
    setForm(empty);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (kid: Kid) => {
    setForm({
      name: kid.name,
      gender: kid.gender || '',
      date_of_birth: kid.date_of_birth || '',
      school: kid.school || '',
      notes: kid.notes || '',
      parent1_name: kid.parent1_name || '',
      parent1_phone: kid.parent1_phone || '',
      parent2_name: kid.parent2_name || '',
      parent2_phone: kid.parent2_phone || '',
    });
    setEditingId(kid.id);
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      school: form.school.trim() || null,
      notes: form.notes.trim() || null,
      parent1_name: form.parent1_name.trim() || null,
      parent1_phone: form.parent1_phone.trim() || null,
      parent2_name: form.parent2_name.trim() || null,
      parent2_phone: form.parent2_phone.trim() || null,
    };
    if (editingId) {
      await updateKid(editingId, payload as any);
      toast.success('Kid updated! 🎉');
    } else {
      await addKid(payload as any);
      toast.success('Kid added! 🎉');
    }
    setSaving(false);
    close();
  };

  const handleDelete = async (kid: Kid) => {
    if (!confirm(`Remove ${kid.name} from your profile?`)) return;
    await deleteKid(kid.id);
    toast.success('Removed');
  };

  return (
    <div className="min-h-screen bg-background pb-32 relative overflow-hidden">
      {/* Decorative stickers */}
      <Star className="absolute top-24 right-6 w-8 h-8 text-butter opacity-40 animate-wobble" />
      <Sparkle className="absolute top-44 left-8 w-6 h-6 text-coral opacity-50 animate-bounce-soft" />
      <Cloud className="absolute top-72 right-10 w-10 h-10 text-mint opacity-30" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b-2 border-ink/5">
        <div className="flex items-center gap-3 px-4 h-16">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-card border-2 border-ink/8 shadow-soft flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-ink" />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-display text-xl text-ink leading-tight">My Kids 👶</h1>
            <p className="text-[11px] text-ink/55">Tap a kid to edit · Add as many as you want</p>
          </div>
        </div>
      </header>

      {/* Empty / list */}
      <div className="px-4 pt-6 space-y-3 relative z-10">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-32 bg-card rounded-3xl animate-pulse" />)}
          </div>
        ) : kids.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border-2 border-ink/8 rounded-3xl p-8 text-center shadow-pop"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-coral mx-auto mb-4 flex items-center justify-center text-4xl shadow-pop-coral animate-bounce-soft">
              👶
            </div>
            <p className="font-display text-xl text-ink">No kids yet!</p>
            <p className="text-sm text-ink/55 mt-1">Add your little goofers so check-ins are super fast.</p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={openAdd}
              className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-gradient-coral rounded-2xl font-heading text-sm text-white shadow-pop-coral"
            >
              <Plus size={16} /> Add a Kid
            </motion.button>
          </motion.div>
        ) : (
          <>
            {kids.map((kid, i) => {
              const age = calcAge(kid.date_of_birth);
              const initial = kid.name.charAt(0).toUpperCase();
              const colorClass = KID_COLORS[i % KID_COLORS.length];
              return (
                <motion.div
                  key={kid.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border-2 border-ink/8 rounded-3xl p-4 shadow-pop"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-16 h-16 rounded-2xl ${colorClass} flex items-center justify-center text-white font-display text-2xl shrink-0`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-display text-lg text-ink truncate">{kid.name}</p>
                          {kid.gender && (
                            <p className="text-xs text-ink/60 capitalize">
                              {kid.gender === 'boy' ? '👦' : kid.gender === 'girl' ? '👧' : '🧒'} {kid.gender}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openEdit(kid)}
                            className="w-8 h-8 rounded-xl bg-mint/15 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Edit3 size={13} className="text-mint" />
                          </button>
                          <button
                            onClick={() => handleDelete(kid)}
                            className="w-8 h-8 rounded-xl bg-coral/15 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Trash2 size={13} className="text-coral" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {age !== null && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-butter/20 rounded-full text-[11px] text-ink font-heading">
                            <Cake size={11} /> {age} {age === 1 ? 'year' : 'years'}
                          </span>
                        )}
                        {kid.date_of_birth && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-lavender/25 rounded-full text-[11px] text-ink">
                            🎂 {new Date(kid.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {kid.school && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky/25 rounded-full text-[11px] text-ink">
                            <GraduationCap size={11} /> {kid.school}
                          </span>
                        )}
                      </div>
                      {(kid.parent1_name || kid.parent1_phone || kid.parent2_name || kid.parent2_phone) && (
                        <div className="mt-2 pt-2 border-t border-ink/5 space-y-1">
                          {(kid.parent1_name || kid.parent1_phone) && (
                            <div className="flex items-center gap-1.5 text-[11px] text-ink/65">
                              <User size={10} className="text-coral shrink-0" />
                              <span className="font-heading">{kid.parent1_name || 'Parent'}</span>
                              {kid.parent1_phone && <span className="text-ink/45">· {kid.parent1_phone}</span>}
                            </div>
                          )}
                          {(kid.parent2_name || kid.parent2_phone) && (
                            <div className="flex items-center gap-1.5 text-[11px] text-ink/65">
                              <User size={10} className="text-mint shrink-0" />
                              <span className="font-heading">{kid.parent2_name || 'Parent'}</span>
                              {kid.parent2_phone && <span className="text-ink/45">· {kid.parent2_phone}</span>}
                            </div>
                          )}
                        </div>
                      )}
                      {kid.notes && (
                        <p className="text-[11px] text-ink/55 mt-2 italic">"{kid.notes}"</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      {/* Floating Add button */}
      {kids.length > 0 && !showForm && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={openAdd}
          className="fixed bottom-6 right-5 z-40 w-16 h-16 bg-gradient-coral rounded-3xl shadow-pop-coral flex items-center justify-center"
        >
          <Plus size={26} className="text-white" />
        </motion.button>
      )}

      {/* Add/Edit form modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-[32px] border-t-2 border-ink/5 max-h-[92vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-background pt-3 pb-2 px-5 flex items-center justify-between border-b-2 border-ink/5">
                <div className="w-10 h-1 bg-ink/15 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                <h2 className="font-display text-lg text-ink mt-2">
                  {editingId ? 'Edit Kid ✏️' : 'New Kid 🎉'}
                </h2>
                <button onClick={close} className="w-9 h-9 rounded-2xl bg-card border-2 border-ink/8 flex items-center justify-center mt-2">
                  <X size={16} className="text-ink" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-heading text-ink/70 mb-1.5 block">Kid's Name *</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Aarav"
                    className="w-full px-4 py-3.5 bg-card border-2 border-ink/8 rounded-2xl text-base text-ink placeholder:text-ink/35 focus:outline-none focus:border-coral transition-colors"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-heading text-ink/70 mb-1.5 block">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {GENDERS.map(g => (
                      <button
                        key={g.v}
                        onClick={() => setForm({ ...form, gender: g.v })}
                        className={`py-3 rounded-2xl border-2 text-sm font-heading transition-all ${
                          form.gender === g.v
                            ? 'border-coral bg-coral/10 text-coral'
                            : 'border-ink/8 bg-card text-ink/70'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DOB */}
                <div>
                  <label className="text-xs font-heading text-ink/70 mb-1.5 block flex items-center gap-1.5">
                    <Cake size={12} className="text-butter" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    max={today}
                    value={form.date_of_birth}
                    onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3.5 bg-card border-2 border-ink/8 rounded-2xl text-base text-ink focus:outline-none focus:border-coral transition-colors"
                  />
                  {form.date_of_birth && calcAge(form.date_of_birth) !== null && (
                    <p className="text-[11px] text-mint mt-1.5 font-heading">
                      ✨ {calcAge(form.date_of_birth)} years old
                    </p>
                  )}
                </div>

                {/* School */}
                <div>
                  <label className="text-xs font-heading text-ink/70 mb-1.5 block flex items-center gap-1.5">
                    <GraduationCap size={12} className="text-sky" /> School
                  </label>
                  <input
                    value={form.school}
                    onChange={e => setForm({ ...form, school: e.target.value })}
                    placeholder="e.g. DPS Vasant Kunj"
                    className="w-full px-4 py-3.5 bg-card border-2 border-ink/8 rounded-2xl text-base text-ink placeholder:text-ink/35 focus:outline-none focus:border-coral transition-colors"
                  />
                </div>

                {/* Parents section */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-ink/8" />
                    <span className="text-[10px] font-heading text-ink/50 uppercase tracking-wider">Parents / Guardians</span>
                    <div className="h-px flex-1 bg-ink/8" />
                  </div>

                  {/* Parent 1 */}
                  <div className="bg-coral/5 rounded-2xl p-3 space-y-2 mb-2.5 border-2 border-coral/15">
                    <p className="text-[10px] font-heading text-coral uppercase tracking-wider flex items-center gap-1">
                      <User size={10} /> Parent 1
                    </p>
                    <input
                      value={form.parent1_name}
                      onChange={e => setForm({ ...form, parent1_name: e.target.value })}
                      placeholder="Parent name"
                      className="w-full px-3.5 py-3 bg-card border-2 border-ink/8 rounded-xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-coral transition-colors"
                    />
                    <div className="flex items-center gap-2 bg-card border-2 border-ink/8 rounded-xl px-3.5 py-3 focus-within:border-coral transition-colors">
                      <Phone size={13} className="text-coral shrink-0" />
                      <span className="text-sm text-ink/50">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.parent1_phone}
                        onChange={e => setForm({ ...form, parent1_phone: e.target.value.replace(/\D/g, '') })}
                        placeholder="98765 43210"
                        className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Parent 2 */}
                  <div className="bg-mint/5 rounded-2xl p-3 space-y-2 border-2 border-mint/15">
                    <p className="text-[10px] font-heading text-mint uppercase tracking-wider flex items-center gap-1">
                      <User size={10} /> Parent 2 <span className="text-ink/40 normal-case">(optional)</span>
                    </p>
                    <input
                      value={form.parent2_name}
                      onChange={e => setForm({ ...form, parent2_name: e.target.value })}
                      placeholder="Parent name"
                      className="w-full px-3.5 py-3 bg-card border-2 border-ink/8 rounded-xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-mint transition-colors"
                    />
                    <div className="flex items-center gap-2 bg-card border-2 border-ink/8 rounded-xl px-3.5 py-3 focus-within:border-mint transition-colors">
                      <Phone size={13} className="text-mint shrink-0" />
                      <span className="text-sm text-ink/50">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.parent2_phone}
                        onChange={e => setForm({ ...form, parent2_phone: e.target.value.replace(/\D/g, '') })}
                        placeholder="98765 43210"
                        className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-heading text-ink/70 mb-1.5 block">Notes (allergies, anything we should know)</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. Loves slides, mild peanut allergy"
                    className="w-full px-4 py-3 bg-card border-2 border-ink/8 rounded-2xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-coral transition-colors resize-none"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="w-full py-4 bg-gradient-coral rounded-2xl font-heading text-base text-white shadow-pop-coral flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none"
                >
                  <Check size={18} /> {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Kid'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KidsPage;
