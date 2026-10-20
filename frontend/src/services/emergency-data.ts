import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type EmergencyType = Pick<Tables<'emergency_types'>, 'id' | 'name' | 'sort_order'>;
export type ContactInfo = Pick<
  Tables<'contacts'>,
  'id' | 'name' | 'description' | 'phone' | 'address' | 'campus' | 'sort_order'
>;
/** A contact plus the emergency types whose "Call for Help" list includes it. */
export type Contact = ContactInfo & { emergencies: string[] };
/** A guidance step plus the contacts it tells the user to call, in display order. */
export type GuidanceStep = Pick<
  Tables<'guidance_steps'>,
  'id' | 'section' | 'step_order' | 'title' | 'body' | 'link'
> & {
  contacts: ContactInfo[];
};

const contactColumns = 'id, name, description, phone, address, campus, sort_order';
export type Aed = Pick<Tables<'aeds'>, 'id' | 'floor' | 'room' | 'location_note' | 'sort_order'>;
export type AedBuilding = Pick<Tables<'buildings'>, 'id' | 'name' | 'address' | 'campus'> & { aeds: Aed[] };

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

/** Step-by-step guidance for one emergency category, in order, with each step's contacts. */
export async function getGuidanceSteps(emergencyTypeId: string): Promise<GuidanceStep[]> {
  const { data, error } = await supabase
    .from('guidance_steps')
    .select(
      `id, section, step_order, title, body, link, guidance_step_contacts(sort_order, contacts(${contactColumns}))`
    )
    .eq('emergency_type_id', emergencyTypeId)
    .order('step_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to load guidance for "${emergencyTypeId}": ${error.message}`);
  }
  return data.map(({ guidance_step_contacts, ...step }) => ({
    ...step,
    contacts: [...guidance_step_contacts].sort((a, b) => a.sort_order - b.sort_order).map((link) => link.contacts),
  }));
}

/** All emergency contacts, in display order, with the emergency types each one is listed for. */
export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select(`${contactColumns}, emergency_contacts(emergency_type_id)`)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to load contacts: ${error.message}`);
  }
  return data.map(({ emergency_contacts, ...contact }) => ({
    ...contact,
    emergencies: emergency_contacts.map((link) => link.emergency_type_id),
  }));
}

/** Buildings with their AEDs, sorted by building name; each building's AEDs are in display order. */
export async function getAedBuildings(): Promise<AedBuilding[]> {
  const { data, error } = await supabase
    .from('buildings')
    .select('id, name, address, campus, aeds(id, floor, room, location_note, sort_order)')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load AED locations: ${error.message}`);
  }
  return data.map((building) => ({
    ...building,
    aeds: [...building.aeds].sort((a, b) => a.sort_order - b.sort_order),
  }));
}
