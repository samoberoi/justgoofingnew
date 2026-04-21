import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Edit3, X, Camera, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { useKids, calcAge, Kid, uploadKidPhoto } from '../hooks/useKids';
import Icon3D from '../components/Icon3D';
import illusKids from '@/assets/illus/illus-kids.png';
import { toast } from 'sonner';

const GENDERS = [
  { v: 'boy', label: '👦 Boy' },
  { v: 'girl', label: '👧 Girl' },
  { v: 'other', label: '🧒 Other' },
];

const KID_COLORS = [
  'bg-coral shadow-pop-coral',
  'bg-mint shadow-pop-mint',
  'bg-butter shadow-pop-butter',
  'bg-lavender shadow-pop-lavender',
  'bg-sky shadow-pop',
  'bg-bubblegum shadow-pop',
];

interface FormState {
  name: string;
  gender: string;
  date_of_birth: string;
  school: string;
  notes: string;
  photo_url: string;
}

const empty: FormState = { name: '', gender: '', date_of_birth: '', school: '', notes: '', photo_url: '' };

const KidsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId } = useAppStore();
  const { kids, loading, addKid, updateKid, deleteKid } = useKids(userId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];

  // Auto-open Add Kid form when navigated with ?add=1
  useEffect(() => {
    if (searchParams.get('add') === '1' && !showForm) {
      setForm(empty);
      setEditingId(null);
      setShowForm(true);
      // Clean up URL so back/forward doesn't re-trigger
      searchParams.delete('add');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      photo_url: kid.photo_url || '',
    });
    setEditingId(kid.id);
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB');
      return;
    }
    setUploadingPhoto(true);
    const url = await uploadKidPhoto(userId, file);
    setUploadingPhoto(false);
    if (url) {
      setForm(f => ({ ...f, photo_url: url }));
      toast.success('Photo uploaded!');
    } else {
      toast.error('Upload failed. Try again.');
    }
    e.target.value = '';
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
      photo_url: form.photo_url || null,
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-display text-xl text-ink leading-tight -tracking-wide">My Kids</h1>
            <p className="text-[11px] text-muted-foreground font-heading">Tap to edit · add as many as you want</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={openAdd}
            className="px-4 h-10 rounded-full bg-ink text-white flex items-center gap-1.5 text-xs font-display"
          >
            <Plus size={14} strokeWidth={2.5} /> Add
          </motion.button>
        </div>
      </header>

      {/* List */}
      <div className="px-4 pt-6 space-y-3 relative z-10">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-32 bg-card rounded-3xl animate-pulse" />)}
          </div>
        ) : kids.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted rounded-[32px] p-8 text-center"
          >
            <img src={illusKids} alt="" className="w-32 h-32 mx-auto mb-3 object-contain" />
            <p className="font-display text-2xl text-ink -tracking-wide">No kids yet!</p>
            <p className="text-sm text-muted-foreground mt-1.5 font-heading">Add your little goofers so check-ins are super fast.</p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={openAdd}
              className="mt-5 inline-flex items-center gap-2 px-7 py-3.5 bg-ink rounded-full font-display text-sm text-white"
            >
              <Plus size={16} strokeWidth={2.5} /> Add a Kid
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
                    <div className={`w-16 h-16 rounded-2xl ${colorClass} flex items-center justify-center text-white font-display text-2xl shrink-0 overflow-hidden`}>
                      {kid.photo_url ? (
                        <img src={kid.photo_url} alt={kid.name} className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
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
                            <Icon3D name="calendar" size={12} alt="" /> {age} {age === 1 ? 'year' : 'years'}
                          </span>
                        )}
                        {kid.date_of_birth && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-lavender/25 rounded-full text-[11px] text-ink">
                            🎂 {new Date(kid.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {kid.school && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky/25 rounded-full text-[11px] text-ink">
                            <Icon3D name="badge" size={12} alt="" /> {kid.school}
                          </span>
                        )}
                      </div>
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
          className="fixed bottom-24 right-5 z-40 w-14 h-14 bg-coral rounded-full shadow-pop-coral flex items-center justify-center"
        >
          <Plus size={24} className="text-white" strokeWidth={2.5} />
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
                {/* Photo */}
                <div className="flex flex-col items-center gap-2 -mt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="relative w-24 h-24 rounded-3xl bg-gradient-coral shadow-pop-coral flex items-center justify-center overflow-hidden border-4 border-card"
                  >
                    {uploadingPhoto ? (
                      <Loader2 size={28} className="text-white animate-spin" />
                    ) : form.photo_url ? (
                      <img src={form.photo_url} alt="Kid" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">👶</span>
                    )}
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-2xl bg-mint shadow-pop-mint flex items-center justify-center border-2 border-background">
                      <Camera size={14} className="text-white" />
                    </div>
                  </motion.button>
                  <p className="text-[11px] text-ink/55 font-heading">
                    {form.photo_url ? 'Tap to change photo' : 'Tap to add a cute photo'}
                  </p>
                </div>

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
                  <label className="text-xs font-heading text-ink/70 mb-1.5 flex items-center gap-1.5">
                    <Icon3D name="calendar" size={14} alt="" /> Date of Birth
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
                  <label className="text-xs font-heading text-ink/70 mb-1.5 flex items-center gap-1.5">
                    <Icon3D name="badge" size={14} alt="" /> School
                  </label>
                  <input
                    value={form.school}
                    onChange={e => setForm({ ...form, school: e.target.value })}
                    placeholder="e.g. DPS Vasant Kunj"
                    className="w-full px-4 py-3.5 bg-card border-2 border-ink/8 rounded-2xl text-base text-ink placeholder:text-ink/35 focus:outline-none focus:border-coral transition-colors"
                  />
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
                  ✓ {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Kid'}
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
