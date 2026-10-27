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
      appointments: {
        Row: {
          completed_at: string | null
          created_at: string
          external_booking_url: string | null
          external_reference: string | null
          id: string
          notes: string | null
          order_id: string | null
          product_id: string | null
          purpose: Database["public"]["Enums"]["appointment_purpose"] | null
          scheduled_for: string | null
          slot_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          external_booking_url?: string | null
          external_reference?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id?: string | null
          purpose?: Database["public"]["Enums"]["appointment_purpose"] | null
          scheduled_for?: string | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          external_booking_url?: string | null
          external_reference?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id?: string | null
          purpose?: Database["public"]["Enums"]["appointment_purpose"] | null
          scheduled_for?: string | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_signatures: {
        Row: {
          consent_template_id: string
          id: string
          order_id: string | null
          signature_text: string
          signed_at: string
          signed_ip: string | null
          signed_user_agent: string | null
          template_version: number
          user_id: string
        }
        Insert: {
          consent_template_id: string
          id?: string
          order_id?: string | null
          signature_text: string
          signed_at?: string
          signed_ip?: string | null
          signed_user_agent?: string | null
          template_version: number
          user_id: string
        }
        Update: {
          consent_template_id?: string
          id?: string
          order_id?: string | null
          signature_text?: string
          signed_at?: string
          signed_ip?: string | null
          signed_user_agent?: string | null
          template_version?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_signatures_consent_template_id_fkey"
            columns: ["consent_template_id"]
            isOneToOne: false
            referencedRelation: "consent_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_signatures_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_templates: {
        Row: {
          active: boolean
          applies_to: Database["public"]["Enums"]["product_category"] | null
          body: string
          created_at: string
          id: string
          scope: Database["public"]["Enums"]["consent_scope"]
          slug: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          applies_to?: Database["public"]["Enums"]["product_category"] | null
          body: string
          created_at?: string
          id?: string
          scope?: Database["public"]["Enums"]["consent_scope"]
          slug: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          applies_to?: Database["public"]["Enums"]["product_category"] | null
          body?: string
          created_at?: string
          id?: string
          scope?: Database["public"]["Enums"]["consent_scope"]
          slug?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          residency_state: string | null
          staff_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          residency_state?: string | null
          staff_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          residency_state?: string | null
          staff_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string
          description: string
          discount_type: string
          discount_value: number
          excludes_flagged_products: boolean
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_eligible_items: number
          min_order_cents: number
          starts_at: string
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          excludes_flagged_products?: boolean
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_eligible_items?: number
          min_order_cents?: number
          starts_at?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          excludes_flagged_products?: boolean
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_eligible_items?: number
          min_order_cents?: number
          starts_at?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      intake_responses: {
        Row: {
          allergies: string | null
          attestation_signed: boolean
          attestation_signed_at: string | null
          created_at: string
          current_medications: string | null
          has_cancer_history: boolean | null
          has_cardiac_condition: boolean | null
          has_endocrine_condition: boolean | null
          id: string
          is_pregnant_or_nursing: boolean | null
          medical_history: string | null
          residency_state: Database["public"]["Enums"]["us_state"]
          signed_ip: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string | null
          attestation_signed?: boolean
          attestation_signed_at?: string | null
          created_at?: string
          current_medications?: string | null
          has_cancer_history?: boolean | null
          has_cardiac_condition?: boolean | null
          has_endocrine_condition?: boolean | null
          id?: string
          is_pregnant_or_nursing?: boolean | null
          medical_history?: string | null
          residency_state: Database["public"]["Enums"]["us_state"]
          signed_ip?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string | null
          attestation_signed?: boolean
          attestation_signed_at?: string | null
          created_at?: string
          current_medications?: string | null
          has_cancer_history?: boolean | null
          has_cardiac_condition?: boolean | null
          has_endocrine_condition?: boolean | null
          id?: string
          is_pregnant_or_nursing?: boolean | null
          medical_history?: string | null
          residency_state?: Database["public"]["Enums"]["us_state"]
          signed_ip?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          panel_name: string
          product_id: string | null
          requisition_sent_at: string | null
          results_received_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["lab_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          panel_name: string
          product_id?: string | null
          requisition_sent_at?: string | null
          results_received_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["lab_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          panel_name?: string
          product_id?: string | null
          requisition_sent_at?: string | null
          results_received_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["lab_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["message_sender_role"]
          thread_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["message_sender_role"]
          thread_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
          thread_user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          notes: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"] | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          notes?: string | null
          order_id: string
          to_status?: Database["public"]["Enums"]["order_status"] | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          notes?: string | null
          order_id?: string
          to_status?: Database["public"]["Enums"]["order_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          add_ons: Json
          created_at: string
          id: string
          order_id: string
          pharmacy_snapshot:
            | Database["public"]["Enums"]["pharmacy_source"]
            | null
          product_category_snapshot: Database["public"]["Enums"]["product_category"]
          product_id: string
          product_name_snapshot: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          add_ons?: Json
          created_at?: string
          id?: string
          order_id: string
          pharmacy_snapshot?:
            | Database["public"]["Enums"]["pharmacy_source"]
            | null
          product_category_snapshot: Database["public"]["Enums"]["product_category"]
          product_id: string
          product_name_snapshot: string
          quantity?: number
          unit_price_cents: number
        }
        Update: {
          add_ons?: Json
          created_at?: string
          id?: string
          order_id?: string
          pharmacy_snapshot?:
            | Database["public"]["Enums"]["pharmacy_source"]
            | null
          product_category_snapshot?: Database["public"]["Enums"]["product_category"]
          product_id?: string
          product_name_snapshot?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          discount_cents: number
          has_recent_labs: boolean
          hold_captured_at: string | null
          hold_payment_intent: string | null
          id: string
          lab_payment_intent: string | null
          paid_at: string | null
          provider_notes: string | null
          rejected_reason: string | null
          requires_consultation: boolean
          requires_labs: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          discount_cents?: number
          has_recent_labs?: boolean
          hold_captured_at?: string | null
          hold_payment_intent?: string | null
          id?: string
          lab_payment_intent?: string | null
          paid_at?: string | null
          provider_notes?: string | null
          rejected_reason?: string | null
          requires_consultation?: boolean
          requires_labs?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          discount_cents?: number
          has_recent_labs?: boolean
          hold_captured_at?: string | null
          hold_payment_intent?: string | null
          id?: string
          lab_payment_intent?: string | null
          paid_at?: string | null
          provider_notes?: string | null
          rejected_reason?: string | null
          requires_consultation?: boolean
          requires_labs?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["patient_document_type"]
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["patient_document_type"]
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["patient_document_type"]
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_approvals: {
        Row: {
          consumed_at: string | null
          consumed_order_id: string | null
          created_at: string
          document_ids: string[]
          id: string
          patient_note: string | null
          previous_reason: string | null
          product_id: string
          reason: string | null
          requested_via: Database["public"]["Enums"]["product_approval_source"]
          resubmitted_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["product_approval_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          consumed_order_id?: string | null
          created_at?: string
          document_ids?: string[]
          id?: string
          patient_note?: string | null
          previous_reason?: string | null
          product_id: string
          reason?: string | null
          requested_via?: Database["public"]["Enums"]["product_approval_source"]
          resubmitted_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["product_approval_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          consumed_order_id?: string | null
          created_at?: string
          document_ids?: string[]
          id?: string
          patient_note?: string | null
          previous_reason?: string | null
          product_id?: string
          reason?: string | null
          requested_via?: Database["public"]["Enums"]["product_approval_source"]
          resubmitted_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["product_approval_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_approvals_consumed_order_id_fkey"
            columns: ["consumed_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approvals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_consents: {
        Row: {
          consent_slug: string
          created_at: string
          product_id: string
        }
        Insert: {
          consent_slug: string
          created_at?: string
          product_id: string
        }
        Update: {
          consent_slug?: string
          created_at?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_consents_consent_slug_fkey"
            columns: ["consent_slug"]
            isOneToOne: false
            referencedRelation: "consent_templates"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "product_consents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          bac_water_available: boolean
          bac_water_price_cents: number
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          intended_use: string | null
          is_controlled: boolean
          name: string
          pharmacy: Database["public"]["Enums"]["pharmacy_source"] | null
          price_cents: number
          promo_excluded: boolean
          purchase_ack_text: string | null
          refill_note: string | null
          refills_allowed: number | null
          repeat_labs_interval: string | null
          requires_appointment: boolean
          requires_consultation: boolean
          requires_labs: boolean
          risks: string | null
          slug: string
          supplies_available: boolean
          supplies_price_cents: number
          telehealth_addon_available: boolean
          telehealth_addon_price_cents: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bac_water_available?: boolean
          bac_water_price_cents?: number
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          intended_use?: string | null
          is_controlled?: boolean
          name: string
          pharmacy?: Database["public"]["Enums"]["pharmacy_source"] | null
          price_cents: number
          promo_excluded?: boolean
          purchase_ack_text?: string | null
          refill_note?: string | null
          refills_allowed?: number | null
          repeat_labs_interval?: string | null
          requires_appointment?: boolean
          requires_consultation?: boolean
          requires_labs?: boolean
          risks?: string | null
          slug: string
          supplies_available?: boolean
          supplies_price_cents?: number
          telehealth_addon_available?: boolean
          telehealth_addon_price_cents?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bac_water_available?: boolean
          bac_water_price_cents?: number
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          intended_use?: string | null
          is_controlled?: boolean
          name?: string
          pharmacy?: Database["public"]["Enums"]["pharmacy_source"] | null
          price_cents?: number
          promo_excluded?: boolean
          purchase_ack_text?: string | null
          refill_note?: string | null
          refills_allowed?: number | null
          repeat_labs_interval?: string | null
          requires_appointment?: boolean
          requires_consultation?: boolean
          requires_labs?: boolean
          risks?: string | null
          slug?: string
          supplies_available?: boolean
          supplies_price_cents?: number
          telehealth_addon_available?: boolean
          telehealth_addon_price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          residency_state: Database["public"]["Enums"]["us_state"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          residency_state?: Database["public"]["Enums"]["us_state"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          residency_state?: Database["public"]["Enums"]["us_state"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_availability_slots: {
        Row: {
          appointment_id: string | null
          booked_by: string | null
          created_at: string
          duration_minutes: number
          end_at: string
          id: string
          is_booked: boolean
          notes: string | null
          provider_user_id: string | null
          purpose: Database["public"]["Enums"]["appointment_purpose"]
          start_at: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          booked_by?: string | null
          created_at?: string
          duration_minutes: number
          end_at: string
          id?: string
          is_booked?: boolean
          notes?: string | null
          provider_user_id?: string | null
          purpose?: Database["public"]["Enums"]["appointment_purpose"]
          start_at: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          booked_by?: string | null
          created_at?: string
          duration_minutes?: number
          end_at?: string
          id?: string
          is_booked?: boolean
          notes?: string | null
          provider_user_id?: string | null
          purpose?: Database["public"]["Enums"]["appointment_purpose"]
          start_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_slots_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      refill_requests: {
        Row: {
          amount_cents: number
          captured_at: string | null
          created_at: string
          id: string
          order_id: string | null
          patient_note: string | null
          payment_intent: string | null
          product_id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sequence: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          captured_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          patient_note?: string | null
          payment_intent?: string | null
          product_id: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sequence?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          captured_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          patient_note?: string | null
          payment_intent?: string | null
          product_id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sequence?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refill_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refill_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
      book_slot:
        | {
            Args: {
              _notes?: string
              _order_id?: string
              _purpose: Database["public"]["Enums"]["appointment_purpose"]
              _slot_id: string
            }
            Returns: string
          }
        | {
            Args: {
              _notes?: string
              _order_id?: string
              _product_id?: string
              _purpose: Database["public"]["Enums"]["appointment_purpose"]
              _slot_id: string
            }
            Returns: string
          }
      book_slot_span: {
        Args: {
          _duration_minutes: number
          _notes?: string
          _order_id?: string
          _product_id?: string
          _purpose: Database["public"]["Enums"]["appointment_purpose"]
          _slot_id: string
        }
        Returns: string
      }
      cancel_appointment: {
        Args: { _appointment_id: string }
        Returns: boolean
      }
      consume_approval_for_order: {
        Args: { _order_id: string; _product_id: string; _user_id: string }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_use: { Args: { _code: string }; Returns: undefined }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      notify_staff: {
        Args: { _body: string; _link: string; _title: string; _type: string }
        Returns: undefined
      }
      notify_user: {
        Args: {
          _body: string
          _link: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      patient_label: { Args: { _user_id: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      validate_discount_coupon: {
        Args: { _code: string; _subtotal_cents: number }
        Returns: {
          code: string
          discount_cents: number
          discount_type: string
          discount_value: number
          error: string
        }[]
      }
      validate_discount_coupon_cart: {
        Args: { _code: string; _items: Json }
        Returns: {
          code: string
          discount_cents: number
          discount_type: string
          discount_value: number
          eligible_items: number
          eligible_subtotal_cents: number
          error: string
        }[]
      }
    }
    Enums: {
      app_role: "patient" | "provider" | "admin"
      appointment_purpose:
        | "pre_purchase_consult"
        | "telehealth_visit"
        | "lab_review"
        | "other"
      appointment_status: "scheduled" | "completed" | "no_show" | "cancelled"
      consent_scope: "always_required" | "per_product"
      lab_status:
        | "pending"
        | "requisition_sent"
        | "results_received"
        | "reviewed"
      message_sender_role: "patient" | "staff"
      order_status:
        | "pending"
        | "awaiting_intake"
        | "awaiting_labs"
        | "awaiting_consultation"
        | "under_review"
        | "approved"
        | "rejected"
        | "prescription_sent"
        | "fulfilled"
        | "cancelled"
      patient_document_type: "lab_result" | "id_license" | "other"
      pharmacy_source: "olympia" | "rush" | "empower" | "strive" | "other"
      product_approval_source: "uploaded_labs" | "purchased_labs"
      product_approval_status:
        | "pending"
        | "approved"
        | "disapproved"
        | "consumed"
      product_category:
        | "vitamins"
        | "peptides"
        | "lab_panel"
        | "hormone_trt"
        | "controlled"
        | "non_fda"
        | "telehealth_visit"
        | "dermatology"
        | "intimacy"
        | "erectile_dysfunction"
        | "bundle"
      us_state: "FL" | "NV"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["patient", "provider", "admin"],
      appointment_purpose: [
        "pre_purchase_consult",
        "telehealth_visit",
        "lab_review",
        "other",
      ],
      appointment_status: ["scheduled", "completed", "no_show", "cancelled"],
      consent_scope: ["always_required", "per_product"],
      lab_status: [
        "pending",
        "requisition_sent",
        "results_received",
        "reviewed",
      ],
      message_sender_role: ["patient", "staff"],
      order_status: [
        "pending",
        "awaiting_intake",
        "awaiting_labs",
        "awaiting_consultation",
        "under_review",
        "approved",
        "rejected",
        "prescription_sent",
        "fulfilled",
        "cancelled",
      ],
      patient_document_type: ["lab_result", "id_license", "other"],
      pharmacy_source: ["olympia", "rush", "empower", "strive", "other"],
      product_approval_source: ["uploaded_labs", "purchased_labs"],
      product_approval_status: [
        "pending",
        "approved",
        "disapproved",
        "consumed",
      ],
      product_category: [
        "vitamins",
        "peptides",
        "lab_panel",
        "hormone_trt",
        "controlled",
        "non_fda",
        "telehealth_visit",
        "dermatology",
        "intimacy",
        "erectile_dysfunction",
        "bundle",
      ],
      us_state: ["FL", "NV"],
    },
  },
} as const
