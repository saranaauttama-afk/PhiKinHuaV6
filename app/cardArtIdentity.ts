/** Unnamed fusion recipes preserve both source identities rather than a generic sword. */
export function fusedArtParents(id:string):string[] {
 if(!id.startsWith('fused_')||!id.includes('__'))return [];
 const parts=id.slice(6).split('__');
 return parts.length===2&&parts.every(Boolean)?parts:[];
}
