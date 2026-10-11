import conversions from '../data/packs/base/card_migrations_v33.json';
/** Remove retired battle payloads without resetting unrelated progression. */
export function stripObsoleteComboData<T>(data:T):T {
 const copy=JSON.parse(JSON.stringify(data));
 const visit=(node:any)=>{
  if(!node||typeof node!=='object')return;
  for(const key of ['combo','completedCombos','activeComboProgress','comboProgress','comboState','comboFeedback','nextCardsFree','comboDamageBoost','comboDebuffImmunity','antiComboDisruption'])delete node[key];
  if(node.playStyle==='combo')node.playStyle='balanced';
  if(node.midGameStrategy==='combo')node.midGameStrategy='control';
  if(node.metrics)delete node.metrics.combos;
  if(node.runMetrics)delete node.runMetrics.combos;
  const conversion=(conversions as Record<string,{before:Record<string,unknown>;after:Record<string,unknown>}>)[node.id];
  if(conversion&&node.type&&node.desc!==conversion.after.desc){
    for(const [key,value] of Object.entries(conversion.after)){
      node[key]=typeof value==='number'?value+Math.max(0,(node[key]??0)-Number(conversion.before[key]??0)):value;
    }
  }
  for(const value of Object.values(node))visit(value);
 };visit(copy);return copy;
}
