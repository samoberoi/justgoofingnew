import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  prep_time_override: number | null;
}

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
  default_variant_id: string | null;
  variants: MenuVariant[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
}

export const useMenu = (storeId?: string | null) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      const queries: Promise<any>[] = [
        supabase.from('menu_items').select('*').eq('is_active', true).eq('is_available', true).order('display_order'),
        supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('menu_variants').select('*').eq('is_active', true).order('display_order'),
      ];

      // If a store is selected, also fetch store overrides
      if (storeId) {
        queries.push(
          supabase.from('menu_store_overrides').select('*').eq('store_id', storeId)
        );
      }

      const results = await Promise.all(queries);
      const [itemsRes, catsRes, variantsRes] = results;
      const overridesRes = storeId ? results[3] : null;

      // Build override map: menu_item_id -> override
      const overrideMap = new Map<string, { is_available: boolean; price_override: number | null }>();
      if (overridesRes?.data) {
        for (const ov of overridesRes.data) {
          overrideMap.set(ov.menu_item_id, { is_available: ov.is_available, price_override: ov.price_override });
        }
      }

      const variantsByItem = new Map<string, MenuVariant[]>();
      (variantsRes.data || []).forEach(v => {
        const list = variantsByItem.get(v.menu_item_id) || [];
        list.push({ id: v.id, name: v.name, price: v.price, prep_time_override: v.prep_time_override });
        variantsByItem.set(v.menu_item_id, list);
      });

      let enrichedItems: MenuItem[] = (itemsRes.data || []).map(item => ({
        ...item,
        default_variant_id: (item as any).default_variant_id || null,
        variants: variantsByItem.get(item.id) || [],
      }));

      // Filter by store overrides: if override exists and is_available=false, exclude the item
      if (storeId && overrideMap.size > 0) {
        enrichedItems = enrichedItems.filter(item => {
          const ov = overrideMap.get(item.id);
          // If there's an override that marks it unavailable, hide it
          if (ov && !ov.is_available) return false;
          return true;
        });

        // Apply price overrides
        enrichedItems = enrichedItems.map(item => {
          const ov = overrideMap.get(item.id);
          if (ov?.price_override != null) {
            return { ...item, price: ov.price_override };
          }
          return item;
        });
      }

      setItems(enrichedItems);
      setCategories(catsRes.data || []);
      setLoading(false);
    };
    fetchMenu();
  }, [storeId]);

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
