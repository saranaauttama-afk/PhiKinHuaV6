import type {PageOffer} from '../../src/core/map/pages';
/** One audited object mapping shared by route, rest and destination screens. */
export const ENCOUNTER_OBJECTS={
 shop_card:require('../../assets/encounters/thai-v29/shop-card.webp'),
 shop_equipment:require('../../assets/encounters/thai-v29/shop-equipment.webp'),
 treasure:require('../../assets/encounters/enTreasureOpenMini.png'),
 treasure_single:require('../../assets/encounters/thai-v29/treasure-single.webp'),
 well:require('../../assets/encounters/enWell.png'),
 healing_shrine:require('../../assets/ui/blessing-shrine-object.png'),
 shop_upgrade:require('../../assets/encounters/thai-v29/upgrade-altar.webp'),
 shop_remove:require('../../assets/ui/remove-torn-card-b17.webp'),
 fusion_altar:require('../../assets/encounters/thai-v29/fusion-altar.webp'),
 story_event:require('../../assets/ui/trail-rest.png'),
 next_event:require('../../assets/encounters/thai-v29/next-path.webp'),
};
export function storyObject(eventId:string){
 if(eventId==='night_story_2'||eventId==='temple_bell')return require('../../assets/cards/thai-v24/bell_sound.webp');
 if(eventId==='night_story_3')return require('../../assets/encounters/thai-v29/story-root.webp');
 if(eventId==='night_story_4')return require('../../assets/encounters/thai-v29/story-water.webp');
 if(eventId==='night_story_5')return require('../../assets/encounters/thai-v29/story-manuscript.webp');
 if(eventId==='old_well')return ENCOUNTER_OBJECTS.well;
 if(eventId==='roadside_shrine'||eventId==='episode_blessing')return ENCOUNTER_OBJECTS.healing_shrine;
 if(eventId==='silk_on_tree'||eventId==='tanee_grove')return require('../../assets/cards/thai-v24/yantra_cloth.webp');
 if(eventId==='old_woman_rice')return require('../../assets/cards/thai-v24/monk_bowl.webp');
 if(eventId==='fork_in_mist')return ENCOUNTER_OBJECTS.next_event;
 if(eventId==='wandering_shaman')return require('../../assets/cards/thai-v24/held_charm.webp');
 if(eventId==='spirit_medium_trance')return require('../../assets/ui/ritual-jar.png');
 return ENCOUNTER_OBJECTS.story_event;
}
export function encounterObject(o:PageOffer){return o.kind==='story_event'?storyObject(o.eventId):o.kind==='monster'||o.kind==='boss'?undefined:ENCOUNTER_OBJECTS[o.kind];}
export function shopObject(kind?:string){return ENCOUNTER_OBJECTS[({card:'shop_card',equipment:'shop_equipment',upgrade:'shop_upgrade',remove:'shop_remove',healing:'healing_shrine',fusion:'fusion_altar'} as Record<string,keyof typeof ENCOUNTER_OBJECTS>)[kind??'']??kind as keyof typeof ENCOUNTER_OBJECTS];}
