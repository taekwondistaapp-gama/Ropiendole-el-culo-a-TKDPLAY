import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function SeleccionRolScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');

  useEffect(() => {
    const obtenerIdioma = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
    };
    obtenerIdioma();
  }, []);

  // FUNCIÓN MAESTRA: Ahora TODOS van al Login primero.
  const manejarSeleccionRol = async (rol: 'asociacion' | 'escuela' | 'dojang' | 'practicante') => {
    try {
      await AsyncStorage.setItem('@rol_usuario', rol);
      router.push('/login'); 
    } catch (err) {
      console.log("Error guardando rol:", err);
      router.push('/login');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerContenedor}>
        <Image 
          source={require('../assets/images/logo_taekwondista.png')} 
          style={styles.marcaImg} 
          resizeMode="contain"
        />
      </View>

      <View style={styles.bloqueAcciones}>
        <Text style={styles.tituloIngresar}>
          {idiomaActual === 'es' ? 'Ingresar como' : 'Log in as'}
        </Text>

        <View style={styles.contenedorBotonesLibres}>
          
          <TouchableOpacity style={styles.btnAsociacion} onPress={() => manejarSeleccionRol('asociacion')}>
            <Image 
              source={idiomaActual === 'es' ? require('../assets/images/boton_asociacion.png') : require('../assets/images/boton_asociacion_en.png')} 
              style={styles.imagenBoton}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnEscuela} onPress={() => manejarSeleccionRol('escuela')}>
            <Image 
              source={idiomaActual === 'es' ? require('../assets/images/boton_escuela.png') : require('../assets/images/boton_escuela_en.png')} 
              style={styles.imagenBoton}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnDojang} onPress={() => manejarSeleccionRol('dojang')}>
            <Image 
              source={idiomaActual === 'es' ? require('../assets/images/boton_dojang.png') : require('../assets/images/boton_dojang_en.png')} 
              style={styles.imagenBoton}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPracticante} onPress={() => manejarSeleccionRol('practicante')}>
            <Image 
              source={idiomaActual === 'es' ? require('../assets/images/boton_practicante.png') : require('../assets/images/boton_practicante_en.png')} 
              style={styles.imagenBoton}
              resizeMode="contain"
            />
          </TouchableOpacity>

        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 40 },
  headerContenedor: { flex: 1.3, justifyContent: 'center', alignItems: 'center', width: '100%' },
  marcaImg: { width: width * 0.85, height: '100%' },
  bloqueAcciones: { flex: 0.7, width: '100%', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 },
  tituloIngresar: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 20, letterSpacing: 0.5 },
  contenedorBotonesLibres: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  btnAsociacion: { width: width * 0.22, height: 45, marginHorizontal: 2 },
  btnEscuela: { width: width * 0.22, height: 45, marginHorizontal: 2 },
  btnDojang: { width: width * 0.22, height: 45, marginHorizontal: 2 },
  btnPracticante: { width: width * 0.26, height: 45, marginHorizontal: 2 },
  imagenBoton: { width: '100%', height: '100%' },
});