import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  base_price: number | null;
  discounted_price: number | null;
  image_url: string | null;
  is_veg: boolean;
  spice_level: number | null;
  tags: string[] | null;
  category_id: string | null;
  is_bestseller: boolean;
  is_chefs_special: boolean;
  is_new: boolean;
  prep_time: number | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
}

export const useMenu = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('menu_items').select('*').eq('is_active', true).eq('is_available', true).order('display_order'),
        supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order'),
      ]);
      setItems(itemsRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const grouped = new Map<string, MenuItem[]>();
  const uncategorized: MenuItem[] = [];
  items.forEach(item => {
    if (item.category_id) {
      const list = grouped.get(item.category_id) || [];
      list.push(item);
      grouped.set(item.category_id, list);
    } else {
      uncategorized.push(item);
    }
  });

  return { items, categories, grouped, uncategorized, loading };
};
