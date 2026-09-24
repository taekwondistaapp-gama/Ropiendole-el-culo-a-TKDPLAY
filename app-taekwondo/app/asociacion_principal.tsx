import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Stack, router } from 'expo-router';
import { diccionario } from '../constants/textos'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { supabase } from '../lib/supabase'; // <-- Importamos el motor de base de datos

export default function AsociacionPrincipal() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  
  // --- ESTADOS DINÁMICOS DEL PERFIL ---
  const [nombreAsociacion, setNombreAsociacion] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  // --- LÓGICA DE INICIO (Idioma + Datos del Perfil) ---
  useEffect(() => {
    const inicializar = async () => {
      // 1. Cargamos el idioma
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);

      try {
        // 2. Buscamos el ID del usuario logueado en la memoria
        const idDetectado = await AsyncStorage.getItem('@asociacion_id_logueada');
        
        if (idDetectado) {
          // 3. Traemos su nombre y logo de Supabase
          const { data, error } = await supabase
            .from('asociaciones')
            .select('nombre, logo_url')
            .eq('id', idDetectado)
            .single();

          if (!error && data) {
            setNombreAsociacion(data.nombre || '');
            setLogoUri(data.logo_url || null);
          }
        }
      } catch (error) {
        console.log("Error cargando el perfil de la asociación:", error);
      }
    };
    
    inicializar();
  }, []);

  // --- LÓGICA PARA CERRAR SESIÓN DE VERDAD ---
  const cerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('@asociacion_id_logueada'); // Borramos la credencial
      router.replace('/login'); // Lo pateamos a la pantalla de login
    } catch (error) {
      console.log("Error al cerrar sesión", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* FONDO ABSOLUTO */}
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />

      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        
        {/* SECCIÓN DEL LOGOTIPO DINÁMICO */}
        <View style={styles.headerSection}>
          <View style={styles.logotipoContenedor}>
            <Image source={require('../assets/images/angulo_rojo1.png')} style={styles.anguloArribaIzquierda} resizeMode="stretch" />
            <Image source={require('../assets/images/angulo_rojo2.png')} style={styles.anguloAbajoDerecha} resizeMode="stretch" />
            
            <View style={styles.logotipoBox}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.imagenLogoPerfil} resizeMode="cover" />
              ) : (
                <Text style={styles.logotipoText}>{idiomaActual === 'es' ? 'Logotipo' : 'Logo'}</Text>
              )}
            </View>
          </View>
          
          {/* Nombre de la asociación dinámico */}
          <Text style={styles.asociacionTitle}>
            {nombreAsociacion || (idiomaActual === 'es' ? 'Asociación Americana Taekwondo' : 'American Taekwondo Association')}
          </Text>
        </View>

        {/* GRILLA DE BOTONES PRINCIPALES INTERNACIONALIZADA */}
        <View style={styles.gridSection}>
          
          {/* Fila 1: Nuestras Escuelas y Nuestros Eventos */}
          <View style={styles.filaGrid}>
            <TouchableOpacity style={styles.botonGrilla} onPress={() => router.push('/escuelas')}>
              <Image 
                source={idiomaActual === 'es' 
                  ? require('../assets/images/boton_nuestrasescuelas.png') 
                  : require('../assets/images/boton_nuestrasescuelas_en.png')} 
                style={styles.imagenEscuelas} 
                resizeMode="contain" 
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonGrilla} onPress={() => router.push('/eventos')}>
              <Image 
                source={idiomaActual === 'es' 
                  ? require('../assets/images/boton_nuestroseventos.png') 
                  : require('../assets/images/boton_nuestroseventos_en.png')} 
                style={styles.imagenEventos} 
                resizeMode="contain" 
              />
            </TouchableOpacity>
          </View>

          {/* Fila 2: Biblioteca */}
          <View style={styles.filaCompleta}>
            <TouchableOpacity style={styles.botonBiblioteca} onPress={() => router.push('/biblioteca')}>
              <Image 
                source={idiomaActual === 'es' 
                  ? require('../assets/images/boton_biblioteca.png') 
                  : require('../assets/images/boton_biblioteca_en.png')} 
                style={styles.imagenBotonGrande} 
                resizeMode="contain" 
              />
            </TouchableOpacity>
          </View>

        </View>

        {/* SECCIÓN DE PIE DE PÁGINA */}
        <View style={styles.footerSection}>
          <TouchableOpacity onPress={cerrarSesion}>
            <Text style={styles.cerrarSesionText}>
              {idiomaActual === 'es' ? 'Cerrar Sesión' : 'Logout'}
            </Text>
          </TouchableOpacity>
          
          <Image source={require('../assets/images/pincelada_roja.png')} style={styles.separadorRojo} resizeMode="stretch" />
          
          <TouchableOpacity onPress={() => router.push('/actualizar_datos')}>
            {idiomaActual === 'es' ? (
              <Text style={styles.actualizarText}>
                Actualizar <Text style={styles.actualizarRed}>Datos Aquí</Text>
              </Text>
            ) : (
              <Text style={styles.actualizarText}>
                Update <Text style={styles.actualizarRed}>Data Here</Text>
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  scrollContainer: { flexGrow: 1, paddingTop: 40, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, opacity: 1, zIndex: -1 },
  headerSection: { alignItems: 'center', marginBottom: 50, width: '100%' },
  logotipoContenedor: { width: 140, height: 140, position: 'relative', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  
  // Le agregamos overflow hidden para que la imagen no se salga del cuadrado gris
  logotipoBox: { width: 120, height: 120, backgroundColor: '#555', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#777', zIndex: 1, overflow: 'hidden' },
  imagenLogoPerfil: { width: '100%', height: '100%' },
  
  logotipoText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  anguloArribaIzquierda: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, zIndex: 0 },
  anguloAbajoDerecha: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, zIndex: 0 },
  asociacionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 10 },
  gridSection: { width: '100%', marginBottom: 60 },
  filaGrid: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  botonGrilla: { width: '48%', alignItems: 'center' },
  filaCompleta: { width: '100%', alignItems: 'center' },
  botonBiblioteca: { width: '100%', alignItems: 'center' },
  imagenEscuelas: { width: '100%', height: 125, marginBottom: 10 },
  imagenEventos: { width: '100%', height: 135, marginBottom: 5 },
  imagenBotonPeque: { width: '100%', height: 130, marginBottom: 10 },
  imagenBotonGrande: { width: '100%', height: 175, marginBottom: 0 },
  footerSection: { width: '100%', alignItems: 'center', marginTop: 'auto' },
  cerrarSesionText: { color: '#fff', fontSize: 12, fontWeight: '700', marginBottom: 0 },
  separadorRojo: { width: '100%', height: 20, marginBottom: 15 },
  actualizarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actualizarRed: { color: '#e60000' }
});