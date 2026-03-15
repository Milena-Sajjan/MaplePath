export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          status_type: 'international_student' | 'permanent_resident' | 'visitor' | 'refugee' | null
          university: string | null
          program: string | null
          arrival_date: string | null
          city: string
          province: string
          country_of_origin: string | null
          languages: string[]
          sin_obtained: boolean
          ohip_status: string
          study_permit_expiry: string | null
          preferred_language: string
          onboarding_complete: boolean
          email_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          status_type?: 'international_student' | 'permanent_resident' | 'visitor' | 'refugee' | null
          university?: string | null
          program?: string | null
          arrival_date?: string | null
          city?: string
          province?: string
          country_of_origin?: string | null
          languages?: string[]
          sin_obtained?: boolean
          ohip_status?: string
          study_permit_expiry?: string | null
          preferred_language?: string
          onboarding_complete?: boolean
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          status_type?: 'international_student' | 'permanent_resident' | 'visitor' | 'refugee' | null
          university?: string | null
          program?: string | null
          arrival_date?: string | null
          city?: string
          province?: string
          country_of_origin?: string | null
          languages?: string[]
          sin_obtained?: boolean
          ohip_status?: string
          study_permit_expiry?: string | null
          preferred_language?: string
          onboarding_complete?: boolean
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_progress: {
        Row: {
          id: string
          user_id: string | null
          step_id: string
          phase: number
          completed: boolean
          completed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          step_id: string
          phase: number
          completed?: boolean
          completed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          step_id?: string
          phase?: number
          completed?: boolean
          completed_at?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      map_pins: {
        Row: {
          id: string
          user_id: string | null
          title: string
          category: 'food' | 'community' | 'health' | 'banking' | 'education' | 'transport' | 'housing' | 'worship' | 'recreation' | 'other'
          description: string | null
          address: string | null
          latitude: number
          longitude: number
          city: string | null
          languages: string[] | null
          website: string | null
          phone: string | null
          hours: string | null
          verified: boolean
          upvotes: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          category: string
          description?: string | null
          address?: string | null
          latitude: number
          longitude: number
          city?: string | null
          languages?: string[] | null
          website?: string | null
          phone?: string | null
          hours?: string | null
          verified?: boolean
          upvotes?: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          category?: string
          description?: string | null
          address?: string | null
          latitude?: number
          longitude?: number
          city?: string | null
          languages?: string[] | null
          website?: string | null
          phone?: string | null
          hours?: string | null
          verified?: boolean
          upvotes?: number
          image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          sources: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          role: string
          content: string
          sources?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          role?: string
          content?: string
          sources?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          id: string
          title: string
          content: string
          source_url: string | null
          source_name: string | null
          category: string | null
          province: string | null
          status_type: string[] | null
          language: string
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          source_url?: string | null
          source_name?: string | null
          category?: string | null
          province?: string | null
          status_type?: string[] | null
          language?: string
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          source_url?: string | null
          source_name?: string | null
          category?: string | null
          province?: string | null
          status_type?: string[] | null
          language?: string
          embedding?: number[] | null
          created_at?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          id: string
          user_id: string | null
          title: string
          content: string
          category: 'housing' | 'jobs' | 'immigration' | 'banking' | 'health' | 'community' | 'education' | 'general'
          tags: string[]
          city: string | null
          upvotes: number
          reply_count: number
          pinned: boolean
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          content: string
          category: string
          tags?: string[]
          city?: string | null
          upvotes?: number
          reply_count?: number
          pinned?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          content?: string
          category?: string
          tags?: string[]
          city?: string | null
          upvotes?: number
          reply_count?: number
          pinned?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          id: string
          post_id: string | null
          user_id: string | null
          content: string
          upvotes: number
          is_answer: boolean
          created_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          user_id?: string | null
          content: string
          upvotes?: number
          is_answer?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          user_id?: string | null
          content?: string
          upvotes?: number
          is_answer?: boolean
          created_at?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          id: string
          posted_by: string | null
          title: string
          company: string
          description: string
          requirements: string | null
          job_type: 'on_campus' | 'off_campus' | 'co_op' | 'internship' | 'part_time' | 'full_time' | 'volunteer'
          salary_range: string | null
          location: string | null
          city: string | null
          remote: boolean
          status_types: string[] | null
          languages_needed: string[] | null
          application_url: string | null
          contact_email: string | null
          deadline: string | null
          is_active: boolean
          views: number
          created_at: string
        }
        Insert: {
          id?: string
          posted_by?: string | null
          title: string
          company: string
          description: string
          requirements?: string | null
          job_type: string
          salary_range?: string | null
          location?: string | null
          city?: string | null
          remote?: boolean
          status_types?: string[] | null
          languages_needed?: string[] | null
          application_url?: string | null
          contact_email?: string | null
          deadline?: string | null
          is_active?: boolean
          views?: number
          created_at?: string
        }
        Update: {
          id?: string
          posted_by?: string | null
          title?: string
          company?: string
          description?: string
          requirements?: string | null
          job_type?: string
          salary_range?: string | null
          location?: string | null
          city?: string | null
          remote?: boolean
          status_types?: string[] | null
          languages_needed?: string[] | null
          application_url?: string | null
          contact_email?: string | null
          deadline?: string | null
          is_active?: boolean
          views?: number
          created_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          id: string
          job_id: string | null
          user_id: string | null
          cover_letter: string | null
          resume_url: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          user_id?: string | null
          cover_letter?: string | null
          resume_url?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          user_id?: string | null
          cover_letter?: string | null
          resume_url?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      housing_listings: {
        Row: {
          id: string
          user_id: string | null
          title: string
          description: string
          listing_type: 'room' | 'apartment' | 'house' | 'basement' | 'homestay' | 'roommate_wanted'
          price_monthly: number
          bedrooms: number | null
          bathrooms: number | null
          address: string | null
          city: string
          latitude: number | null
          longitude: number | null
          available_from: string | null
          furnished: boolean
          utilities: boolean
          pets_allowed: boolean
          gender_pref: string | null
          student_only: boolean
          images: string[]
          amenities: string[]
          languages: string[] | null
          is_active: boolean
          views: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          description: string
          listing_type: string
          price_monthly: number
          bedrooms?: number | null
          bathrooms?: number | null
          address?: string | null
          city: string
          latitude?: number | null
          longitude?: number | null
          available_from?: string | null
          furnished?: boolean
          utilities?: boolean
          pets_allowed?: boolean
          gender_pref?: string | null
          student_only?: boolean
          images?: string[]
          amenities?: string[]
          languages?: string[] | null
          is_active?: boolean
          views?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          description?: string
          listing_type?: string
          price_monthly?: number
          bedrooms?: number | null
          bathrooms?: number | null
          address?: string | null
          city?: string
          latitude?: number | null
          longitude?: number | null
          available_from?: string | null
          furnished?: boolean
          utilities?: boolean
          pets_allowed?: boolean
          gender_pref?: string | null
          student_only?: boolean
          images?: string[]
          amenities?: string[]
          languages?: string[] | null
          is_active?: boolean
          views?: number
          created_at?: string
        }
        Relationships: []
      }
      housing_inquiries: {
        Row: {
          id: string
          listing_id: string | null
          user_id: string | null
          message: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          listing_id?: string | null
          user_id?: string | null
          message: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string | null
          user_id?: string | null
          message?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          category: string
          title: string
          description: string | null
          url: string | null
          phone: string | null
          address: string | null
          city: string | null
          province: string | null
          language: string[]
          status_type: string[] | null
          free: boolean
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          title: string
          description?: string | null
          url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          language?: string[]
          status_type?: string[] | null
          free?: boolean
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          title?: string
          description?: string | null
          url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          language?: string[]
          status_type?: string[] | null
          free?: boolean
          verified?: boolean
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string | null
          title: string
          body: string | null
          read: boolean
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type?: string | null
          title: string
          body?: string | null
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string | null
          title?: string
          body?: string | null
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_knowledge: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          title: string
          content: string
          source_name: string
          source_url: string
          similarity: number
        }[]
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
