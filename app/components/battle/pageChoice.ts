/** J8 alone may defer its undispatched action, for at most 600 ms. */
export function schedulePageChoice(reduced:boolean,callback:()=>void){
 if(reduced){callback();return ()=>{};}
 const timer=setTimeout(callback,600);
 return ()=>clearTimeout(timer);
}
