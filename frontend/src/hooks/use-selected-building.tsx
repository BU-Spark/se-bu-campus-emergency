import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AedBuilding } from '@/services/emergency-data';

type BuildingSelection = {
  building?: AedBuilding;
  selectBuilding: (building: AedBuilding | undefined) => void;
};
const BuildingContext = createContext<BuildingSelection>({ selectBuilding: () => {} });

/** A manual choice remains authoritative across screens until the user clears it. */
export function BuildingProvider({ children }: { children: ReactNode }) {
  const [building, selectBuilding] = useState<AedBuilding>();
  return <BuildingContext.Provider value={{ building, selectBuilding }}>{children}</BuildingContext.Provider>;
}
export const useSelectedBuilding = () => useContext(BuildingContext);

export function contactCampus(building: AedBuilding | undefined, detected?: 'CRC' | 'MED') {
  if (!building) return detected;
  // No Fenway-specific contacts are supplied. Do not silently label them as CRC.
  return building.campus === 'CRC' || building.campus === 'MED' ? building.campus : undefined;
}
