import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { diccionario } from '../constants/textos';
import { supabase } from '../lib/supabase';

export default function EscuelasScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [cargando, setCargando] = useState(false);

  const [asociacionId, setAsociacionId] = useState<string | null>(null);
  const [nombreAsociacion, setNombreAsociacion] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const [provincias, setProvincias] = useState<any[]>([]);
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [dojangs, setDojangs] = useState<any[]>([]);
  const [totalAlumnos, setTotalAlumnos] = useState<number>(0);

  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<any>(null);
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<any>(null);

  const [modalProvinciaVisible, setModalProvinciaVisible] = useState(false);
  const [modalEscuelaVisible, setModalEscuelaVisible] = useState(false);

  useEffect(() => {
    const inicializar = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let idDetectado = session?.user?.id || await AsyncStorage.getItem('@asociacion_id_logueada');
        
        let query = supabase.from('asociaciones').select('*');
        if (idDetectado) {
          query = query.eq('id', idDetectado).limit(1).maybeSingle();
        } else {
          query = query.order('id', { ascending: false }).limit(1).maybeSingle(); 
        }

        const { data: asociacion, error: errorAsoc } = await query;

        if (errorAsoc) {
          console.log("Error buscando asociación:", errorAsoc.message);
        } else if (asociacion) {
          setAsociacionId(asociacion.id);
          setNombreAsociacion(asociacion.nombre || '');
          setLogoUri(asociacion.logo_url || null);

          const { data: dataProvincias, error: errorProv } = await supabase
            .from('provincias')
            .select('*')
            .order('nombre', { ascending: true });

          if (errorProv) {
            console.log("Error trayendo provincias:", errorProv.message);
          } else if (dataProvincias) {
            setProvincias(dataProvincias);
          }
        }
      } catch (err) {
        console.log("Error inicializando vista de escuelas:", err);
      }
    };
    inicializar();
  }, [idiomaActual]);

  const seleccionarProvincia = async (prov: any) => {
    setProvinciaSeleccionada(prov);
    setEscuelaSeleccionada(null);
    setDojangs([]);
    setTotalAlumnos(0);
    setModalProvinciaVisible(false);
    setCargando(true);

    try {
      const { data, error } = await supabase
        .from('escuelas')
        .select('*')
        .eq('id_provincia', prov.id)
        .eq('id_asociacion', asociacionId); 

      if (!error && data) {
          setEscuelas(data);
      } else if (error) {
          console.log("Error buscando escuelas:", error.message);
      }
    } catch (err) {
      console.log("Error buscando escuelas:", err);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarEscuela = async (esc: any) => {
    setEscuelaSeleccionada(esc);
    setModalEscuelaVisible(false);
    setCargando(true);

    try {
      const { data, error } = await supabase
        .from('dojangs')
        .select('*, practicantes(count)')
        .eq('id_escuela', esc.id);

      if (!error && data) {
        setDojangs(data);
        const sumaAlumnos = data.reduce((acc: number, curr: any) => acc + (curr.practicantes[0]?.count || 0), 0);
        setTotalAlumnos(sumaAlumnos);
      } else if (error) {
          console.log("Error buscando dojangs:", error.message);
      }
    } catch (err) {
      console.log("Error buscando dojangs:", err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image source={require('../assets/images/esquina_gris.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          
          <View style={styles.headerSection}>
            <View style={styles.logotipoContenedor}>
              <Image source={require('../assets/images/angulo_rojo1.png')} style={styles.anguloArribaIzquierda} resizeMode="stretch" />
              <Image source={require('../assets/images/angulo_rojo2.png')} style={styles.anguloAbajoDerecha} resizeMode="stretch" />
              <View style={styles.logotipoBox}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.imagenLogoPerfil} resizeMode="cover" />
                ) : (
                  <Text style={styles.logotipoText}>{idiomaActual === 'es' ? 'Logotipo' : 'Logo'}</Text>
                )}
              </View>
            </View>
            <Text style={styles.asociacionTitle}>
              {nombreAsociacion || (idiomaActual === 'es' ? 'Asociación Americana Taekwondo' : 'American Taekwondo Association')}
            </Text>
          </View>

          <View style={styles.formContainer}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{diccionario[idiomaActual]?.provincia || 'Provincia'}</Text>
              <TouchableOpacity style={styles.inputConIcono} onPress={() => setModalProvinciaVisible(true)}>
                <TextInput 
                  style={[styles.input, { flex: 1, color: '#fff' }]} 
                  editable={false} 
                  placeholder={idiomaActual === 'es' ? "Seleccionar Provincia..." : "Select Province..."}
                  placeholderTextColor="#666"
                  value={provinciaSeleccionada ? provinciaSeleccionada.nombre : ''}
                />
                <Text style={styles.triangulo}>▽</Text>
              </TouchableOpacity>
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{idiomaActual === 'es' ? 'Escuelas' : 'Schools'}</Text>
              <TouchableOpacity 
                style={styles.inputConIcono} 
                onPress={() => provinciaSeleccionada && setModalEscuelaVisible(true)}
                disabled={!provinciaSeleccionada}
              >
                <TextInput 
                  style={[styles.input, { flex: 1, color: '#fff' }]} 
                  editable={false} 
                  placeholder={provinciaSeleccionada ? (idiomaActual === 'es' ? "Seleccionar Escuela..." : "Select School...") : (idiomaActual === 'es' ? "Elija una provincia primero" : "Select a province first")}
                  placeholderTextColor="#444"
                  value={escuelaSeleccionada ? escuelaSeleccionada.nombre : ''}
                />
                <Text style={styles.triangulo}>▽</Text>
              </TouchableOpacity>
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{idiomaActual === 'es' ? 'Dojangs de la escuela' : "School's Dojangs"}</Text>
              <View style={styles.cajaDojangs}>
                {cargando ? (
                  <ActivityIndicator size="small" color="#e60000" style={{ marginTop: 20 }} />
                ) : dojangs.length > 0 ? (
                  dojangs.map((item, idx) => (
                    <Text key={idx} style={styles.itemDojangText}>• {item.nombre}</Text>
                  ))
                ) : (
                  <Text style={styles.textoVacioCaja}>
                    {idiomaActual === 'es' ? 'Ningún dojang cargado' : 'No dojangs loaded'}
                  </Text>
                )}
              </View>
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            <View style={[styles.inputGroup, { width: '55%' }]}>
              <Text style={styles.label}>{idiomaActual === 'es' ? 'Cant. de alumnos Dojang' : 'Dojang Students Count'}</Text>
              <TextInput style={[styles.input, { textAlign: 'center', fontWeight: 'bold' }]} editable={false} value={String(totalAlumnos)} />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInputCorta} resizeMode="stretch" />
            </View>

            <View style={styles.bannerPublicidadInterno}></View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalProvinciaVisible} transparent animationType="fade">
        <View style={styles.modalFondoOverlay}>
          <View style={styles.modalBoxContenedor}>
            <Text style={styles.modalTituloSelector}>{idiomaActual === 'es' ? 'PROVINCIAS' : 'PROVINCES'}</Text>
            {provincias.length > 0 ? (
              <FlatList
                data={provincias}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.opcionItemSelector} onPress={() => seleccionarProvincia(item)}>
                    <Text style={styles.opcionItemTexto}>{item.nombre}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
               <Text style={{color: '#888', textAlign: 'center', marginTop: 10}}>
                {idiomaActual === 'es' ? 'Cargando provincias o no disponibles' : 'Loading provinces or not available'}
              </Text>
            )}
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalProvinciaVisible(false)}>
              <Text style={styles.txtCerrarModal}>{idiomaActual === 'es' ? 'Cerrar ✕' : 'Close ✕'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalEscuelaVisible} transparent animationType="fade">
        <View style={styles.modalFondoOverlay}>
          <View style={styles.modalBoxContenedor}>
            <Text style={styles.modalTituloSelector}>{idiomaActual === 'es' ? 'ESCUELAS' : 'SCHOOLS'}</Text>
            {escuelas.length > 0 ? (
              <FlatList
                data={escuelas}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.opcionItemSelector} onPress={() => seleccionarEscuela(item)}>
                    <Text style={styles.opcionItemTexto}>{item.nombre}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={{color: '#888', textAlign: 'center', marginTop: 10}}>
                {idiomaActual === 'es' ? 'No hay escuelas en esta provincia' : 'No schools in this province'}
              </Text>
            )}
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalEscuelaVisible(false)}>
              <Text style={styles.txtCerrarModal}>{idiomaActual === 'es' ? 'Cerrar ✕' : 'Close ✕'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/asociacion_principal')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_home.png') : require('../assets/images/boton_home_en.png')} style={styles.imagenHome} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_escuelas.png') : require('../assets/images/boton_escuelas_en.png')} style={styles.imagenEscuelas} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.push('/eventos')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_eventos.png') : require('../assets/images/boton_eventos_en.png')} style={styles.imagenEventos} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: -100, width: 500, height: 650, opacity: 0.25, zIndex: 0 },
  fondoAbajoCentro: { position: 'absolute', bottom: 15, alignSelf: 'center', width: '90%', height: 30, zIndex: 0 },
  scrollContainer: { flexGrow: 1, paddingTop: 40, paddingHorizontal: 25, paddingBottom: 140 },
  headerSection: { alignItems: 'center', marginBottom: 40, width: '100%' },
  logotipoContenedor: { width: 140, height: 140, position: 'relative', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logotipoBox: { width: 120, height: 120, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#444', zIndex: 1, overflow: 'hidden' },
  imagenLogoPerfil: { width: '100%', height: '100%' },
  logotipoText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  anguloArribaIzquierda: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, zIndex: 0 },
  anguloAbajoDerecha: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, zIndex: 0 },
  asociacionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  formContainer: { width: '90%', marginLeft: 15 },
  inputGroup: { marginBottom: 15 },
  label: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#1c1c1c', color: '#ffffff', height: 35, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 15, fontSize: 12 },
  inputConIcono: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1c', borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingRight: 10 },
  triangulo: { color: '#ffffff', fontSize: 12, paddingRight: 10 },
  cajaDojangs: { backgroundColor: '#1c1c1c', minHeight: 120, borderTopLeftRadius: 6, borderTopRightRadius: 6, padding: 15 },
  itemDojangText: { color: '#ffffff', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  textoVacioCaja: { color: '#555', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  pinceladaInput: { width: '50%', height: 25, marginTop: -2, marginLeft: -35, alignSelf: 'flex-start' },
  pinceladaInputCorta: { width: '90%', height: 25, marginTop: -2, marginLeft: -35, alignSelf: 'flex-start' },
  bannerPublicidadInterno: { width: '100%', height: 60, backgroundColor: 'transparent', marginTop: 15 },
  modalFondoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBoxContenedor: { width: '85%', maxHeight: '70%', backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 20 },
  modalTituloSelector: { color: '#e60000', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, textAlign: 'center' },
  opcionItemSelector: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  opcionItemTexto: { color: '#fff', fontSize: 14 },
  btnCerrarModal: { marginTop: 15, alignSelf: 'center', padding: 8 },
  txtCerrarModal: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  navBar: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 10, zIndex: 10 },
  navBoton: { width: '25%', alignItems: 'center' },
  imagenHome: { width: '100%', height: 27 },
  imagenEscuelas: { width: '100%', height: 30 },
  imagenEventos: { width: '100%', height: 25 }
});