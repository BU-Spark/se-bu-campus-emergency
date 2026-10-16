import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type EmergencyType = Pick<Tables<'emergency_types'>, 'id' | 'name' | 'sort_order'>;
export type GuidanceStep = Pick<Tables<'guidance_steps'>, 'id' | 'section' | 'step_order' | 'title' | 'body'>;
export type Contact = Pick<Tables<'contacts'>, 'id' | 'name' | 'description' | 'phone' | 'campus' | 'sort_order'>;

/** All emergency categories, in dashboard order. */
export async function getEmergencyTypes(): Promise<EmergencyType[]> {
  const { data, error } = await supabase
    .from('emergency_types')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to load emergency types: ${error.message}`);
  }
  return data;
}

/** Step-by-step guidance for one emergency category, in order. */
export async function getGuidanceSteps(emergencyTypeId: string): Promise<GuidanceStep[]> {
  const { data, error } = await supabase
    .from('guidance_steps')
    .select('id, section, step_order, title, body')
    .eq('emergency_type_id', emergencyTypeId)
    .order('step_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to load guidance for "${emergencyTypeId}": ${error.message}`);
  }
  return data;
}

/** All emergency contacts, in display order. */
export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, description, phone, campus, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to load contacts: ${error.message}`);
  }
  return data;
}
