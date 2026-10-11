import type {GameState,Command} from './types';
const receiptCommands=new Set<Command['type']>(['ChooseEventOption','EventChooseBlessing','TakeTreasureCard','TakeSingleTreasureCard','ChooseCardReward','ChooseLevelUpOption','TakeShop','TakeShopEquipment']);
function added<T>(before:T[],after:T[],key:(x:T)=>string):T[]{
 const counts=new Map<string,number>();for(const x of before)counts.set(key(x),(counts.get(key(x))??0)+1);
 return after.filter(x=>{const k=key(x),left=counts.get(k)??0;if(left){counts.set(k,left-1);return false;}return true;});
}
export function captureRewardReceipt(before:GameState,after:GameState,cmd:Command):void {
 if(!receiptCommands.has(cmd.type))return;
 const cardKey=(c:GameState['masterDeck'][number])=>`${c.id}:${c.upgradeLevel??Number(!!c.upgraded)}`;
 const cards=added(before.masterDeck??[],after.masterDeck??[],cardKey),lostCards=added(after.masterDeck??[],before.masterDeck??[],cardKey);
 const blessings=added(before.blessings??[],after.blessings??[],b=>b.id);
 const equipment=added([...(before.equipped??[]),...(before.backpack??[])],[...(after.equipped??[]),...(after.backpack??[])],e=>e.id);
 const hp=after.player.hp-before.player.hp,gold=(after.player.gold??0)-(before.player.gold??0);
 if(!cards.length&&!lostCards.length&&!blessings.length&&!equipment.length&&!hp&&!gold)return;
 after.rewardReceipt=JSON.parse(JSON.stringify({cards,blessings,equipment,lostCards,hp,gold}));
 if(after.pages?.adventure?.version===5&&after.phase==='shop')require('./map/adventure').rememberAdventureService(after);
}
