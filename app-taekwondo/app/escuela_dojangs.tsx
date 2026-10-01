import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function EscuelaDojangsScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [cargando, setCargando] = useState(true);
  const [dojangs, setDojangs] = useState<any[]>([]);

  useEffect(() => {
    const inicializar = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
      
      try {
        // Detectar el ID de la escuela logueada
        const { data: { session } } = await supabase.auth.getSession();
        let idLogueado = session?.user?.id || await AsyncStorage.getItem('@escuela_id_logueada') || await AsyncStorage.getItem('@usuario_id');
        
        if (idLogueado) {
          // Traer los dojangs de esta escuela y contar sus alumnos al vuelo
          const { data, error } = await supabase
            .from('dojangs')
            .select('*, practicantes(count)')
            .eq('id_escuela', idLogueado)
            .order('nombre', { ascending: true });

          if (!error && data) {
            setDojangs(data);
          } else if (error) {
            console.log("Error consultando dojangs:", error.message);
          }
        }
      } catch (error) {
        console.log("Error cargando Dojangs:", error);
      } finally {
        setCargando(false);
      }
    };
    inicializar();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image source={require('../assets/images/esquina_gris.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.btnVolver} onPress={() => router.back()}>
          <Text style={styles.txtVolver}>← {idiomaActual === 'es' ? 'VOLVER' : 'BACK'}</Text>
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>
          <Text style={styles.textoRojo}>{idiomaActual === 'es' ? 'Nuestros' : 'Our'}</Text> {idiomaActual === 'es' ? 'Dojangs' : 'Dojangs'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {cargando ? (
          <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.seccionContenedorGeneral}>
            <View style={styles.cajaGrandeLista}>
              {dojangs.length === 0 ? (
                <Text style={styles.textoVacio}>
                  {idiomaActual === 'es' ? 'Aún no hay dojangs registrados' : 'No dojangs registered yet'}
                </Text>
              ) : (
                dojangs.map((item) => (
                  <View key={item.id} style={styles.filaDojang}>
                    <View style={styles.infoDojang}>
                      <Text style={styles.textoNombre}>{item.nombre}</Text>
                      <Text style={styles.textoDirector}>
                        {idiomaActual === 'es' ? 'Director:' : 'Director:'} {item.director || '---'}
                      </Text>
                    </View>
                    <View style={styles.cajaAlumnos}>
                      <Text style={styles.numeroAlumnos}>{item.practicantes[0]?.count || 0}</Text>
                      <Text style={styles.labelAlumnos}>{idiomaActual === 'es' ? 'Alumnos' : 'Students'}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
          </View>
        )}
      </ScrollView>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: -100, width: 500, height: 650, opacity: 0.25, zIndex: 0 },
  fondoAbajoCentro: { position: 'absolute', bottom: 15, alignSelf: 'center', width: '90%', height: 30, zIndex: 0 },
  
  headerContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, position: 'relative', zIndex: 10 },
  btnVolver: { position: 'absolute', left: 20, top: 55, zIndex: 11, padding: 5 },
  txtVolver: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tituloHeader: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 1, flex: 1, textAlign: 'center' },
  textoRojo: { color: '#e60000' },

  scrollContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },

  seccionContenedorGeneral: { width: '100%', position: 'relative', marginBottom: 30 },
  cajaGrandeLista: { backgroundColor: '#111111', minHeight: 140, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: '#222' },
  pinceladaLarga: { width: '90%', height: 16, position: 'absolute', bottom: -12, left: -10 },
  
  filaDojang: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2a2a2a', paddingVertical: 12 },
  infoDojang: { flex: 1, paddingRight: 15 },
  textoNombre: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  textoDirector: { color: '#888', fontSize: 12 },
  
  cajaAlumnos: { alignItems: 'center', backgroundColor: '#1c1c1c', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#333' },
  numeroAlumnos: { color: '#e60000', fontSize: 16, fontWeight: '900' },
  labelAlumnos: { color: '#fff', fontSize: 10, textTransform: 'uppercase' },

  textoVacio: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 30, fontStyle: 'italic' },
});