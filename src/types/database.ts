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
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          key_suffix: string
          last_used_at: string | null
          name: string
          permissions: Json
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          key_suffix: string
          last_used_at?: string | null
          name: string
          permissions?: Json
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          key_suffix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      edit_operations: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          operation_type: string
          params: Json
          position: number
          post_snapshot_url: string | null
          pre_snapshot_url: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          operation_type: string
          params?: Json
          position: number
          post_snapshot_url?: string | null
          pre_snapshot_url?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          operation_type?: string
          params?: Json
          position?: number
          post_snapshot_url?: string | null
          pre_snapshot_url?: string | null
          session_id?: string
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
      edit_sessions: {
        Row: {
          created_at: string
          current_position: number
          current_snapshot_url: string | null
          id: string
          image_id: string
          saved_at: string | null
          status: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          current_position?: number
          current_snapshot_url?: string | null
          id?: string
          image_id: string
          saved_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          current_position?: number
          current_snapshot_url?: string | null
          id?: string
          image_id?: string
          saved_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      fal_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          fal_request_id: string
          id: string
          job_type: string
          output_url: string | null
          status: string
          video_bundle_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          fal_request_id: string
          id?: string
          job_type: string
          output_url?: string | null
          status?: string
          video_bundle_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          fal_request_id?: string
          id?: string
          job_type?: string
          output_url?: string | null
          status?: string
          video_bundle_id?: string
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
      images: {
        Row: {
          active_edit_session_id: string | null
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
        }
        Insert: {
          active_edit_session_id?: string | null
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
        }
        Update: {
          active_edit_session_id?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "images_active_edit_session_id_fkey"
            columns: ["active_edit_session_id"]
            isOneToOne: false
            referencedRelation: "edit_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      render_jobs: {
        Row: {
          bucket_name: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          format: string
          id: string
          output_url: string | null
          progress: number | null
          render_id: string
          status: string
          thumbnail_url: string | null
          video_bundle_id: string
        }
        Insert: {
          bucket_name: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          format: string
          id?: string
          output_url?: string | null
          progress?: number | null
          render_id: string
          status?: string
          thumbnail_url?: string | null
          video_bundle_id: string
        }
        Update: {
          bucket_name?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          format?: string
          id?: string
          output_url?: string | null
          progress?: number | null
          render_id?: string
          status?: string
          thumbnail_url?: string | null
          video_bundle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "render_jobs_video_bundle_id_fkey"
            columns: ["video_bundle_id"]
            isOneToOne: false
            referencedRelation: "video_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
          video_bundles_limit: number | null
          video_bundles_used: number
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
          video_bundles_limit?: number | null
          video_bundles_used?: number
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
          video_bundles_limit?: number | null
          video_bundles_used?: number
        }
        Relationships: []
      }
      video_bundles: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_seconds: number
          edit_count: number
          error_details: Json | null
          error_message: string | null
          fal_assets: Json | null
          gemini_review: Json | null
          id: string
          last_edited_at: string | null
          music_mood: string
          outputs: Json | null
          site_analysis: Json
          source_url: string
          status: string
          style: string
          user_id: string
          validation_result: Json | null
          video_script: Json | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_seconds: number
          edit_count?: number
          error_details?: Json | null
          error_message?: string | null
          fal_assets?: Json | null
          gemini_review?: Json | null
          id?: string
          last_edited_at?: string | null
          music_mood: string
          outputs?: Json | null
          site_analysis: Json
          source_url: string
          status?: string
          style: string
          user_id: string
          validation_result?: Json | null
          video_script?: Json | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number
          edit_count?: number
          error_details?: Json | null
          error_message?: string | null
          fal_assets?: Json | null
          gemini_review?: Json | null
          id?: string
          last_edited_at?: string | null
          music_mood?: string
          outputs?: Json | null
          site_analysis?: Json
          source_url?: string
          status?: string
          style?: string
          user_id?: string
          validation_result?: Json | null
          video_script?: Json | null
        }
        Relationships: []
      }
      video_edits: {
        Row: {
          applied_at: string
          applied_by: string
          changes: Json
          edit_type: string
          id: string
          video_bundle_id: string
        }
        Insert: {
          applied_at?: string
          applied_by: string
          changes: Json
          edit_type: string
          id?: string
          video_bundle_id: string
        }
        Update: {
          applied_at?: string
          applied_by?: string
          changes?: Json
          edit_type?: string
          id?: string
          video_bundle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_edits_video_bundle_id_fkey"
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
      cleanup_stale_edit_sessions: { Args: never; Returns: number }
      current_user_profile: {
        Args: never
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
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
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
    Enums: {},
  },
} as const
