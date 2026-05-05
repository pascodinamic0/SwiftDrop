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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_profiles: {
        Row: {
          created_at: string
          current_lat: number | null
          current_lng: number | null
          id: string
          is_online: boolean
          total_deliveries: number
          total_earnings: number
          updated_at: string
          vehicle: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id: string
          is_online?: boolean
          total_deliveries?: number
          total_earnings?: number
          updated_at?: string
          vehicle?: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_online?: boolean
          total_deliveries?: number
          total_earnings?: number
          updated_at?: string
          vehicle?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          accepted_at: string | null
          agent_id: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          distance_km: number
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          id: string
          notes: string | null
          package_size: Database["public"]["Enums"]["package_size"]
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          price: number
          status: Database["public"]["Enums"]["delivery_status"]
        }
        Insert: {
          accepted_at?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          distance_km: number
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          id?: string
          notes?: string | null
          package_size?: Database["public"]["Enums"]["package_size"]
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          price: number
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Update: {
          accepted_at?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          distance_km?: number
          dropoff_address?: string
          dropoff_lat?: number
          dropoff_lng?: number
          id?: string
          notes?: string | null
          package_size?: Database["public"]["Enums"]["package_size"]
          pickup_address?: string
          pickup_lat?: number
          pickup_lng?: number
          price?: number
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          base_fare: number
          drone_multiplier: number
          id: number
          per_km: number
          size_large: number
          size_medium: number
          size_small: number
          updated_at: string
        }
        Insert: {
          base_fare?: number
          drone_multiplier?: number
          id?: number
          per_km?: number
          size_large?: number
          size_medium?: number
          size_small?: number
          updated_at?: string
        }
        Update: {
          base_fare?: number
          drone_multiplier?: number
          id?: number
          per_km?: number
          size_large?: number
          size_medium?: number
          size_small?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          avg_rating: number | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          total_ratings: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          avg_rating?: number | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          total_ratings?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          avg_rating?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          total_ratings?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          agent_id: string
          comment: string | null
          created_at: string
          customer_id: string
          delivery_id: string
          id: string
          stars: number
        }
        Insert: {
          agent_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          delivery_id: string
          id?: string
          stars: number
        }
        Update: {
          agent_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          delivery_id?: string
          id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: true
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "delivery_agent" | "admin"
      delivery_status:
        | "pending"
        | "accepted"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled"
      delivery_type: "human" | "drone"
      package_size: "small" | "medium" | "large"
      vehicle_type: "foot" | "bike" | "car" | "van"
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
      app_role: ["customer", "delivery_agent", "admin"],
      delivery_status: [
        "pending",
        "accepted",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      delivery_type: ["human", "drone"],
      package_size: ["small", "medium", "large"],
      vehicle_type: ["foot", "bike", "car", "van"],
    },
  },
} as const
