import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
/** Hide grain and hand stitches; live text/art stay above this backing. */
export default function HideTexture({width,height,muted=false}:{width:number;height:number;muted?:boolean}) {
 const base=muted?'#b9b5aa':'#dfbe89',edge=muted?'#625e55':'#765334';
 return <Svg pointerEvents="none" width={width} height={height} viewBox="0 0 100 160" preserveAspectRatio="none" style={{position:'absolute',left:0,top:0}}>
  <Path d="M5 3L17 2L27 4L38 2L51 3L64 2L76 4L91 2L96 6L97 21L95 38L97 54L96 71L98 91L96 110L97 131L95 153L90 157L74 156L60 158L43 156L29 158L14 156L5 158L2 150L4 130L2 109L4 87L2 66L4 43L2 25L3 10Z" fill={base} stroke={edge} strokeWidth=".8"/>
  <Path d="M7 8Q28 4 45 7M56 8Q74 4 91 7M8 37Q4 66 8 96M92 55Q96 86 92 117M9 152Q34 156 58 152M68 151L89 153" fill="none" stroke={edge} opacity=".22"/>
  {Array.from({length:96},(_,i)=><Circle key={i} cx={8+(i*37)%84} cy={9+(i*53)%141} r={i%3===0?.45:.22} fill={edge} opacity=".14"/>)}
  {[14,35,56,77,98,119,140].flatMap((y,i)=>[<Path key={`l${i}`} d={`M2 ${y}l5 3`} stroke={edge} strokeWidth=".7"/>,<Path key={`r${i}`} d={`M93 ${y}l5 -3`} stroke={edge} strokeWidth=".7"/>])}
 </Svg>;
}
