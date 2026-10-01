import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ListaEventosScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarIdioma = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
    };
    cargarIdioma();
  }, []);

  useEffect(() => {
    cargarEventosYDetalles();
  }, []);

  // Trae eventos, nombre de asociación e inscriptos en tiempo real
  const cargarEventosYDetalles = async () => {
    try {
      setCargando(true);
      const { data: dataEventos, error } = await supabase
        .from('eventos')
        .select('*, asociaciones (nombre)')
        .order('fecha', { ascending: true });

      if (error) throw error;

      if (dataEventos) {
        const eventosCompletos = await Promise.all((dataEventos || []).map(async (evento) => {
          const { count } = await supabase
            .from('inscripciones_eventos')
            .select('*', { count: 'exact', head: true })
            .eq('id_evento', evento.id);
            
          return { ...evento, cantidad_inscriptos: count || 0 };
        }));
        setEventos(eventosCompletos);
      }
    } catch (err) {
      console.log("Error armando el feed de eventos:", err);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fechaDb: string) => {
    if (!fechaDb) return '';
    const partes = fechaDb.split('-'); 
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`; 
    return fechaDb;
  };

  const confirmarCancelacion = (idEvento: string, nombreTorneo: string) => {
    Alert.alert(
      idiomaActual === 'es' ? '¿Cancelar Evento?' : 'Cancel Event?',
      idiomaActual === 'es' 
        ? `¿Estás seguro que deseas cancelar "${nombreTorneo}"?` 
        : `Are you sure you want to cancel "${nombreTorneo}"?`,
      [
        { text: idiomaActual === 'es' ? 'No' : 'No', style: 'cancel' },
        { 
          text: idiomaActual === 'es' ? 'Sí, Cancelar' : 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => console.log('Acá irá la lógica de cancelación o borrado en base de datos') 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />
      <Image source={require('../assets/images/dibujolinea_eventos.png')} style={styles.dibujoLineaFondo} resizeMode="contain" />
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        <Text style={styles.titulo}>
          {idiomaActual === 'es' ? <Text><Text style={styles.tituloRojo}>Cronograma</Text> de Eventos</Text> : <Text><Text style={styles.tituloRojo}>Events</Text> Schedule</Text>}
        </Text>

        <View style={styles.listaContainer}>
          {cargando ? (
            <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 40 }} />
          ) : eventos.length === 0 ? (
            <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 13, marginTop: 40 }}>
              {idiomaActual === 'es' ? 'No hay eventos programados en este momento.' : 'No scheduled events at this time.'}
            </Text>
          ) : (
            eventos.map((evento) => (
              <View key={evento.id.toString()} style={styles.tarjetaFeedContenedor}>
                
                {/* NOMBRE DE LA ASOCIACIÓN */}
                <Text style={styles.textoNombreAsociacion}>
                  {evento.asociaciones?.nombre || "Asociación Americana Taekwondo"}
                </Text>

                {/* CAMPO: TORNEO */}
                <View style={styles.grupoDatoTorneo}>
                  <Text style={styles.labelTorneo}>{idiomaActual === 'es' ? 'Torneo' : 'Tournament'}</Text>
                  <Text style={styles.valorTorneo}>{evento.nombre || "Torneo Anual A.S.A.T."}</Text>
                  <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaTorneo} resizeMode="stretch" />
                </View>

                {/* CAMPO: FECHA */}
                <View style={styles.grupoDatoFecha}>
                  <Text style={styles.labelFecha}>{idiomaActual === 'es' ? 'Fecha' : 'Date'}</Text>
                  <Text style={styles.valorFecha}>{formatearFecha(evento.fecha)}</Text>
                  <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaFecha} resizeMode="stretch" />
                </View>

                {/* CONTADOR DE INSCRIPTOS */}
                <View style={styles.bloqueInscriptos}>
                  <Text style={styles.labelInscriptos}>{idiomaActual === 'es' ? 'Cantidad de inscriptos' : 'Registered participants'}</Text>
                  <View style={styles.cajaGrisInscriptos}>
                    <Text style={styles.numeroInscriptos}>{evento.cantidad_inscriptos}</Text>
                  </View>
                  <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaInscriptos} resizeMode="stretch" />
                </View>

                {/* BOTONES DE ACCIÓN EN TEXTO */}
                <View style={styles.bloqueBotonesAccion}>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/detalle_evento', params: { id: evento.id } })} style={styles.botonTextoAccion}>
                    <Text style={styles.textoBotonEditar}>{idiomaActual === 'es' ? 'EDITAR' : 'EDIT'}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={() => confirmarCancelacion(evento.id, evento.nombre)} style={styles.botonTextoAccion}>
                    <Text style={styles.textoBotonCancelar}>{idiomaActual === 'es' ? 'CANCELAR' : 'CANCEL'}</Text>
                  </TouchableOpacity>
                </View>

              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* MENÚ INFERIOR */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/asociacion_principal')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_home.png') : require('../assets/images/boton_home_en.png')} style={styles.imagenHome} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.push('/escuelas')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_escuelas.png') : require('../assets/images/boton_escuelas_en.png')} style={styles.imagenEscuelas} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/eventos')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_eventos.png') : require('../assets/images/boton_eventos_en.png')} style={styles.imagenEventos} resizeMode="contain" />
        </TouchableOpacity>
      </View>
      
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, opacity: 1, zIndex: -2 },
  dibujoLineaFondo: { position: 'absolute', alignSelf: 'center', top: '35%', width: 400, height: 400, opacity: 1, zIndex: -1 },
  fondoAbajoCentro: { position: 'absolute', bottom: 20, alignSelf: 'center', width: '90%', height: 20, zIndex: 0 },
  scrollContainer: { flexGrow: 1, paddingTop: 50, paddingHorizontal: 25, paddingBottom: 110 },
  titulo: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 35 },
  tituloRojo: { color: '#e60000' },
  listaContainer: { width: '100%', alignItems: 'center' },
  
  tarjetaFeedContenedor: { width: '95%', backgroundColor: '#080808', opacity: 0.95, borderRadius: 2, padding: 25, borderWidth: 1, borderColor: '#1c1c1c', marginBottom: 40 },
  textoNombreAsociacion: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  
  grupoDatoTorneo: { marginBottom: 30, width: '100%', position: 'relative' },
  labelTorneo: { color: '#e60000', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  valorTorneo: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginLeft: 2 },
  pinceladaTorneo: { width: '80%', height: 16, position: 'absolute', bottom: -18, left: -20 },
  
  grupoDatoFecha: { marginBottom: 30, width: '100%', position: 'relative' },
  labelFecha: { color: '#e60000', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  valorFecha: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginLeft: 2 },
  pinceladaFecha: { width: '50%', height: 16, position: 'absolute', bottom: -18, left: -20 },
  
  bloqueInscriptos: { position: 'relative', width: '100%', marginBottom: 30 },
  labelInscriptos: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  cajaGrisInscriptos: { backgroundColor: '#1c1c1c', width: 120, height: 45, borderRadius: 4, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  numeroInscriptos: { color: '#fff', fontSize: 20, fontWeight: '900' },
  pinceladaInscriptos: { width: '45%', height: 16, position: 'absolute', bottom: -12, left: -15, zIndex: 0 },
  
  bloqueBotonesAccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 10 },
  botonTextoAccion: { paddingVertical: 10 },
  
  textoBotonEditar: { color: '#ffffff', fontSize: 13, fontWeight: '900', letterSpacing: 1 }, 
  textoBotonCancelar: { color: '#e60000', fontSize: 13, fontWeight: '900', letterSpacing: 1 }, 

  navBar: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 10, zIndex: 10 },
  navBoton: { width: '25%', alignItems: 'center' },
  imagenHome: { width: '100%', height: 28 },
  imagenEscuelas: { width: '100%', height: 30 },
  imagenEventos: { width: '100%', height: 30 }
});