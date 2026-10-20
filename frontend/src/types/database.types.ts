export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      aeds: {
        Row: {
          building_id: string;
          created_at: string;
          floor: string;
          id: string;
          location_note: string;
          room: string;
          sort_order: number;
        };
        Insert: {
          building_id: string;
          created_at?: string;
          floor: string;
          id: string;
          location_note: string;
          room: string;
          sort_order: number;
        };
        Update: {
          building_id?: string;
          created_at?: string;
          floor?: string;
          id?: string;
          location_note?: string;
          room?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'aeds_building_id_fkey';
            columns: ['building_id'];
            isOneToOne: false;
            referencedRelation: 'buildings';
            referencedColumns: ['id'];
          },
        ];
      };
      buildings: {
        Row: {
          address: string;
          campus: string;
          created_at: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
        };
        Insert: {
          address: string;
          campus: string;
          created_at?: string;
          id: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
        };
        Update: {
          address?: string;
          campus?: string;
          created_at?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          address: string | null;
          campus: string;
          created_at: string;
          description: string;
          id: string;
          name: string;
          phone: string;
          sort_order: number;
          source_url: string;
        };
        Insert: {
          address?: string | null;
          campus: string;
          created_at?: string;
          description: string;
          id: string;
          name: string;
          phone: string;
          sort_order: number;
          source_url: string;
        };
        Update: {
          address?: string | null;
          campus?: string;
          created_at?: string;
          description?: string;
          id?: string;
          name?: string;
          phone?: string;
          sort_order?: number;
          source_url?: string;
        };
        Relationships: [];
      };
      emergency_contacts: {
        Row: {
          contact_id: string;
          emergency_type_id: string;
        };
        Insert: {
          contact_id: string;
          emergency_type_id: string;
        };
        Update: {
          contact_id?: string;
          emergency_type_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'emergency_contacts_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'emergency_contacts_emergency_type_id_fkey';
            columns: ['emergency_type_id'];
            isOneToOne: false;
            referencedRelation: 'emergency_types';
            referencedColumns: ['id'];
          },
        ];
      };
      emergency_types: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
          source_url: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          name: string;
          sort_order: number;
          source_url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          source_url?: string;
        };
        Relationships: [];
      };
      guidance_step_contacts: {
        Row: {
          contact_id: string;
          emergency_type_id: string;
          sort_order: number;
          step_order: number;
        };
        Insert: {
          contact_id: string;
          emergency_type_id: string;
          sort_order: number;
          step_order: number;
        };
        Update: {
          contact_id?: string;
          emergency_type_id?: string;
          sort_order?: number;
          step_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'guidance_step_contacts_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'guidance_step_contacts_emergency_type_id_step_order_fkey';
            columns: ['emergency_type_id', 'step_order'];
            isOneToOne: false;
            referencedRelation: 'guidance_steps';
            referencedColumns: ['emergency_type_id', 'step_order'];
          },
        ];
      };
      guidance_steps: {
        Row: {
          body: string;
          created_at: string;
          emergency_type_id: string;
          id: number;
          link: string | null;
          section: string | null;
          step_order: number;
          title: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          emergency_type_id: string;
          id?: never;
          link?: string | null;
          section?: string | null;
          step_order: number;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          emergency_type_id?: string;
          id?: never;
          link?: string | null;
          section?: string | null;
          step_order?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'guidance_steps_emergency_type_id_fkey';
            columns: ['emergency_type_id'];
            isOneToOne: false;
            referencedRelation: 'emergency_types';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
