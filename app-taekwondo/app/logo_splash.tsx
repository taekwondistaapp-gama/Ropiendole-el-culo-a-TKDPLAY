import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function LogoSplashScreen() {
  useEffect(() => {
    // RETENCIÓN DE MARCA: 2 segundos fijos mirando el logotipo oficial
    const temporizador = setTimeout(() => {
      router.replace('/publicidad_inicial');
    }, 2000);

    return () => clearTimeout(temporizador);
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image 
        source={require('../assets/images/logo_taekwondista.png')} 
        style={styles.splashImg} 
        resizeMode="contain"
      />

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center' 
  },
  splashImg: {
    width: width * 0.9,
    height: height * 0.9,
  }
});