import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function MisAlumnosScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [cargando, setCargando] = useState(true);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [asistenciasRecientes, setAsistenciasRecientes] = useState<any[]>([]);

  useEffect(() => {
    const cargarDatosAlumnos = async () => {
      try {
        const guardado = await AsyncStorage.getItem('@idioma_app');
        if (guardado) setIdiomaActual(guardado);

        const idDojang = await AsyncStorage.getItem('@dojang_id_logueado');
        if (!idDojang) {
          setCargando(false);
          return;
        }

        // 1. Traer alumnos del Dojang actual con sus graduaciones y estado de pago
        const { data: dataAlumnos, error: errorAlumnos } = await supabase
          .from('practicantes')
          .select('id, nombre, apellido, graduacion, al_dia')
          .eq('id_dojang', idDojang);

        if (errorAlumnos) throw errorAlumnos;
        if (dataAlumnos) setAlumnos(dataAlumnos);

        // 2. Traer asistencias recientes de la sede
        const { data: dataAsis, error: errorAsis } = await supabase
          .from('asistencias')
          .select('*, practicantes (nombre, apellido)')
          .eq('id_dojang', idDojang)
          .order('fecha_hora', { ascending: false })
          .limit(10);

        if (!errorAsis && dataAsis) {
          setAsistenciasRecientes(dataAsis);
        }

      } catch (err: any) {
        console.log("Error cargando datos de alumnos:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosAlumnos();
  }, []);

  // FUNCIÓN PARA CAMBIAR EL ESTADO DE PAGO (Debe <-> Al día)
  const cambiarEstadoPago = async (idAlumno: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    const mensaje = nuevoEstado 
      ? (idiomaActual === 'es' ? '¿Marcar a este alumno como Al día?' : 'Mark this student as up to date?')
      : (idiomaActual === 'es' ? '¿Marcar a este alumno como que Debe?' : 'Mark this student as pending?');

    Alert.alert(
      idiomaActual === 'es' ? 'Gestión de Pagos' : 'Payment Management',
      mensaje,
      [
        { text: idiomaActual === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        { 
          text: idiomaActual === 'es' ? 'Confirmar' : 'Confirm', 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('practicantes')
                .update({ al_dia: nuevoEstado })
                .eq('id', idAlumno);

              if (error) throw error;

              // Actualizamos el estado local instantáneamente
              setAlumnos(prev => prev.map(a => a.id === idAlumno ? { ...a, al_dia: nuevoEstado } : a));
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Fondos estéticos */}
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.tituloHeader}>
          <Text style={styles.textoRojo}>{idiomaActual === 'es' ? 'Mis' : 'My'}</Text> {idiomaActual === 'es' ? 'Alumnos' : 'Students'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {cargando ? (
          <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* SECCIÓN 1: NOMBRE Y GRADUACIÓN (Uno al lado del otro) */}
            <View style={styles.filaDobleBloque}>
              <View style={styles.cajaBloque}>
                <Text style={styles.labelSeccion}>{idiomaActual === 'es' ? 'Nombre' : 'Name'}</Text>
                <View style={styles.contenidoInteriorCaja}>
                  {alumnos.length === 0 ? (
                    <Text style={styles.textoVacio}>Sin alumnos</Text>
                  ) : (
                    alumnos.map((item, idx) => (
                      <Text key={idx} style={styles.textoItemLista}>{item.nombre} {item.apellido}</Text>
                    ))
                  )}
                </View>
                <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaCorta} resizeMode="stretch" />
              </View>

              <View style={styles.cajaBloque}>
                <Text style={styles.labelSeccion}>{idiomaActual === 'es' ? 'Graduación' : 'Rank'}</Text>
                <View style={styles.contenidoInteriorCaja}>
                  {alumnos.length === 0 ? (
                    <Text style={styles.textoVacio}>---</Text>
                  ) : (
                    alumnos.map((item, idx) => (
                      <Text key={idx} style={styles.textoItemLista}>{item.graduacion || 'Blanco'}</Text>
                    ))
                  )}
                </View>
                <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaCorta} resizeMode="stretch" />
              </View>
            </View>

            {/* SECCIÓN 2: PUBLICIDAD */}
            <View style={styles.contenedorPublicidad}>
              <Image source={require('../assets/images/angulo_rojo1.png')} style={styles.anguloTopLeft} resizeMode="contain" />
              <Text style={styles.textoPublicidad}>PUBLICIDAD</Text>
              <Image source={require('../assets/images/angulo_rojo2.png')} style={styles.anguloBottomRight} resizeMode="contain" />
            </View>

            {/* SECCIÓN 3: ASISTENCIAS (QR / Escaneo) */}
            <View style={styles.seccionContenedorGeneral}>
              <Text style={styles.labelSeccionGrande}>{idiomaActual === 'es' ? 'Asistencias' : 'Attendance'}</Text>
              <View style={styles.cajaGrandeAsistencias}>
                {asistenciasRecientes.length === 0 ? (
                  <Text style={styles.textoVacio}>{idiomaActual === 'es' ? 'No hay registros recientes de QR' : 'No recent QR records'}</Text>
                ) : (
                  asistenciasRecientes.map((asis, idx) => (
                    <Text key={idx} style={styles.textoAsistenciaItem}>
                      {asis.practicantes?.nombre} {asis.practicantes?.apellido} - {new Date(asis.fecha_hora).toLocaleDateString()}
                    </Text>
                  ))
                )}
              </View>
              <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
            </View>

            {/* SECCIÓN 4: GESTIÓN DE PAGOS INTERACTIVA */}
            <Text style={styles.tituloGestionPagos}>
              <Text style={styles.textoRojo}>{idiomaActual === 'es' ? 'Gestión' : 'Payment'}</Text> {idiomaActual === 'es' ? 'de Pagos' : 'Management'}
            </Text>

            <View style={styles.filaDobleBloque}>
              {/* Al Día (Tocar para pasar a Debe si es necesario) */}
              <View style={styles.cajaBloque}>
                <Text style={styles.labelSeccion}>{idiomaActual === 'es' ? 'Al día' : 'Up to date'}</Text>
                <View style={styles.contenidoInteriorCaja}>
                  {alumnos.filter(a => a.al_dia === true).length === 0 ? (
                    <Text style={styles.textoVacio}>Ninguno</Text>
                  ) : (
                    alumnos.filter(a => a.al_dia === true).map((item) => (
                      <TouchableOpacity key={item.id} onPress={() => cambiarEstadoPago(item.id, true)}>
                        <Text style={[styles.textoItemLista, { color: '#4cd137', marginBottom: 8 }]}>
                          ✓ {item.nombre} {item.apellido}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
                <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaCorta} resizeMode="stretch" />
              </View>

              {/* Debe (Tocar para pasar a Al día cuando pagan) */}
              <View style={styles.cajaBloque}>
                <Text style={styles.labelSeccion}>{idiomaActual === 'es' ? 'Debe' : 'Pending'}</Text>
                <View style={styles.contenidoInteriorCaja}>
                  {alumnos.filter(a => a.al_dia !== true).length === 0 ? (
                    <Text style={styles.textoVacio}>Ninguno</Text>
                  ) : (
                    alumnos.filter(a => a.al_dia !== true).map((item) => (
                      <TouchableOpacity key={item.id} onPress={() => cambiarEstadoPago(item.id, false)}>
                        <Text style={[styles.textoItemLista, { color: '#e60000', marginBottom: 8 }]}>
                          $ {item.nombre} {item.apellido}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
                <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaCorta} resizeMode="stretch" />
              </View>
            </View>
          </>
        )}
      </ScrollView>

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
  
  headerContainer: { alignItems: 'center', paddingTop: 20, paddingBottom: 15 },
  tituloHeader: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  textoRojo: { color: '#e60000' },

  scrollContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },

  filaDobleBloque: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  cajaBloque: { width: '48%', position: 'relative' },
  labelSeccion: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  contenidoInteriorCaja: { backgroundColor: '#111111', minHeight: 180, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: '#222' },
  pinceladaCorta: { width: '100%', height: 16, position: 'absolute', bottom: -12, left: -10 },

  textoItemLista: { color: '#fff', fontSize: 12 },
  textoVacio: { color: '#555', fontSize: 11, textAlign: 'center', marginTop: 20 },

  contenedorPublicidad: { width: '100%', height: 130, backgroundColor: '#0a0a0a', borderWidth: 1.5, borderColor: '#333333', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 30 },
  textoPublicidad: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  anguloTopLeft: { position: 'absolute', top: -12, left: -12, width: 60, height: 60 },
  anguloBottomRight: { position: 'absolute', bottom: -12, right: -12, width: 60, height: 60 },

  seccionContenedorGeneral: { width: '100%', position: 'relative', marginBottom: 30 },
  labelSeccionGrande: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  cajaGrandeAsistencias: { backgroundColor: '#111111', minHeight: 140, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: '#222' },
  pinceladaLarga: { width: '90%', height: 16, position: 'absolute', bottom: -12, left: -10 },
  textoAsistenciaItem: { color: '#ccc', fontSize: 12, marginBottom: 6 },

  tituloGestionPagos: { color: '#ffffff', fontSize: 15, fontWeight: '900', marginBottom: 15, marginLeft: 4 },

  navBar: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 10, zIndex: 10, backgroundColor: '#050505', paddingVertical: 10 },
  navBoton: { width: '30%', alignItems: 'center' },
  imagenNav: { width: '100%', height: 28 }
});