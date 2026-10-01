import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AsociacionPrincipal() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  
  const [nombreAsociacion, setNombreAsociacion] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  useEffect(() => {
    const inicializar = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);

      try {
        const idDetectado = await AsyncStorage.getItem('@asociacion_id_logueada');
        
        if (idDetectado) {
          // 🔥 ACÁ ESTÁ LA MAGIA: Cambiamos .single() por .limit(1).maybeSingle()
          const { data, error } = await supabase
            .from('asociaciones')
            .select('nombre, logo_url')
            .eq('id', idDetectado)
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            setNombreAsociacion(data.nombre || '');
            setLogoUri(data.logo_url || null);
          } else if (error) {
            console.log("Error de Supabase cargando perfil:", error.message);
          }
        }
      } catch (error) {
        console.log("Error cargando el perfil de la asociación:", error);
      }
    };
    
    inicializar();
  }, []);

  const cerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('@asociacion_id_logueada'); 
      router.replace('/'); 
    } catch (error) {
      console.log("Error al cerrar sesión", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />

      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        
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
          
          <Text style={styles.asociacionTitle}>
            {nombreAsociacion || (idiomaActual === 'es' ? 'Asociación Americana Taekwondo' : 'American Taekwondo Association')}
          </Text>
        </View>

        <View style={styles.gridSection}>
          
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