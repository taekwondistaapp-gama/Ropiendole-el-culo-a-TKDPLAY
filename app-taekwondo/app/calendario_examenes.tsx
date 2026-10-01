import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function CalendarioExamenesScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [cargando, setCargando] = useState(true);
  const [examenes, setExamenes] = useState<any[]>([]);

  useEffect(() => {
    const cargarExamenes = async () => {
      try {
        const guardado = await AsyncStorage.getItem('@idioma_app');
        if (guardado) setIdiomaActual(guardado);

        const idDojang = await AsyncStorage.getItem('@dojang_id_logueado');
        if (!idDojang) {
          setCargando(false);
          return;
        }

        // Traemos los exámenes creados por este Dojang
        const { data, error } = await supabase
          .from('examenes')
          .select('*')
          .eq('id_dojang', idDojang)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setExamenes(data);
        }
      } catch (err) {
        console.log("Error cargando exámenes:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarExamenes();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.tituloHeader}>Exámenes</Text>
        <Text style={styles.subtituloAnio}>Calendario 2026</Text>
      </View>

      {/* CONTENEDOR PRINCIPAL DEL CALENDARIO */}
      <View style={styles.contenedorCalendario}>
        {cargando ? (
          <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 40 }} />
        ) : examenes.length === 0 ? (
          <View style={styles.cajaVacia}>
            <Text style={styles.textoVacio}>
              {idiomaActual === 'es' ? 'No hay exámenes programados aún.\nCrea uno desde el formulario.' : 'No exams scheduled yet.\nCreate one from the form.'}
            </Text>
          </View>
        ) : (
          <FlatList 
            data={examenes}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 15 }}
            renderItem={({ item }) => (
              <View style={styles.tarjetaExamen}>
                <Text style={styles.nombreExamen}>{item.nombre}</Text>
                <Text style={styles.detalleExamen}>📅 {item.fecha} | 📍 {item.lugar}</Text>
                <Text style={styles.detalleExamen}>💵 Valor: ${item.valor} | 🔑 PIN: {item.pin_acceso}</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* BOTÓN PARA CREAR NUEVO EXAMEN */}
      <TouchableOpacity style={styles.btnCrearNuevo} onPress={() => router.push('/nuevo_examen')}>
        <Text style={styles.textoBtnCrearNuevo}>+ {idiomaActual === 'es' ? 'Crear Nuevo Examen' : 'Create New Exam'}</Text>
      </TouchableOpacity>

      {/* BARRA DE NAVEGACIÓN INFERIOR CON BOTÓN HOME */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/dojang_principal')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_home.png') : require('../assets/images/boton_home_en.png')} style={styles.imagenNav} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/mis_alumnos')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_alumnos.png') : require('../assets/images/boton_alumnos_en.png')} style={styles.imagenNav} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/calendario_examenes')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_examenesinferior.png') : require('../assets/images/boton_examenesinf_en.png')} style={styles.imagenNav} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, opacity: 0.5, zIndex: -1 },
  fondoAbajoCentro: { position: 'absolute', bottom: 10, alignSelf: 'center', width: '90%', height: 20, zIndex: -1 },
  
  headerContainer: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  tituloHeader: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  subtituloAnio: { color: '#e60000', fontSize: 13, fontWeight: 'bold', marginTop: 4 },

  contenedorCalendario: { 
    flex: 1, 
    marginHorizontal: 20, 
    backgroundColor: '#111111', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#222', 
    marginBottom: 80,
    overflow: 'hidden'
  },
  cajaVacia: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  textoVacio: { color: '#666', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  tarjetaExamen: { backgroundColor: '#181818', borderRadius: 6, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  nombreExamen: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  detalleExamen: { color: '#aaa', fontSize: 11, marginBottom: 2 },

  btnCrearNuevo: { backgroundColor: '#e60000', marginHorizontal: 20, paddingVertical: 10, borderRadius: 6, alignItems: 'center', position: 'absolute', bottom: 65, left: 0, right: 0, zIndex: 5 },
  textoBtnCrearNuevo: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  navBar: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 10, zIndex: 10, backgroundColor: '#050505', paddingVertical: 10 },
  navBoton: { width: '30%', alignItems: 'center' },
  imagenNav: { width: '100%', height: 28 }
});