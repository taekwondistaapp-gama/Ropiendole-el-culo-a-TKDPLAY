import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

        // Traemos el sponsor principal activo de Supabase
        const { data, error } = await supabase
          .from('sponsors')
          .select('*')
          .eq('nivel', 'principal')
          .eq('activo', true)
          .limit(1)
          .single();

        if (!error && data) {
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
      // Opción B: Verificamos si el usuario ya inició sesión antes
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Si ya está logueado, va directo al panel operativo de la asociación
        router.replace('/asociacion_principal');
      } else {
        // Si no está logueado, lo mandamos a que elija cómo ingresar
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

      {/* ESQUINA SUPERIOR IZQUIERDA (Original) */}
      <Image 
        source={require('../assets/images/esquina_roja_larga.png')} 
        style={styles.esquinaTopLeft} 
        resizeMode="stretch"
      />

      {/* ESQUINA INFERIOR DERECHA (Con Flip Vertical y Horizontal perfecto para calzar el ángulo) */}
      <Image 
        source={require('../assets/images/esquina_roja_larga.png')} 
        style={styles.esquinaBottomRight} 
        resizeMode="stretch"
      />

      {/* Botón Saltar flotante arriba */}
      <TouchableOpacity style={styles.botonCerrar} onPress={avanzarSiguientePantalla} activeOpacity={0.7}>
        <Text style={styles.textoCerrar}>{idiomaActual === 'es' ? 'Saltar ✕' : 'Skip ✕'}</Text>
      </TouchableOpacity>

      {/* Contenedor de la Publicidad a Pantalla Completa */}
      <View style={styles.contenidoPublicidad}>
        {cargando ? (
          <ActivityIndicator size="large" color="#e60000" />
        ) : urlSponsor ? (
          <Image source={{ uri: urlSponsor }} style={styles.bannerImg} resizeMode="cover" />
        ) : (
          // Tu mockup exacto gris para las pruebas gráficas de pantalla completa
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
  // Reemplazá estas dos clases dentro de tu StyleSheet.create en app/publicidad_inicial.tsx:

  esquinaTopLeft: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 140, // Controlá el ancho que quieras
    height: 35, // Controlá el alto que quieras
    zIndex: 10,
    transform: [
      { scaleX: 1 }, // Flip Horizontal
      { scaleY: -1 }  // Flip Vertical
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
    width: 140, // Controlá el ancho que quieras
    height: 35, // Controlá el alto que quieras
    zIndex: 10,
    transform: [
      { scaleX: -1 }, // Flip Horizontal
      { scaleY: 1 }  // Flip Vertical
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