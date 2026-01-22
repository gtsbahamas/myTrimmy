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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_prefix: string
          key_suffix: string
          key_hash: string
          permissions: Json
          created_at: string
          last_used_at: string | null
          revoked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_prefix: string
          key_suffix: string
          key_hash: string
          permissions?: Json
          created_at?: string
          last_used_at?: string | null
          revoked_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_prefix?: string
          key_suffix?: string
          key_hash?: string
          permissions?: Json
          created_at?: string
          last_used_at?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_images: {
        Row: {
          batch_job_id: string
          created_at: string
          error_message: string | null
          id: string
          image_id: string
          processed_at: string | null
          status: string
        }
        Insert: {
          batch_job_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_id: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          batch_job_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_id?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_images_batch_job_id_fkey"
            columns: ["batch_job_id"]
            isOneToOne: false
            referencedRelation: "batch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          failed_count: number
          id: string
          name: string
          preset_id: string | null
          processed_count: number
          settings: Json
          started_at: string | null
          status: string
          total_images: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          failed_count?: number
          id?: string
          name: string
          preset_id?: string | null
          processed_count?: number
          settings?: Json
          started_at?: string | null
          status?: string
          total_images?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          failed_count?: number
          id?: string
          name?: string
          preset_id?: string | null
          processed_count?: number
          settings?: Json
          started_at?: string | null
          status?: string
          total_images?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_jobs_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          created_at: string
          file_size: number | null
          filename: string
          height: number | null
          id: string
          mime_type: string | null
          original_url: string
          processed_url: string | null
          status: string
          updated_at: string
          user_id: string
          width: number | null
          active_edit_session_id: string | null
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          filename: string
          height?: number | null
          id?: string
          mime_type?: string | null
          original_url: string
          processed_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          width?: number | null
          active_edit_session_id?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number | null
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          original_url?: string
          processed_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          width?: number | null
          active_edit_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_active_edit_session_id_fkey"
            columns: ["active_edit_session_id"]
            isOneToOne: false
            referencedRelation: "edit_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      presets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_pro: boolean | null
          openai_api_key: string | null
          pro_purchased_at: string | null
          replicate_api_key: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_pro?: boolean | null
          openai_api_key?: string | null
          pro_purchased_at?: string | null
          replicate_api_key?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_pro?: boolean | null
          openai_api_key?: string | null
          pro_purchased_at?: string | null
          replicate_api_key?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          product_type: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          product_type: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          product_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      edit_sessions: {
        Row: {
          id: string
          image_id: string
          user_id: string
          current_position: number
          current_snapshot_url: string | null
          status: string
          created_at: string
          updated_at: string
          saved_at: string | null
          version: number
        }
        Insert: {
          id?: string
          image_id: string
          user_id: string
          current_position?: number
          current_snapshot_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          saved_at?: string | null
          version?: number
        }
        Update: {
          id?: string
          image_id?: string
          user_id?: string
          current_position?: number
          current_snapshot_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          saved_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "edit_sessions_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_operations: {
        Row: {
          id: string
          session_id: string
          position: number
          operation_type: string
          params: Json
          pre_snapshot_url: string | null
          post_snapshot_url: string | null
          created_at: string
          duration_ms: number | null
        }
        Insert: {
          id?: string
          session_id: string
          position: number
          operation_type: string
          params?: Json
          pre_snapshot_url?: string | null
          post_snapshot_url?: string | null
          created_at?: string
          duration_ms?: number | null
        }
        Update: {
          id?: string
          session_id?: string
          position?: number
          operation_type?: string
          params?: Json
          pre_snapshot_url?: string | null
          post_snapshot_url?: string | null
          created_at?: string
          duration_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edit_operations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "edit_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_bundles: {
        Row: {
          id: string
          user_id: string
          source_url: string
          site_analysis: Json
          style: string
          music_mood: string
          duration_seconds: number
          status: string
          validation_result: Json | null
          gemini_review: Json | null
          outputs: Json | null
          edit_count: number
          last_edited_at: string | null
          created_at: string
          completed_at: string | null
          error_message: string | null
          error_details: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          source_url: string
          site_analysis: Json
          style: string
          music_mood: string
          duration_seconds: number
          status?: string
          validation_result?: Json | null
          gemini_review?: Json | null
          outputs?: Json | null
          edit_count?: number
          last_edited_at?: string | null
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
          error_details?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          source_url?: string
          site_analysis?: Json
          style?: string
          music_mood?: string
          duration_seconds?: number
          status?: string
          validation_result?: Json | null
          gemini_review?: Json | null
          outputs?: Json | null
          edit_count?: number
          last_edited_at?: string | null
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
          error_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_bundles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          video_bundles_used: number
          video_bundles_limit: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          video_bundles_used?: number
          video_bundles_limit?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          video_bundles_used?: number
          video_bundles_limit?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_edits: {
        Row: {
          id: string
          video_bundle_id: string
          edit_type: string
          changes: Json
          applied_at: string
          applied_by: string
        }
        Insert: {
          id?: string
          video_bundle_id: string
          edit_type: string
          changes: Json
          applied_at?: string
          applied_by: string
        }
        Update: {
          id?: string
          video_bundle_id?: string
          edit_type?: string
          changes?: Json
          applied_at?: string
          applied_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_edits_video_bundle_id_fkey"
            columns: ["video_bundle_id"]
            isOneToOne: false
            referencedRelation: "video_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_edits_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fal_jobs: {
        Row: {
          id: string
          video_bundle_id: string
          fal_request_id: string
          job_type: string
          status: string
          output_url: string | null
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          video_bundle_id: string
          fal_request_id: string
          job_type: string
          status?: string
          output_url?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          video_bundle_id?: string
          fal_request_id?: string
          job_type?: string
          status?: string
          output_url?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fal_jobs_video_bundle_id_fkey"
            columns: ["video_bundle_id"]
            isOneToOne: false
            referencedRelation: "video_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_pro: boolean | null
          openai_api_key: string | null
          pro_purchased_at: string | null
          replicate_api_key: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

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
