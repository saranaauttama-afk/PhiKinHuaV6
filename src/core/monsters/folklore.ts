import entries from './folklore.json';
import species from './folklore-types.json';

export type GhostLore = {
  name: string; species: string; origin: string; region: string;
  story: string; source: string; visual: string; original: boolean;
};
const types:Record<string,{species:string;origin:string;source:string}>=species;
export const GHOST_FOLKLORE: Record<string, GhostLore> = Object.fromEntries(
 Object.entries(entries).map(([id,entry])=>[id,{...types[entry.speciesKey],...entry}])
);
export function ghostLore(id: string): GhostLore | undefined { return GHOST_FOLKLORE[id]; }
