import React from 'react';
import {Image,Pressable,Text,View,type StyleProp,type ViewStyle} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {font,occupationBookColors,paper} from '../theme';
import {useScreenPadding} from '../useScreenPadding';

export const bookInk=occupationBookColors.ink,bookCream=occupationBookColors.cream,bookRed=occupationBookColors.red;
type Size={width:number;height:number};
/** Same illustrated desk and physical book on every pre-run screen. */
export function BookScreen({title='',onBack,children,footer}:{title?:string;onBack?:()=>void;children:React.ReactNode;footer:React.ReactNode}) {
 const pad=useScreenPadding();
 const [bounds,setBounds]=React.useState<Size>({width:0,height:0});
 return <View style={{flex:1,backgroundColor:occupationBookColors.backdrop}} onLayout={e=>{const {width,height}=e.nativeEvent.layout;setBounds(s=>s.width===width&&s.height===height?s:{width,height});}}>
  <Image accessible={false} source={require('../../assets/ui/occupation-book/desk.png')} resizeMode="cover" style={{position:'absolute',width:bounds.width,height:bounds.height}}/>
  <View style={{flex:1,paddingTop:pad.top,paddingBottom:pad.bottom}}>
   <View style={{height:40,flexDirection:'row',alignItems:'center',paddingHorizontal:10,gap:8}}>
    {onBack?<BookArrow label="กลับ" direction="left" onPress={onBack}/>:<View style={{width:44}}/>}
    {title?<Text accessibilityRole="header" style={{flex:1,fontFamily:font.display,fontSize:20,lineHeight:28,textAlign:'center',color:bookCream}}>{title}</Text>:<View style={{flex:1}}/>}<View style={{width:44}}/>
   </View>
   {children}
   <View style={{alignItems:'center',paddingHorizontal:26,paddingTop:8,gap:4}}>{footer}</View>
  </View>
 </View>;
}
export function BookStage({cover=false,children,testID}:{cover?:boolean;children:(size:Size)=>React.ReactNode;testID?:string}) {
 const [space,setSpace]=React.useState<Size>({width:0,height:0});
 // Fit the artwork without stretching, including short portrait devices.
 const width=Math.max(0,Math.min(480,space.width-12,(space.height-6)/1.5)),height=width*1.5;
 return <View style={{flex:1,alignItems:'center',justifyContent:'center'}} onLayout={e=>{const {width,height}=e.nativeEvent.layout;setSpace(s=>s.width===width&&s.height===height?s:{width,height});}}>
  {width>0&&<View testID={testID} style={{width,height}}><Image accessible={false} source={cover?require('../../assets/ui/occupation-book/cover.png'):require('../../assets/ui/occupation-book/open.png')} resizeMode="contain" style={{position:'absolute',width,height}}/>{children({width,height})}</View>}
 </View>;
}
export function BookPage({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}) {
 return <View style={[{position:'absolute',left:'23%',right:'5%',top:'9%',bottom:'7%'},style]}>{children}</View>;
}
export function BookButton({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>({width:'100%',maxWidth:380,minHeight:54,opacity:disabled?.5:pressed?.75:1})}>
  <View style={{minHeight:50,paddingHorizontal:18,paddingVertical:9,justifyContent:'center',backgroundColor:bookCream,borderWidth:2,borderColor:bookInk,borderRadius:3}}><Text style={{fontFamily:font.display,fontSize:21,lineHeight:30,color:bookInk,textAlign:'center'}}>{label}</Text></View>
 </Pressable>;
}
export function BookArrow({label,direction,onPress,disabled=false,style}:{label:string;direction:'left'|'right';onPress:()=>void;disabled?:boolean;style?:StyleProp<ViewStyle>}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[{width:44,height:48,justifyContent:'center',alignItems:'center',opacity:disabled?.25:pressed?.6:1},style]}>
  <Svg accessible={false} width={32} height={36} viewBox="0 0 32 36"><Path d={direction==='left'?'M27 2 L4 18 L27 34 L24 20 L25 15 Z':'M5 2 L28 18 L5 34 L8 20 L7 15 Z'} fill={bookCream} stroke={bookInk} strokeWidth={2}/></Svg>
 </Pressable>;
}
export function InkTitle({children}:{children:string}) {
 return <View style={{minHeight:38,justifyContent:'center'}}><Svg accessible={false} width="100%" height="100%" viewBox="0 0 300 40" preserveAspectRatio="none" style={{position:'absolute'}}><Path d="M9 3 L286 1 L278 6 L298 8 L288 15 L300 19 L283 25 L294 29 L276 34 L288 39 L5 36 L15 31 L0 28 L12 20 L3 13 L17 9 Z" fill={bookInk}/></Svg><Text accessibilityRole="header" style={{fontFamily:font.display,fontSize:24,lineHeight:34,textAlign:'center',color:bookCream,paddingHorizontal:12}}>{children}</Text></View>;
}
export function BookStamp({value,complete,selected=false,disabled=false,onPress}:{value:number;complete:boolean;selected?:boolean;disabled?:boolean;onPress?:()=>void}) {
 const color=complete?bookRed:disabled?occupationBookColors.disabled:paper.muted;
 const seal=<View style={{width:36,height:36,borderRadius:18,borderWidth:selected?2:1,borderColor:color,backgroundColor:selected?occupationBookColors.selected:'transparent',alignItems:'center',justifyContent:'center',transform:[{rotate:complete?'-6deg':'0deg'}]}}><Text style={{fontFamily:font.heading,fontSize:19,lineHeight:27,color}}>{value}</Text>{complete&&<Text style={{position:'absolute',right:-3,top:-5,fontFamily:font.heading,fontSize:13,color:bookRed}}>✓</Text>}</View>;
 return onPress?<Pressable accessibilityRole="button" accessibilityLabel={'ดูระดับอาถรรพ์ '+value} accessibilityState={{selected}} onPress={onPress} style={{minWidth:44,minHeight:48,alignItems:'center',justifyContent:'center'}}>{seal}</Pressable>:<View accessible accessibilityLabel={'คืน '+value+(complete?' ผ่านแล้ว':' ยังไม่ผ่าน')} style={{minWidth:36,minHeight:40,justifyContent:'center'}}>{seal}</View>;
}
