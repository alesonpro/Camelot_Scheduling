// Hand-written to match supabase/migrations/0001-0009 exactly. Regenerate
// with the Supabase CLI once available:
//   npx supabase gen types typescript --project-id <ref> --schema public > src/lib/db/types.ts
// Keep in sync with migrations until then.

export type UserRole = "admin" | "receptionist" | "agent";
export type AvailabilityExceptionType = "unavailable" | "available";
export type ShowingStatus = "scheduled" | "confirmed" | "cancelled" | "completed" | "rescheduled";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          phone: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: UserRole;
          phone?: string | null;
          active?: boolean;
        };
        Update: Partial<{
          email: string;
          name: string;
          role: UserRole;
          phone: string | null;
          active: boolean;
        }>;
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string | null;
          active?: boolean;
        };
        Update: Partial<{
          name: string;
          email: string;
          phone: string | null;
          active: boolean;
        }>;
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_rules: {
        Row: {
          id: string;
          agent_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          timezone: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          timezone?: string;
          active?: boolean;
        };
        Update: Partial<{
          day_of_week: number;
          start_time: string;
          end_time: string;
          timezone: string;
          active: boolean;
        }>;
        Relationships: [
          {
            foreignKeyName: "availability_rules_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_exceptions: {
        Row: {
          id: string;
          agent_id: string;
          date: string;
          start_time: string | null;
          end_time: string | null;
          type: AvailabilityExceptionType;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          date: string;
          start_time?: string | null;
          end_time?: string | null;
          type: AvailabilityExceptionType;
          reason?: string | null;
        };
        Update: Partial<{
          date: string;
          start_time: string | null;
          end_time: string | null;
          type: AvailabilityExceptionType;
          reason: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          id: string;
          address: string;
          city: string;
          state: string;
          zip: string;
          property_name: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          city: string;
          state: string;
          zip: string;
          property_name?: string | null;
          active?: boolean;
        };
        Update: Partial<{
          address: string;
          city: string;
          state: string;
          zip: string;
          property_name: string | null;
          active: boolean;
        }>;
        Relationships: [];
      };
      prospects: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
        };
        Update: Partial<{
          name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
        }>;
        Relationships: [];
      };
      showings: {
        Row: {
          id: string;
          agent_id: string;
          property_id: string;
          prospect_id: string | null;
          start_time: string;
          end_time: string;
          status: ShowingStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          property_id: string;
          prospect_id?: string | null;
          start_time: string;
          end_time: string;
          status?: ShowingStatus;
          notes?: string | null;
        };
        Update: Partial<{
          agent_id: string;
          property_id: string;
          prospect_id: string | null;
          start_time: string;
          end_time: string;
          status: ShowingStatus;
          notes: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "showings_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "showings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "showings_prospect_id_fkey";
            columns: ["prospect_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      current_agent_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      availability_exception_type: AvailabilityExceptionType;
      showing_status: ShowingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
