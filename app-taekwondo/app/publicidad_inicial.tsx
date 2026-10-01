import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function PublicidadInicialScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [urlSponsor, setUrlSponsor] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarSponsor = async () => {
      try {
        const guardado = await AsyncStorage.getItem('@idioma_app');
        if (guardado) setIdiomaActual(guardado);

        // BLINDAJE: limit(1).maybeSingle() para evitar pantallas rojas si no hay sponsors activos
        const { data, error } = await supabase
          .from('sponsors')
          .select('*')
          .eq('nivel', 'principal')
          .eq('activo', true)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.log("Error de base de datos cargando sponsor:", error.message);
        }

        if (data) {
          setUrlSponsor(data.url_imagen);
        }
      } catch (err) {
        console.log("Error cargando publicidad inicial:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarSponsor();
  }, []);

  const avanzarSiguientePantalla = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.replace('/asociacion_principal');
      } else {
        router.replace('/seleccion_rol');
      }
    } catch (err) {
      console.log("Error en redirección de publicidad:", err);
      router.replace('/seleccion_rol');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Image 
        source={require('../assets/images/esquina_roja_larga.png')} 
        style={styles.esquinaTopLeft} 
        resizeMode="stretch"
      />

      <Image 
        source={require('../assets/images/esquina_roja_larga.png')} 
        style={styles.esquinaBottomRight} 
        resizeMode="stretch"
      />

      <TouchableOpacity style={styles.botonCerrar} onPress={avanzarSiguientePantalla} activeOpacity={0.7}>
        <Text style={styles.textoCerrar}>{idiomaActual === 'es' ? 'Saltar ✕' : 'Skip ✕'}</Text>
      </TouchableOpacity>

      <View style={styles.contenidoPublicidad}>
        {cargando ? (
          <ActivityIndicator size="large" color="#e60000" />
        ) : urlSponsor ? (
          <Image source={{ uri: urlSponsor }} style={styles.bannerImg} resizeMode="cover" />
        ) : (
          <View style={styles.cajaGrisMockup}>
            <Text style={styles.textoMockup}>PUBLICIDAD</Text>
          </View>
        )}
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  esquinaTopLeft: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 140, 
    height: 35, 
    zIndex: 10,
    transform: [
      { scaleX: 1 }, 
      { scaleY: -1 }  
    ],
  },
  botonCerrar: {
    position: 'absolute',
    top: 615,
    right: 5,
    backgroundColor: 'rgba(28, 28, 28, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 20,
  },
  esquinaBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 140, 
    height: 35, 
    zIndex: 10,
    transform: [
      { scaleX: -1 }, 
      { scaleY: 1 }  
    ],
  },
  textoCerrar: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  contenidoPublicidad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  cajaGrisMockup: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoMockup: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 3,
  },
});