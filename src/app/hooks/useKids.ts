import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Kid {
  id: string;
  parent_user_id: string;
  name: string;
  gender: string | null;
  date_of_birth: string | null;
  school: string | null;
  notes: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const uploadKidPhoto = async (userId: string, file: File): Promise<string | null> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `kids/${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('profile-pictures')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return null;
  const { data } = supabase.storage.from('profile-pictures').getPublicUrl(path);
  return data.publicUrl;
};

export const useKids = (userId: string | null) => {
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) { setKids([]); setLoading(false); return; }
    const { data } = await supabase
      .from('kids' as any)
      .select('*')
      .eq('parent_user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    setKids((data as any) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addKid = async (k: Omit<Kid, 'id' | 'parent_user_id' | 'is_active' | 'created_at'>) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('kids' as any)
      .insert({ ...k, parent_user_id: userId } as any)
      .select()
      .maybeSingle();
    if (!error) await refresh();
    return data as any;
  };

  const updateKid = async (id: string, updates: Partial<Kid>) => {
    const { error } = await supabase.from('kids' as any).update(updates as any).eq('id', id);
    if (!error) await refresh();
  };

  const deleteKid = async (id: string) => {
    const { error } = await supabase.from('kids' as any).update({ is_active: false } as any).eq('id', id);
    if (!error) await refresh();
  };

  return { kids, loading, addKid, updateKid, deleteKid, refresh };
};

export const calcAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};
