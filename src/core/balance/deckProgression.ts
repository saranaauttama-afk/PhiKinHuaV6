// Curated, class-specific progression roles. Offers still obey poolFor's unlock rules.
import type {ClassId} from '../classes';

export const PROGRESSION_PRICES = {Common:20,Uncommon:35,Rare:60,Legendary:90} as const;
export const PROGRESSION_SERVICES = {reroll:10,remove:[0,20,35],upgrade:[0,30]} as const;
export const progressionEnabled = (classId?:ClassId) => classId==='warrior'||classId==='shaman';

/**
 * Card access along the route (owner 16 Oct 2026, "เหมือน NOTFM ที่ร้านและหีบเยอะ").
 * The reduced starters only work if the deck grows early: in v1 night 1 offered one card shop
 * and a 50% chest before the boss (the first card reward), so a weak starter fought 7 fights
 * with 1–2 new cards. Chests are guaranteed (`treasure`: free pick 1 of 2) instead of a coin flip.
 * Index = night − 1.
 */
export const PROGRESSION_ROUTE = {cardShops:[2,1,1], chests:[2,2,2]} as const;
export function progressionRoute(classId:ClassId|undefined,night:number){
 if(!progressionEnabled(classId))return;
 const n=Math.max(1,Math.min(3,night))-1;
 return {cardShops:PROGRESSION_ROUTE.cardShops[n],chests:PROGRESSION_ROUTE.chests[n]};
}

export type BuildFocus = 'warrior_rhythm'|'warrior_bruise'|'warrior_guard'|'shaman_water'|'shaman_yant'|'shaman_familiar';
export const BUILD_CATALOG: Record<BuildFocus,{engine:readonly string[];payoff:readonly string[];support:readonly string[]}> = {
  "warrior_rhythm": {
    "engine": [
      "war_cry",
      "measured_breath",
      "iron_will"
    ],
    "payoff": [
      "threefold_strike",
      "double_hook",
      "triple_knee",
      "uppercut"
    ],
    "support": [
      "mongkhon",
      "call_pi",
      "oiled_wraps",
      "guarding_elbow",
      "shadow_flurry"
    ]
  },
  "warrior_bruise": {
    "engine": [
      "checking_knee",
      "short_hook",
      "stare_down",
      "double_hook"
    ],
    "payoff": [
      "neck_kick",
      "flying_knee",
      "clinch_knee",
      "reverse_elbow"
    ],
    "support": [
      "parry_bait",
      "bruise_guard",
      "glass_wraps",
      "last_bell_elbow"
    ]
  },
  "warrior_guard": {
    "engine": [
      "call_pupil",
      "corner_towel",
      "call_corner"
    ],
    "payoff": [
      "gate_watch",
      "ward_riposte",
      "bruise_guard",
      "stand_firm"
    ],
    "support": [
      "yantra_shorts",
      "arm_prajiad",
      "holy_water_spray",
      "call_senior",
      "call_old_master"
    ]
  },
  "shaman_water": {
    "engine": [
      "lotus_dip",
      "yant_ladle",
      "ghost_possession"
    ],
    "payoff": [
      "mouth_spray",
      "boil_water",
      "flowing_chant",
      "full_bowl"
    ],
    "support": [
      "bronze_bowl",
      "water_curtain",
      "equipment_shaman_staff",
      "cleansing_bath",
      "overflow_trough"
    ]
  },
  "shaman_yant": {
    "engine": [
      "paper_yant",
      "yant_ladle",
      "threaded_needle"
    ],
    "payoff": [
      "nail_coffin",
      "yant_burst",
      "yantra_snare"
    ],
    "support": [
      "yantra_in_hand",
      "sai_sin_bind",
      "sai_sin",
      "equipment_nang_tani_skull",
      "red_yant_cloth"
    ]
  },
  "shaman_familiar": {
    "engine": [
      "spirit_feast",
      "familiar_ward",
      "read_omen"
    ],
    "payoff": [
      "khwai_thanu_call",
      "hun_payon_call",
      "rak_yom_call"
    ],
    "support": [
      "spirit_rice_scatter",
      "water_bowl_guard",
      "golden_child_call",
      "hong_phrai_call",
      "bone_rosary"
    ]
  }
} as const;
export const REPLACEMENT_CARDS: Partial<Record<ClassId,readonly string[]>> = {
  "warrior": [
    "straight_punch",
    "push_kick",
    "guarding_elbow",
    "checking_knee",
    "neck_kick",
    "gate_watch",
    "ward_riposte",
    "corner_towel"
  ],
  "shaman": [
    "lotus_dip",
    "bamboo_volley",
    "rice_throw",
    "ghost_debt",
    "mouth_spray",
    "yantra_in_hand",
    "familiar_ward",
    "curse_chant"
  ]
} as const;
export function focusesFor(cls?: ClassId): BuildFocus[] {
 if(cls==='warrior')return ['warrior_rhythm','warrior_bruise','warrior_guard'];
 if(cls==='shaman')return ['shaman_water','shaman_yant','shaman_familiar'];
 return [];
}
