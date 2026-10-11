export function readDioramaSettings(raw:unknown){
 const s=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
 return {reducedMotion:s.reducedMotion===true,dioramaAnimation:s.dioramaAnimation!==false};
}
