/** Review export mounts the exact prototype component, not a duplicate scene. */
import React from 'react';
import {registerRootComponent} from 'expo';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import PaperDioramaPreview from '../app/paper-diorama';
import {useGameSettings} from '../app/components/Settings';
function PreviewRoot(){React.useEffect(()=>{void useGameSettings.getState().hydrate();},[]);return <SafeAreaProvider><GestureHandlerRootView style={{flex:1}}><PaperDioramaPreview/></GestureHandlerRootView></SafeAreaProvider>;}
registerRootComponent(PreviewRoot);
