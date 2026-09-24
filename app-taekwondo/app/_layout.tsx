import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Slot, router } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase'; // Aseguramos que limpie sesión si existe

export default function RootLayout() {
  
  // FUNCIÓN EVANGELIZADORA RECALIBRADA: Borra todo y eyecta al inicio
  const resetUniversalA_Cero = async () => {
    try {
      // 1. Limpiamos la memoria local de desarrollo
      await AsyncStorage.removeItem('@idioma_app');
      await AsyncStorage.removeItem('@fecha_pub');
      await AsyncStorage.removeItem('@contador_pub');
      
      // 2. Cerramos sesión por seguridad para simular usuario nuevo
      await supabase.auth.signOut();
      
      console.log("🛠️ Dev Reset: Memoria limpia. Redirigiendo a cero absoluto...");
      
      // 3. Forzamos el salto a la pantalla inicial de la app de forma inmediata
      router.replace('/');
    } catch (err) {
      console.log("Error en Dev Reset:", err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050505' }}>
      
      {/* Esto renderiza la pantalla actual en la que estés parado */}
      <Slot />

      {/* 🔴 BOTÓN FLOTANTE INTERNIVEL DE DESARROLLO */}
      <TouchableOpacity 
        onPress={resetUniversalA_Cero} 
        style={styles.botonFlotanteDev}
        activeOpacity={0.7}
      >
        <Text style={styles.textoDev}>✕ DEV RESET</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  botonFlotanteDev: {
    position: 'absolute',
    top: 45, 
    left: 15, // LO PASAMOS A LA IZQUIERDA COMPLETAMENTE LIBRE
    backgroundColor: 'rgba(0, 255, 200, 0.15)', 
    borderColor: '#00ffcc',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    zIndex: 9999, 
  },
  textoDev: {
    color: '#00ffcc',
    fontSize: 9,
    fontWeight: 'bold',
  },
});