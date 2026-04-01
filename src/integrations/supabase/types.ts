export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          created_at: string | null
          formatted_address: string
          house_number: string | null
          id: string
          label: string | null
          lat: number | null
          line1: string | null
          lng: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          formatted_address: string
          house_number?: string | null
          id?: string
          label?: string | null
          lat?: number | null
          line1?: string | null
          lng?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          formatted_address?: string
          house_number?: string | null
          id?: string
          label?: string | null
          lat?: number | null
          line1?: string | null
          lng?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          tier_level: number
        }
        Insert: {
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          tier_level?: number
        }
        Update: {
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          tier_level?: number
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_value: number | null
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_partner_id: string
          id: string
          order_id: string
          picked_up_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_partner_id: string
          id?: string
          order_id: string
          picked_up_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_partner_id?: string
          id?: string
          order_id?: string
          picked_up_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_settings: {
        Row: {
          base_delivery_fee: number
          free_delivery_above: number
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          base_delivery_fee?: number
          free_delivery_above?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          base_delivery_fee?: number
          free_delivery_above?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_campaigns: {
        Row: {
          auto_apply: boolean
          category: string
          coupon_code: string | null
          created_at: string
          discount_value: number
          free_item_id: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_value: number | null
          name: string
          per_user_limit: number | null
          reward_id: string | null
          target_audience: string
          target_badge_id: string | null
          type: string
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          auto_apply?: boolean
          category?: string
          coupon_code?: string | null
          created_at?: string
          discount_value?: number
          free_item_id?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number | null
          name: string
          per_user_limit?: number | null
          reward_id?: string | null
          target_audience?: string
          target_badge_id?: string | null
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          auto_apply?: boolean
          category?: string
          coupon_code?: string | null
          created_at?: string
          discount_value?: number
          free_item_id?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number | null
          name?: string
          per_user_limit?: number | null
          reward_id?: string | null
          target_audience?: string
          target_badge_id?: string | null
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_campaigns_free_item_id_fkey"
            columns: ["free_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_campaigns_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_addon_groups: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_selections: number
          min_selections: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_selections?: number
          min_selections?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_selections?: number
          min_selections?: number
          name?: string
        }
        Relationships: []
      }
      menu_addons: {
        Row: {
          created_at: string
          display_order: number
          group_id: string
          id: string
          is_active: boolean
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          group_id: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          group_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_addons_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "menu_addon_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_item_addon_groups: {
        Row: {
          addon_group_id: string
          id: string
          menu_item_id: string
        }
        Insert: {
          addon_group_id: string
          id?: string
          menu_item_id: string
        }
        Update: {
          addon_group_id?: string
          id?: string
          menu_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_addon_groups_addon_group_id_fkey"
            columns: ["addon_group_id"]
            isOneToOne: false
            referencedRelation: "menu_addon_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_addon_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          availability_schedule: Json | null
          base_price: number | null
          category: string | null
          category_id: string | null
          created_at: string
          default_variant_id: string | null
          description: string | null
          discounted_price: number | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          is_available: boolean
          is_bestseller: boolean
          is_chefs_special: boolean
          is_new: boolean
          is_veg: boolean
          name: string
          prep_time: number | null
          price: number
          spice_level: number | null
          store_id: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          availability_schedule?: Json | null
          base_price?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          default_variant_id?: string | null
          description?: string | null
          discounted_price?: number | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          is_bestseller?: boolean
          is_chefs_special?: boolean
          is_new?: boolean
          is_veg?: boolean
          name: string
          prep_time?: number | null
          price: number
          spice_level?: number | null
          store_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          availability_schedule?: Json | null
          base_price?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          default_variant_id?: string | null
          description?: string | null
          discounted_price?: number | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          is_bestseller?: boolean
          is_chefs_special?: boolean
          is_new?: boolean
          is_veg?: boolean
          name?: string
          prep_time?: number | null
          price?: number
          spice_level?: number | null
          store_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_default_variant_id_fkey"
            columns: ["default_variant_id"]
            isOneToOne: false
            referencedRelation: "menu_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_store_overrides: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          menu_item_id: string
          price_override: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_item_id: string
          price_override?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_item_id?: string
          price_override?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_store_overrides_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_store_overrides_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_variants: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          menu_item_id: string
          name: string
          prep_time_override: number | null
          price: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          menu_item_id: string
          name: string
          prep_time_override?: number | null
          price: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          menu_item_id?: string
          name?: string
          prep_time_override?: number | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_variants_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          menu_item_id: string | null
          name: string
          order_id: string
          price: number
          quantity: number
          special_instructions: string | null
        }
        Insert: {
          id?: string
          menu_item_id?: string | null
          name: string
          order_id: string
          price: number
          quantity?: number
          special_instructions?: string | null
        }
        Update: {
          id?: string
          menu_item_id?: string | null
          name?: string
          order_id?: string
          price?: number
          quantity?: number
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          cancelled_at: string | null
          created_at: string
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          discount: number
          house_number: string | null
          id: string
          order_number: string
          out_for_delivery_at: string | null
          payment_method: string | null
          payment_status: string | null
          picked_up_at: string | null
          preparing_at: string | null
          ready_at: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount?: number
          house_number?: string | null
          id?: string
          order_number: string
          out_for_delivery_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          picked_up_at?: string | null
          preparing_at?: string | null
          ready_at?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount?: number
          house_number?: string | null
          id?: string
          order_number?: string
          out_for_delivery_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          picked_up_at?: string | null
          preparing_at?: string | null
          ready_at?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      points_settings: {
        Row: {
          earning_enabled: boolean
          earning_percent: number
          expiry_days: number | null
          id: string
          max_earn_per_order: number | null
          max_redemption_percent: number
          min_order_for_redemption: number | null
          points_to_currency: number
          redemption_enabled: boolean
          updated_at: string
        }
        Insert: {
          earning_enabled?: boolean
          earning_percent?: number
          expiry_days?: number | null
          id?: string
          max_earn_per_order?: number | null
          max_redemption_percent?: number
          min_order_for_redemption?: number | null
          points_to_currency?: number
          redemption_enabled?: boolean
          updated_at?: string
        }
        Update: {
          earning_enabled?: boolean
          earning_percent?: number
          expiry_days?: number | null
          id?: string
          max_earn_per_order?: number | null
          max_redemption_percent?: number
          min_order_for_redemption?: number | null
          points_to_currency?: number
          redemption_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_document_url: string | null
          aadhaar_number: string | null
          anniversary: string | null
          avatar_url: string | null
          birthday: string | null
          created_at: string
          designation: string | null
          full_name: string | null
          id: string
          pan_document_url: string | null
          pan_number: string | null
          phone: string | null
          salary: number | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhaar_document_url?: string | null
          aadhaar_number?: string | null
          anniversary?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          designation?: string | null
          full_name?: string | null
          id?: string
          pan_document_url?: string | null
          pan_number?: string | null
          phone?: string | null
          salary?: number | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhaar_document_url?: string | null
          aadhaar_number?: string | null
          anniversary?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          designation?: string | null
          full_name?: string | null
          id?: string
          pan_document_url?: string | null
          pan_number?: string | null
          phone?: string | null
          salary?: number | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          id: string
          is_active: boolean
          max_referrals_per_user: number | null
          referee_discount_percent: number | null
          referee_points: number
          referrer_points: number
          require_first_order: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          max_referrals_per_user?: number | null
          referee_discount_percent?: number | null
          referee_points?: number
          referrer_points?: number
          require_first_order?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          max_referrals_per_user?: number | null
          referee_discount_percent?: number | null
          referee_points?: number
          referrer_points?: number
          require_first_order?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          points_awarded: number | null
          referee_id: string | null
          referee_order_id: string | null
          referral_code: string
          referrer_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referee_id?: string | null
          referee_order_id?: string | null
          referral_code: string
          referrer_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referee_id?: string | null
          referee_order_id?: string | null
          referral_code?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_order_id_fkey"
            columns: ["referee_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          free_item_id: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          free_item_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          free_item_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "rewards_free_item_id_fkey"
            columns: ["free_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          closing_time: string | null
          created_at: string
          default_prep_time: number | null
          delivery_radius: number | null
          google_maps_url: string | null
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          opening_time: string | null
          phone: string | null
          tax_percent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          default_prep_time?: number | null
          delivery_radius?: number | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_time?: string | null
          phone?: string | null
          tax_percent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          default_prep_time?: number | null
          delivery_radius?: number | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_time?: string | null
          phone?: string | null
          tax_percent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      streak_campaigns: {
        Row: {
          auto_reset: boolean
          created_at: string
          duration_weeks: number
          grace_period_hours: number | null
          id: string
          is_active: boolean
          min_orders_per_week: number
          name: string
          reward_id: string | null
          type: string
        }
        Insert: {
          auto_reset?: boolean
          created_at?: string
          duration_weeks?: number
          grace_period_hours?: number | null
          id?: string
          is_active?: boolean
          min_orders_per_week?: number
          name: string
          reward_id?: string | null
          type?: string
        }
        Update: {
          auto_reset?: boolean
          created_at?: string
          duration_weeks?: number
          grace_period_hours?: number | null
          id?: string
          is_active?: boolean
          min_orders_per_week?: number
          name?: string
          reward_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_campaigns_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          broken: boolean
          completed: boolean
          completed_at: string | null
          created_at: string
          current_week: number
          id: string
          last_order_at: string | null
          orders_this_week: number
          started_at: string
          streak_campaign_id: string
          user_id: string
        }
        Insert: {
          broken?: boolean
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_week?: number
          id?: string
          last_order_at?: string | null
          orders_this_week?: number
          started_at?: string
          streak_campaign_id: string
          user_id: string
        }
        Update: {
          broken?: boolean
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_week?: number
          id?: string
          last_order_at?: string | null
          orders_this_week?: number
          started_at?: string
          streak_campaign_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_streak_campaign_id_fkey"
            columns: ["streak_campaign_id"]
            isOneToOne: false
            referencedRelation: "streak_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_store: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "store_manager"
        | "kitchen_manager"
        | "delivery_partner"
      order_status:
        | "new"
        | "accepted"
        | "preparing"
        | "ready"
        | "assigned"
        | "picked_up"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "store_manager",
        "kitchen_manager",
        "delivery_partner",
      ],
      order_status: [
        "new",
        "accepted",
        "preparing",
        "ready",
        "assigned",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
