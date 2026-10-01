import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const Checkbox = ({ label, checked, onPress }: any) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function PracticantePrincipalScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [nombrePracticante, setNombrePracticante] = useState('Cargando...');
  const [pinEvento, setPinEvento] = useState('');
  
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  const [escaneando, setEscaneando] = useState(true);

  const [mostrarModalModalidades, setMostrarModalModalidades] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any>(null);
  
  const [modalidades, setModalidades] = useState({
    lucha: false,
    tul: false,
    rotura: false,
    roturaPoder: false
  });

  const [roles, setRoles] = useState({
    coach: false,
    juez: false,
    arbitro: false
  });

  useEffect(() => {
    const cargarDatos = async () => {
      const idiomaGuardado = await AsyncStorage.getItem('@idioma_app');
      if (idiomaGuardado) setIdiomaActual(idiomaGuardado);

      try {
        const idPracticante = await AsyncStorage.getItem('@practicante_id_logueado');
        if (idPracticante) {
          // 🔥 BLINDAJE: limit(1).maybeSingle()
          const { data, error } = await supabase
            .from('practicantes')
            .select('nombre, apellido')
            .eq('id', idPracticante)
            .limit(1)
            .maybeSingle();

          if (data && !error) {
            setNombrePracticante(`${data.nombre} ${data.apellido}`);
          } else {
            setNombrePracticante('Practicante');
          }
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
      }
    };
    cargarDatos();
  }, []);

  const handleCerrarSesion = async () => {
    await AsyncStorage.removeItem('@practicante_id_logueado');
    await AsyncStorage.removeItem('@rol_usuario');
    router.replace('/');
  };

  const handleAbrirScanner = async () => {
    if (!permisoCamara?.granted) {
      const permiso = await pedirPermisoCamara();
      if (!permiso.granted) {
        Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara para escanear el QR.");
        return;
      }
    }
    setEscaneando(true);
    setMostrarScanner(true);
  };

  const handleQRLeido = async ({ data }: { data: string }) => {
    setEscaneando(false);
    setMostrarScanner(false);
    
    try {
      // BLINDAJE: limit(1).maybeSingle()
      const { data: dojangData, error: errorDojang } = await supabase
        .from('dojangs')
        .select('id, nombre_dojang')
        .eq('codigo_token', data)
        .limit(1)
        .maybeSingle();

      if (errorDojang) throw new Error("Error interno al validar el QR.");
      if (!dojangData) throw new Error("El código QR no es válido o el Dojang no existe.");

      const idPracticante = await AsyncStorage.getItem('@practicante_id_logueado');
      
      const { error: errorAsistencia } = await supabase
        .from('asistencias')
        .insert({
          fecha_hora: new Date().toISOString(),
          id_dojang: dojangData.id,
          id_alumno: idPracticante
        });

      if (errorAsistencia) throw errorAsistencia;

      Alert.alert("¡Presente!", `Asistencia registrada en: ${dojangData.nombre_dojang}`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleVerificarInscripcion = async () => {
    const pinLimpio = pinEvento.trim();

    if (!pinLimpio) {
      Alert.alert("Atención", idiomaActual === 'es' ? "Por favor ingresá el PIN del evento." : "Please enter the event PIN.");
      return;
    }

    try {
      // BLINDAJE: limit(1).maybeSingle()
      const { data: eventoData, error: errorEvento } = await supabase
        .from('eventos')
        .select('id, nombre')
        .eq('pin_acceso', pinLimpio)
        .limit(1)
        .maybeSingle();

      if (errorEvento) throw new Error("Error interno del servidor al buscar el PIN.");
      if (!eventoData) {
        Alert.alert("Error", idiomaActual === 'es' ? "No se encontró ningún evento con ese PIN." : "No event found with that PIN.");
        return;
      }

      setEventoSeleccionado(eventoData);
      setMostrarModalModalidades(true);

    } catch (err: any) {
      console.log("Error atrapado:", err);
      Alert.alert("Error", err.message);
    }
  };

  const confirmarInscripcion = async () => {
    const eligioModalidad = modalidades.lucha || modalidades.tul || modalidades.rotura || modalidades.roturaPoder;
    const eligioRol = roles.coach || roles.juez || roles.arbitro;

    if (!eligioModalidad && !eligioRol) {
      Alert.alert("Atención", idiomaActual === 'es' ? "Debes seleccionar al menos una modalidad o rol." : "Select at least one modality or role.");
      return;
    }

    try {
      const idPracticante = await AsyncStorage.getItem('@practicante_id_logueado');
      const idEventoActual = eventoSeleccionado.id; 

      const { error: errorInscripcion } = await supabase
        .from('inscripciones')
        .insert({
          id_evento: idEventoActual,
          id_practicante: idPracticante,
          compite_lucha: modalidades.lucha,
          compite_tul: modalidades.tul,
          compite_rotura: modalidades.rotura,
          compite_rotura_poder: modalidades.roturaPoder,
          es_coach: roles.coach,
          es_juez: roles.juez,
          es_arbitro: roles.arbitro
        });

      if (errorInscripcion) throw new Error(errorInscripcion.message);
      
      setMostrarModalModalidades(false);
      setPinEvento('');
      setEventoSeleccionado(null);
      setModalidades({ lucha: false, tul: false, rotura: false, roturaPoder: false });
      setRoles({ coach: false, juez: false, arbitro: false });

      router.push({ pathname: '/credencial', params: { idEvento: idEventoActual } });

    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const toggleModalidad = (mod: string) => {
    setModalidades(prev => ({ ...prev, [mod]: !prev[mod as keyof typeof modalidades] }));
  };

  const toggleRol = (rol: string) => {
    setRoles(prev => ({ ...prev, [rol]: !prev[rol as keyof typeof roles] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
          
          <Text style={styles.textoNombre}>{nombrePracticante}</Text>

          <View style={styles.seccionEventos}>
            <TouchableOpacity style={styles.btnMisEventos} onPress={() => router.push('/mis_eventos')}>
              <Image 
                source={idiomaActual === 'es' ? require('../assets/images/boton_nuestroseventos.png') : require('../assets/images/boton_nuestroseventos_en.png')} 
                style={styles.imgBotonFluido} 
                resizeMode="contain" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.filaInscripcion}>
            <View style={styles.inputGroupPin}>
              <Text style={styles.labelBlanco}>{idiomaActual === 'es' ? 'Pin del evento' : 'Event PIN'}</Text>
              <TextInput 
                style={styles.inputTxtPin} 
                selectionColor="#e60000" 
                value={pinEvento}
                onChangeText={setPinEvento}
                placeholder=""
                autoCapitalize="none" 
              />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.esquinaCortaPin} resizeMode="stretch" />
            </View>

            <TouchableOpacity style={styles.btnInscripcion} onPress={handleVerificarInscripcion}>
              <Image 
                source={idiomaActual === 'es' ? require('../assets/images/boton_inscripcion.png') : require('../assets/images/boton_inscripcion_en.png')} 
                style={styles.imgBotonInscripcion} 
                resizeMode="contain" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.contenedorPublicidad}>
            <Image source={require('../assets/images/angulo_rojo1.png')} style={styles.anguloTopLeft} resizeMode="contain" />
            <Text style={styles.textoPublicidad}>PUBLICIDAD</Text>
            <Image source={require('../assets/images/angulo_rojo2.png')} style={styles.anguloBottomRight} resizeMode="contain" />
          </View>

          <View style={styles.seccionBiblioteca}>
            <TouchableOpacity style={styles.btnBiblioteca} onPress={() => console.log('Biblioteca')}>
              <Image 
                source={idiomaActual === 'es' ? require('../assets/images/boton_biblioteca.png') : require('../assets/images/boton_biblioteca_en.png')} 
                style={styles.imgBotonFluido} 
                resizeMode="contain" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.seccionDarPresente}>
            <TouchableOpacity style={styles.btnDarPresente} onPress={handleAbrirScanner}>
              <Image 
                source={idiomaActual === 'es' ? require('../assets/images/boton_darpresente.png') : require('../assets/images/boton_darpresente_en.png')} 
                style={styles.imgBotonFluido} 
                resizeMode="contain" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.btnCerrarSesion} onPress={handleCerrarSesion}>
              <Text style={styles.textoCerrarSesion}>{idiomaActual === 'es' ? 'Cerrar Sesión' : 'Log Out'}</Text>
              <Image source={require('../assets/images/pincelada_roja.png')} style={styles.pinceladaCerrar} resizeMode="stretch" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnActualizarDatos} onPress={() => router.push('/registro_practicante')}>
              <Text style={styles.textoActualizar}>
                {idiomaActual === 'es' ? 'Actualizar ' : 'Update '}
                <Text style={styles.textoRojo}>{idiomaActual === 'es' ? 'Datos Aquí' : 'Data Here'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={mostrarScanner} animationType="slide" transparent={false}>
        <View style={styles.modalCamaraContainer}>
          {mostrarScanner && (
            <CameraView 
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={escaneando ? handleQRLeido : undefined}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
          )}
          <View style={styles.overlayCamara}>
            <View style={styles.marcoQR}>
              <View style={[styles.esquinaQR, styles.esquinaTopLeft]} />
              <View style={[styles.esquinaQR, styles.esquinaTopRight]} />
              <View style={[styles.esquinaQR, styles.esquinaBottomLeft]} />
              <View style={[styles.esquinaQR, styles.esquinaBottomRight]} />
            </View>
            <Text style={styles.textoCamara}>{idiomaActual === 'es' ? 'Apuntá al código QR del Dojang' : 'Scan the Dojang QR code'}</Text>
            <TouchableOpacity style={styles.btnCerrarCamara} onPress={() => setMostrarScanner(false)}>
              <Text style={styles.textoCerrarCamara}>{idiomaActual === 'es' ? 'Cancelar' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={mostrarModalModalidades} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <Text style={styles.modalTitulo}>{idiomaActual === 'es' ? 'Inscripción al Evento' : 'Event Registration'}</Text>
              <Text style={styles.modalSubtitulo}>{eventoSeleccionado?.nombre}</Text>

              <Text style={styles.seccionTituloModal}>{idiomaActual === 'es' ? 'MODALIDADES (Competidor)' : 'MODALITIES (Competitor)'}</Text>
              <View style={styles.contenedorOpciones}>
                <Checkbox label={idiomaActual === 'es' ? "Lucha (Sparring)" : "Sparring"} checked={modalidades.lucha} onPress={() => toggleModalidad('lucha')} />
                <Checkbox label={idiomaActual === 'es' ? "Formas (Tul)" : "Patterns (Tul)"} checked={modalidades.tul} onPress={() => toggleModalidad('tul')} />
                <Checkbox label={idiomaActual === 'es' ? "Rotura" : "Breaking"} checked={modalidades.rotura} onPress={() => toggleModalidad('rotura')} />
                <Checkbox label={idiomaActual === 'es' ? "Rotura de Poder" : "Power Breaking"} checked={modalidades.roturaPoder} onPress={() => toggleModalidad('roturaPoder')} />
              </View>

              <View style={styles.divisorModal} />

              <Text style={styles.seccionTituloModal}>{idiomaActual === 'es' ? 'ROLES Y OFICIALES' : 'ROLES & OFFICIALS'}</Text>
              <View style={styles.contenedorOpciones}>
                <Checkbox label="Coach" checked={roles.coach} onPress={() => toggleRol('coach')} />
                <Checkbox label={idiomaActual === 'es' ? "Juez de Esquina" : "Corner Judge"} checked={roles.juez} onPress={() => toggleRol('juez')} />
                <Checkbox label={idiomaActual === 'es' ? "Árbitro Central" : "Center Referee"} checked={roles.arbitro} onPress={() => toggleRol('arbitro')} />
              </View>
            </ScrollView>

            <View style={styles.modalAcciones}>
              <TouchableOpacity style={styles.btnCancelarModal} onPress={() => setMostrarModalModalidades(false)}>
                <Text style={styles.textoCancelarModal}>{idiomaActual === 'es' ? 'Cancelar' : 'Cancel'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnConfirmarModal} onPress={confirmarInscripcion}>
                <Text style={styles.textoConfirmarModal}>{idiomaActual === 'es' ? 'CONFIRMAR' : 'CONFIRM'}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 400, height: 600, opacity: 0.8, zIndex: -1 },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40, flexGrow: 1 },
  textoNombre: { color: '#ffffff', fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
  seccionEventos: { alignItems: 'center', marginBottom: 30 },
  btnMisEventos: { width: 180, height: 180 },
  imgBotonFluido: { width: '100%', height: '100%' },
  filaInscripcion: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 30, gap: 15 },
  inputGroupPin: { width: '45%', position: 'relative' },
  labelBlanco: { color: '#ffffff', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  inputTxtPin: { backgroundColor: '#222222', color: '#ffffff', height: 40, borderRadius: 4, paddingHorizontal: 15, fontSize: 12, textAlign: 'center' },
  esquinaCortaPin: { position: 'absolute', bottom: -8, left: -17, width: 80, height: 25 },
  btnInscripcion: { width: 125, height: 55, marginBottom: -3 },
  imgBotonInscripcion: { width: '100%', height: '100%' },
  contenedorPublicidad: { width: '100%', height: 150, backgroundColor: '#0a0a0a', borderWidth: 1.5, borderColor: '#333333', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 50 },
  textoPublicidad: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  anguloTopLeft: { position: 'absolute', top: -15, left: -17, width: 80, height: 80 },
  anguloBottomRight: { position: 'absolute', bottom: -15, right: -18, width: 80, height: 80 },
  seccionBiblioteca: { alignItems: 'center', marginBottom: 40 },
  btnBiblioteca: { width: 350, height: 150, marginBottom: 5 },
  seccionDarPresente: { alignItems: 'center', marginBottom: 45 },
  btnDarPresente: { width: 150, height: 60 },
  footerContainer: { alignItems: 'center', marginTop: 'auto' },
  btnCerrarSesion: { position: 'relative', marginBottom: 25, paddingHorizontal: 20 },
  textoCerrarSesion: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  pinceladaCerrar: { position: 'absolute', bottom: -20, left: -75, width: '100%', height: 15 },
  btnActualizarDatos: { padding: 10 },
  textoActualizar: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  textoRojo: { color: '#e60000' },
  
  modalCamaraContainer: { flex: 1, backgroundColor: '#000' },
  overlayCamara: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  marcoQR: { width: 250, height: 250, backgroundColor: 'transparent', position: 'relative', marginBottom: 30 },
  esquinaQR: { position: 'absolute', width: 40, height: 40, borderColor: '#e60000' },
  esquinaTopLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  esquinaTopRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  esquinaBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  esquinaBottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  textoCamara: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 40 },
  btnCerrarCamara: { backgroundColor: '#e60000', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 5 },
  textoCerrarCamara: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxHeight: '80%', backgroundColor: '#151515', borderRadius: 8, borderWidth: 1, borderColor: '#e60000', padding: 25 },
  modalTitulo: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  modalSubtitulo: { color: '#ffffff', fontSize: 14, textAlign: 'center', marginBottom: 20, marginTop: 5 },
  
  seccionTituloModal: { color: '#e60000', fontSize: 14, fontWeight: 'bold', marginBottom: 15, marginTop: 10, letterSpacing: 0.5 },
  divisorModal: { height: 1, backgroundColor: '#333333', marginVertical: 5 },
  contenedorOpciones: { marginBottom: 10 },
  
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#e60000', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 15, backgroundColor: '#0a0a0a' },
  checkboxChecked: { backgroundColor: '#e60000' },
  checkmark: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { color: '#ffffff', fontSize: 15 },

  modalAcciones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#333' },
  btnCancelarModal: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5 },
  textoCancelarModal: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  btnConfirmarModal: { backgroundColor: '#e60000', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5 },
  textoConfirmarModal: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 }
});