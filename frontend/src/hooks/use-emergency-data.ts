import { useCallback } from 'react';

import { useQuery } from '@/hooks/use-query';
import { getAedBuildings, getContacts, getEmergencyTypes, getGuidanceSteps } from '@/services/emergency-data';

export function useEmergencyTypes() {
  return useQuery(getEmergencyTypes);
}

export function useGuidanceSteps(emergencyTypeId: string) {
  const fetcher = useCallback(() => getGuidanceSteps(emergencyTypeId), [emergencyTypeId]);
  return useQuery(fetcher);
}

export function useContacts() {
  return useQuery(getContacts);
}

export function useAedBuildings() {
  return useQuery(getAedBuildings);
}
