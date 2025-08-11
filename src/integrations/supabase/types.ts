export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      avatar_downloads: {
        Row: {
          avatar_store_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          avatar_store_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          avatar_store_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_downloads_avatar_store_id_fkey"
            columns: ["avatar_store_id"]
            isOneToOne: false
            referencedRelation: "avatar_store"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_ratings: {
        Row: {
          avatar_store_id: string
          comment: string | null
          created_at: string
          id: string
          overall_rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_store_id: string
          comment?: string | null
          created_at?: string
          id?: string
          overall_rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_store_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          overall_rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_ratings_avatar_store_id_fkey"
            columns: ["avatar_store_id"]
            isOneToOne: false
            referencedRelation: "avatar_store"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_store: {
        Row: {
          avatar_id: string
          average_rating: number | null
          created_at: string
          creator_id: string
          description: string | null
          downloads_count: number
          id: string
          is_featured: boolean
          is_verified: boolean
          rating_count: number
          title: string
          updated_at: string
        }
        Insert: {
          avatar_id: string
          average_rating?: number | null
          created_at?: string
          creator_id: string
          description?: string | null
          downloads_count?: number
          id?: string
          is_featured?: boolean
          is_verified?: boolean
          rating_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          avatar_id?: string
          average_rating?: number | null
          created_at?: string
          creator_id?: string
          description?: string | null
          downloads_count?: number
          id?: string
          is_featured?: boolean
          is_verified?: boolean
          rating_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_store_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatares"
            referencedColumns: ["id"]
          },
        ]
      }
      avatares: {
        Row: {
          avatar: string
          avatar_type: string
          background: string | null
          caracteristicas: string | null
          categoria: Database["public"]["Enums"]["avatar_category"] | null
          created_at: string
          id: string
          inspiracao: string | null
          interests: string | null
          is_public: boolean
          is_system: boolean
          nome: string
          personalidade: Database["public"]["Enums"]["avatar_personality"]
          profissao: string | null
          tom: Database["public"]["Enums"]["avatar_tone"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar?: string
          avatar_type?: string
          background?: string | null
          caracteristicas?: string | null
          categoria?: Database["public"]["Enums"]["avatar_category"] | null
          created_at?: string
          id?: string
          inspiracao?: string | null
          interests?: string | null
          is_public?: boolean
          is_system?: boolean
          nome: string
          personalidade: Database["public"]["Enums"]["avatar_personality"]
          profissao?: string | null
          tom: Database["public"]["Enums"]["avatar_tone"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar?: string
          avatar_type?: string
          background?: string | null
          caracteristicas?: string | null
          categoria?: Database["public"]["Enums"]["avatar_category"] | null
          created_at?: string
          id?: string
          inspiracao?: string | null
          interests?: string | null
          is_public?: boolean
          is_system?: boolean
          nome?: string
          personalidade?: Database["public"]["Enums"]["avatar_personality"]
          profissao?: string | null
          tom?: Database["public"]["Enums"]["avatar_tone"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conversation_activity: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_message_at: string
          notification_sent: boolean
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          notification_sent?: boolean
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          notification_sent?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_activity_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_id: string
          created_at: string
          id: string
          last_activity: string
          title: string | null
          user_id: string
        }
        Insert: {
          avatar_id: string
          created_at?: string
          id?: string
          last_activity?: string
          title?: string | null
          user_id: string
        }
        Update: {
          avatar_id?: string
          created_at?: string
          id?: string
          last_activity?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatares"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_user: boolean
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_user: boolean
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_user?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reengagement_templates: {
        Row: {
          categoria: Database["public"]["Enums"]["avatar_category"] | null
          created_at: string
          id: string
          message_template: string
          personalidade: Database["public"]["Enums"]["avatar_personality"]
          tom: Database["public"]["Enums"]["avatar_tone"]
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["avatar_category"] | null
          created_at?: string
          id?: string
          message_template: string
          personalidade: Database["public"]["Enums"]["avatar_personality"]
          tom: Database["public"]["Enums"]["avatar_tone"]
        }
        Update: {
          categoria?: Database["public"]["Enums"]["avatar_category"] | null
          created_at?: string
          id?: string
          message_template?: string
          personalidade?: Database["public"]["Enums"]["avatar_personality"]
          tom?: Database["public"]["Enums"]["avatar_tone"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rls_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_system_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      count_avatares: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_profiles: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_system_avatars: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_avatar_average_rating: {
        Args: { store_id: string }
        Returns: number
      }
      get_conversation_with_messages: {
        Args: { conversation_uuid: string }
        Returns: Json
      }
      get_inactive_conversations: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          avatar_id: string
          avatar_nome: string
          personalidade: string
          tom: string
          categoria: string
          last_message_at: string
        }[]
      }
      get_system_avatares: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          nome: string
          personalidade: Database["public"]["Enums"]["avatar_personality"]
          tom: Database["public"]["Enums"]["avatar_tone"]
          categoria: Database["public"]["Enums"]["avatar_category"]
          avatar: string
          profissao: string
          caracteristicas: string
          background: string
          interests: string
          inspiracao: string
        }[]
      }
      get_user_avatares: {
        Args: { user_uuid?: string }
        Returns: {
          id: string
          nome: string
          personalidade: Database["public"]["Enums"]["avatar_personality"]
          tom: Database["public"]["Enums"]["avatar_tone"]
          categoria: Database["public"]["Enums"]["avatar_category"]
          avatar: string
          avatar_type: string
          background: string
          interests: string
          created_at: string
        }[]
      }
      list_system_avatars: {
        Args: { limit_count?: number }
        Returns: Json
      }
      mark_notification_sent: {
        Args: { p_user_id: string; p_avatar_id: string }
        Returns: undefined
      }
    }
    Enums: {
      avatar_category:
        | "business"
        | "education"
        | "health"
        | "creative"
        | "technical"
        | "personal"
      avatar_personality:
        | "friend"
        | "consultant"
        | "colleague"
        | "mentor"
        | "coach"
        | "therapist"
      avatar_tone:
        | "friendly"
        | "formal"
        | "playful"
        | "empathetic"
        | "witty"
        | "wise"
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
      avatar_category: [
        "business",
        "education",
        "health",
        "creative",
        "technical",
        "personal",
      ],
      avatar_personality: [
        "friend",
        "consultant",
        "colleague",
        "mentor",
        "coach",
        "therapist",
      ],
      avatar_tone: [
        "friendly",
        "formal",
        "playful",
        "empathetic",
        "witty",
        "wise",
      ],
    },
  },
} as const
