import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function EscuelaPrincipalScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [cargando, setCargando] = useState(true);
  const [escuelaDatos, setEscuelaDatos] = useState<any>(null);

  const [modalCobro, setModalCobro] = useState(false);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');
  const [procesandoPago, setProcesandoPago] = useState(false);

  useEffect(() => {
    const inicializar = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let idLogueado = session?.user?.id || await AsyncStorage.getItem('@escuela_id_logueada') || await AsyncStorage.getItem('@usuario_id');
        
        if (idLogueado) {
          // 🔥 BLINDAJE: limit(1).maybeSingle()
          const { data: escuelaData, error } = await supabase
            .from('escuelas')
            .select('*')
            .eq('id', idLogueado)
            .limit(1)
            .maybeSingle();

          if (!error && escuelaData) {
            setEscuelaDatos(escuelaData);
            cargarAlumnos(escuelaData.id);
          } else if (error) {
            console.log("Error consultando escuela:", error.message);
          }
        }
      } catch (error) {
        console.log("Error cargando Escuela principal:", error);
      } finally {
        setCargando(false);
      }
    };
    inicializar();
  }, []);

  const cargarAlumnos = async (idEscuela: string) => {
    const { data } = await supabase
      .from('practicantes')
      .select('id, alias, nombre, apellido')
      .eq('id_escuela', idEscuela)
      .order('nombre', { ascending: true });
    
    if (data) setAlumnos(data);
  };

  const abrirModalCobro = () => {
    setAlumnoSeleccionado(null);
    const mesActual = new Date().getMonth();
    setMesSeleccionado(MESES[mesActual]);
    setModalCobro(true);
  };

  const registrarPago = async () => {
    if (!alumnoSeleccionado || !mesSeleccionado) {
      Alert.alert('Atención', idiomaActual === 'es' ? 'Seleccioná un usuario y un mes.' : 'Select a user and a month.');
      return;
    }

    setProcesandoPago(true);
    try {
      const anioActual = new Date().getFullYear();
      
      const nuevoPago = {
        id_alumno: alumnoSeleccionado.id,
        id_escuela: escuelaDatos.id, 
        mes: mesSeleccionado,
        anio: anioActual,
        monto: 0
      };

      const { error } = await supabase.from('pagos_mensuales').insert([nuevoPago]);
      if (error) throw error;

      Alert.alert('Éxito', idiomaActual === 'es' ? `Pago de ${mesSeleccionado} registrado.` : `${mesSeleccionado} payment registered.`);
      setModalCobro(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setProcesandoPago(false);
    }
  };

  if (cargando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e60000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />

      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        
        <View style={styles.headerSection}>
          <View style={styles.logotipoContenedor}>
            <View style={styles.logotipoBox}>
              {escuelaDatos?.foto_url ? (
                <Image source={{ uri: escuelaDatos.foto_url }} style={styles.imagenLogoPerfil} resizeMode="cover" />
              ) : (
                <Text style={styles.logotipoText}>{idiomaActual === 'es' ? 'Logotipo' : 'Logo'}</Text>
              )}
            </View>
            <Image source={require('../assets/images/angulo_rojo2.png')} style={styles.anguloRojoLogo} resizeMode="stretch" />
          </View>
          <Text style={styles.dojangTitle}>
            {escuelaDatos?.nombre ? escuelaDatos.nombre.toUpperCase() : (idiomaActual === 'es' ? 'MI ESCUELA' : 'MY SCHOOL')}
          </Text>
        </View>

        <View style={styles.filaIlustraciones}>
          {/* 🔥 ACÁ ESTÁ EL CAMBIO: Apunta a /escuela_dojangs y cambiamos la imagen si es posible */}
          <TouchableOpacity style={styles.btnIlustrado} onPress={() => router.push('/escuela_dojangs')}>
            <Image 
              source={idiomaActual === 'es' 
                ? require('../assets/images/boton_nuestrosdojangs.png') // <-- Necesitás crear esta imagen si no existe
                : require('../assets/images/boton_nuestrosdojangs_en.png')} // <-- Y esta en inglés
              style={styles.imgIlustracion} 
              resizeMode="contain" 
              // Si no tenés esas imágenes creadas, la app va a tirar error de "Unable to resolve module". 
              // En ese caso, volvé a poner require('../assets/images/boton_nuestrosalumnos.png') temporalmente.
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnIlustrado} onPress={() => router.push('/escuela_eventos')}>
            <Image 
              source={idiomaActual === 'es' 
                ? require('../assets/images/boton_nuestroseventos.png') 
                : require('../assets/images/boton_nuestroseventos_en.png')}
              style={styles.imgIlustracion} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bannerContainer}>
          <View style={styles.bannerBox}>
            <Text style={styles.textoBanner}>{idiomaActual === 'es' ? 'PUBLICIDAD' : 'ADVERTISING'}</Text>
          </View>
        </View>

        <View style={styles.footerSection}>
          <Image source={require('../assets/images/pincelada_roja.png')} style={styles.separadorRojo} resizeMode="stretch" />
          
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.volverText}>
              {idiomaActual === 'es' ? '← Volver al Menú' : '← Back to Menu'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={modalCobro} transparent animationType="slide">
        <View style={styles.modalFondoOverlay}>
          <View style={styles.modalTarjeta}>
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalCobro(false)}>
              <Text style={styles.txtCerrarModal}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitulo}>{idiomaActual === 'es' ? 'REGISTRAR PAGO' : 'REGISTER PAYMENT'}</Text>
            <View style={styles.divisorRojo} />

            <Text style={styles.labelCobro}>1. {idiomaActual === 'es' ? 'Seleccionar Usuario' : 'Select User'}</Text>
            <View style={styles.listaAlumnosContainer}>
              {alumnos.length === 0 ? (
                <Text style={{color: '#666', textAlign: 'center', marginTop: 20}}>{idiomaActual === 'es' ? 'No hay registros.' : 'No records.'}</Text>
              ) : (
                <FlatList 
                  data={alumnos} 
                  keyExtractor={(item) => item.id} 
                  nestedScrollEnabled
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.itemAlumno, alumnoSeleccionado?.id === item.id && styles.itemAlumnoActivo]} 
                      onPress={() => setAlumnoSeleccionado(item)}
                    >
                      <Text style={[styles.txtItemAlumno, alumnoSeleccionado?.id === item.id && {color: '#e60000', fontWeight: 'bold'}]}>
                        {item.nombre ? `${item.nombre} ${item.apellido || ''}` : item.alias}
                      </Text>
                      {alumnoSeleccionado?.id === item.id && <Text style={{color: '#e60000'}}>✓</Text>}
                    </TouchableOpacity>
                  )} 
                />
              )}
            </View>

            <Text style={styles.labelCobro}>2. {idiomaActual === 'es' ? 'Seleccionar Mes' : 'Select Month'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollMeses}>
              {MESES.map((mes, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.btnMes, mesSeleccionado === mes && styles.btnMesActivo]}
                  onPress={() => setMesSeleccionado(mes)}
                >
                  <Text style={[styles.txtMes, mesSeleccionado === mes && {color: '#fff', fontWeight: 'bold'}]}>{mes}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.btnConfirmarPago} onPress={registrarPago} disabled={procesandoPago}>
              {procesandoPago ? <ActivityIndicator color="#fff" /> : <Text style={styles.txtConfirmarPago}>{idiomaActual === 'es' ? 'CONFIRMAR PAGO' : 'CONFIRM PAYMENT'}</Text>}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, opacity: 1, zIndex: -1 },
  scrollContainer: { flexGrow: 1, paddingTop: 40, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  
  headerSection: { alignItems: 'center', marginBottom: 35, width: '100%' },
  logotipoContenedor: { width: 110, height: 110, position: 'relative', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  logotipoBox: { width: 95, height: 95, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#333', overflow: 'hidden', borderRadius: 4 },
  imagenLogoPerfil: { width: '100%', height: '100%' },
  logotipoText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  
  anguloRojoLogo: { position: 'absolute', bottom: -6, left: -6, width: 35, height: 35, zIndex: 2, transform: [{ rotate: '180deg' }] },
  
  dojangTitle: { color: '#fff', fontSize: 16, fontWeight: '900', textAlign: 'center', paddingHorizontal: 10 },

  filaIlustraciones: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  btnIlustrado: { width: '48%', alignItems: 'center', position: 'relative' },
  imgIlustracion: { width: '100%', height: 110, marginBottom: 5 },

  bannerContainer: { width: '100%', position: 'relative', alignItems: 'center', marginBottom: 30 },
  bannerBox: { width: '90%', height: 80, backgroundColor: '#0a0a0a', borderWidth: 1.5, borderColor: '#444', justifyContent: 'center', alignItems: 'center', borderRadius: 2 },
  textoBanner: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  footerSection: { width: '100%', alignItems: 'center', marginTop: 'auto' },
  separadorRojo: { width: '70%', height: 15, marginBottom: 15 },
  volverText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  modalFondoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', alignItems: 'center' },
  modalTarjeta: { width: '100%', height: '75%', backgroundColor: '#0a0a0a', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: '#222', padding: 25 },
  btnCerrarModal: { position: 'absolute', top: 15, right: 20, zIndex: 2, padding: 5 },
  txtCerrarModal: { color: '#888', fontSize: 18, fontWeight: 'bold' },
  modalTitulo: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 10 },
  divisorRojo: { width: 40, height: 4, backgroundColor: '#e60000', alignSelf: 'center', marginBottom: 25 },
  labelCobro: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  listaAlumnosContainer: { height: 180, backgroundColor: '#111', borderRadius: 6, borderWidth: 1, borderColor: '#222', marginBottom: 25, paddingVertical: 5 },
  itemAlumno: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#1c1c1c' },
  itemAlumnoActivo: { backgroundColor: '#1c1c1c' },
  txtItemAlumno: { color: '#aaa', fontSize: 14 },
  scrollMeses: { flexGrow: 0, marginBottom: 30 },
  btnMes: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 20, marginRight: 10, height: 35, justifyContent: 'center' },
  btnMesActivo: { backgroundColor: '#e60000', borderColor: '#e60000' },
  txtMes: { color: '#888', fontSize: 13 },
  btnConfirmarPago: { backgroundColor: '#e60000', width: '100%', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  txtConfirmarPago: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 }
});