import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// TODO: REACTIVAR EL VIDEO CUANDO CONECTEMOS SUPABASE
// import { Video } from 'expo-av'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function IndexScreen() {
  const [idioma, setIdioma] = useState<string | null>(null);

  // Cada vez que entra, verifica de forma silenciosa el almacenamiento
  useEffect(() => {
    const chequearIdioma = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      setIdioma(guardado);
    };
    chequearIdioma();
  }, []);

  // Función obligatoria al presionar un idioma: guarda el registro y avanza en la secuencia
const seleccionarIdioma = async (codigoIdioma: 'es' | 'en') => {
    try {
      await AsyncStorage.setItem('@idioma_app', codigoIdioma);
      // Tras elegir idioma, va al Logo por 2 segundos
      router.replace('/logo_splash'); 
    } catch (err) {
      console.log("Error guardando idioma:", err);
      router.replace('/logo_splash');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* SECCIÓN SUPERIOR: Tu video de introducción */}
      <View style={styles.videoContenedor}>
        
        {/* TODO: REACTIVAR EL VIDEO CUANDO CONECTEMOS SUPABASE
        <Video
          source={require('../assets/videos/intro.mp4')} // Tu archivo exacto de video
          style={styles.videoIntro}
          rate={1.0}
          volume={1.0}
          isMuted={true}
          resizeMode="contain"
          shouldPlay
          isLooping
        />
        */}
        
        {/* Cartel temporal para no perder la referencia del diseño */}
        <Text style={{color: 'gray', textAlign: 'center', marginTop: 150}}>
          [Espacio reservado para el Video de Supabase]
        </Text>

      </View>

      {/* SECCIÓN INFERIOR: Tus dos botones paralelos con control de diseño libre */}
      <View style={styles.bloqueIdiomas}>
        
        {/* Botón Español */}
        <TouchableOpacity 
          style={styles.btnEspanol} 
          onPress={() => seleccionarIdioma('es')}
        >
          <Image 
            source={require('../assets/images/boton_espa.png')} 
            style={styles.imagenBoton}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Botón Inglés */}
        <TouchableOpacity 
          style={styles.btnIngles} 
          onPress={() => seleccionarIdioma('en')}
        >
          <Image 
            source={require('../assets/images/boton_english.png')} 
            style={styles.imagenBoton}
            resizeMode="contain"
          />
        </TouchableOpacity>

      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
videoContenedor: {
    // Eliminamos el flex rígido para que no condicione el alto del video
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20 // Te da un margen por si querés bajar un poco todo el bloque
  },
  
  videoIntro: {
    // Hacemos que el ancho sea exactamente el 100% del ancho del celular
    width: width, 
    
    // Ajustá este alto en píxeles. Al agrandar este número, el video se estirará
    // hacia abajo sin cortarse ni ocultar partes de la imagen.
    height: 600, 

    // Si necesitás un ajuste milimétrico de posición podés usar márgenes:
    // marginTop: -10, // Descomentá y usá números negativos para subirlo, positivos para bajarlo
  },
  bloqueIdiomas: {
    flex: 0.5,
    flexDirection: 'row', // Los fuerza a estar en paralelo (uno al lado del otro)
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  //  MODIFICÁ ACÁ ALTO, ANCHO Y MÁRGENES DE CADA BOTÓN DE FORMA INDEPENDIENTE:
  btnEspanol: {
    width: width * 0.40, // 40% del ancho de pantalla
    height: 50,          // Alto del botón
    marginHorizontal: 10, // Separación horizontal
  },
  btnIngles: {
    width: width * 0.40, // 40% del ancho de pantalla
    height: 50,          // Alto del botón
    marginHorizontal: 10, // Separación horizontal
  },

  imagenBoton: {
    width: '100%',
    height: '100%',
  },
});