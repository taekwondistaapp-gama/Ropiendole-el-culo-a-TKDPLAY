import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const GRADUACIONES_BILINGUES = [
  { id: 1, es: 'Blanco', en: 'White Belt' },
  { id: 2, es: 'Blanco Punta Amarilla', en: 'White Belt Yellow Stripe' },
  { id: 3, es: 'Amarillo', en: 'Yellow Belt' },
  { id: 4, es: 'Amarillo Punta Verde', en: 'Yellow Belt Green Stripe' },
  { id: 5, es: 'Verde', en: 'Green Belt' },
  { id: 6, es: 'Verde Punta Azul', en: 'Green Belt Blue Stripe' },
  { id: 7, es: 'Azul', en: 'Blue Belt' },
  { id: 8, es: 'Azul Punta Roja', en: 'Blue Belt Red Stripe' },
  { id: 9, es: 'Rojo', en: 'Red Belt' },
  { id: 10, es: 'Rojo Punta Negra', en: 'Red Belt Black Stripe' },
  { id: 11, es: '1° Dan', en: '1st Dan' },
  { id: 12, es: '2° Dan', en: '2nd Dan' },
  { id: 13, es: '3° Dan', en: '3rd Dan' },
  { id: 14, es: '4° Dan', en: '4th Dan' },
  { id: 15, es: '5° Dan', en: '5th Dan' },
  { id: 16, es: '6° Dan', en: '6th Dan' },
  { id: 17, es: '7° Dan', en: '7th Dan' },
  { id: 18, es: '8° Dan', en: '8th Dan' },
  { id: 19, es: '9° Dan', en: '9th Dan' }
];

export default function EscuelaActualizarScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [cargando, setCargando] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [director, setDirector] = useState(''); 
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null); 
  const [provinciaManual, setProvinciaManual] = useState(''); 

  const [paises, setPaises] = useState<any[]>([]);
  const [provincias, setProvincias] = useState<any[]>([]);
  const [graduaciones, setGraduaciones] = useState<any[]>([]);
  const [asociaciones, setAsociaciones] = useState<any[]>([]);
  
  const [paisSeleccionado, setPaisSeleccionado] = useState<any>(null);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<any>(null);
  const [graduacionSeleccionada, setGraduacionSeleccionada] = useState<any>(null);
  const [asociacionSeleccionada, setAsociacionSeleccionada] = useState<any>(null);

  const [modalPais, setModalPais] = useState(false);
  const [modalProvincia, setModalProvincia] = useState(false);
  const [modalGraduacion, setModalGraduacion] = useState(false);
  const [modalAsociacion, setModalAsociacion] = useState(false);

  useEffect(() => {
    const inicializarYBuscarDatos = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
      
      try {
        const [
          { data: dataPaises }, 
          { data: dataGraduaciones },
          { data: dataAsociaciones }
        ] = await Promise.all([
          supabase.from('paises').select('*').order('nombre_es', { ascending: true }),
          supabase.from('graduaciones').select('*').order('id', { ascending: true }),
          supabase.from('asociaciones').select('id, nombre').order('nombre', { ascending: true })
        ]);
        
        if (dataPaises) setPaises(dataPaises);
        if (dataGraduaciones) setGraduaciones(dataGraduaciones);
        if (dataAsociaciones) setAsociaciones(dataAsociaciones);

        const idDetectado = await AsyncStorage.getItem('@escuela_id_logueada'); 
        
        if (idDetectado) {
          setUserId(idDetectado);
          
          const { data: escuela, error } = await supabase
            .from('escuelas')
            .select('*')
            .eq('id', idDetectado)
            .limit(1)
            .maybeSingle();

          if (!error && escuela) {
            setNombre(escuela.nombre || '');
            setDirector(escuela.director || '');
            setAlias(escuela.alias || '');
            setPassword(escuela.password || ''); 
            setLogoUri(escuela.logo_url || null);
            
            if (escuela.id_graduacion && dataGraduaciones) {
              const grad = dataGraduaciones.find((g: any) => g.id === escuela.id_graduacion);
              if (grad) setGraduacionSeleccionada(grad);
            }
            if (escuela.id_asociacion && dataAsociaciones) {
              const asoc = dataAsociaciones.find((a: any) => a.id === escuela.id_asociacion);
              if (asoc) setAsociacionSeleccionada(asoc);
            }
            if (escuela.id_pais && dataPaises) {
              const pais = dataPaises.find((p: any) => p.id === escuela.id_pais);
              if (pais) {
                setPaisSeleccionado(pais);
                const { data: provData } = await supabase.from('provincias').select('*').eq('id_pais', pais.id);
                if (provData && provData.length > 0) {
                  setProvincias(provData);
                  if (escuela.id_provincia) {
                    const prov = provData.find((p: any) => p.id === escuela.id_provincia);
                    if (prov) setProvinciaSeleccionada(prov);
                  }
                }
              }
            }
          }
        } else {
          Alert.alert("Error", "No se encontró tu sesión. Por favor, volvé a iniciar sesión.");
          router.replace('/');
        }
      } catch (error) {
        console.log("Error cargando perfil:", error);
      }
    };

    inicializarYBuscarDatos();
  }, []);

  const seleccionarPais = async (pais: any) => {
    setPaisSeleccionado(pais);
    setProvinciaSeleccionada(null);
    setProvinciaManual('');
    setModalPais(false);
    
    const { data } = await supabase.from('provincias').select('*').eq('id_pais', pais.id).order('nombre', { ascending: true });
    if (data && data.length > 0) {
      setProvincias(data);
    } else {
      setProvincias([]);
    }
  };

  const abrirGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para subir el logotipo.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
      setLogoUri(resultado.assets[0].uri);
    }
  };

  const subirLogoASupabase = async (uri: string) => {
    try {
      if (uri.startsWith('http')) return uri;

      let fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
      if (fileExt === 'jpg') fileExt = 'jpeg'; 
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const supabaseUrl = 'https://xjvusrgxwhchxhriwedt.supabase.co'; 
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdnVzcmd4d2hjaHhocml3ZWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTg5MTQsImV4cCI6MjA5NTM5NDkxNH0.71av-GKLhzZxOFjjqdu_eoKQg2aqrJ65UjtC6liBbbE';
      
      const uploadUrl = `${supabaseUrl}/storage/v1/object/logos_escuelas/${fileName}`;

      let uriParaSubir = uri;
      if (uri.startsWith('content://')) {
        const tempPath = FileSystem.cacheDirectory + fileName;
        await FileSystem.copyAsync({ from: uri, to: tempPath });
        uriParaSubir = tempPath; 
      }

      const fileRes = await fetch(uriParaSubir);
      const blob = await fileRes.blob();

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': `image/${fileExt}`
        },
        body: blob
      });

      if (!uploadRes.ok) {
        const errorInfo = await uploadRes.text();
        throw new Error(`Rechazo del servidor (${uploadRes.status}): ${errorInfo}`);
      }

      return `${supabaseUrl}/storage/v1/object/public/logos_escuelas/${fileName}`;
      
    } catch (error: any) {
      console.error("Fallo la subida universal:", error);
      throw new Error(`Error en la red: ${error.message}`);
    }
  };

  const actualizarEscuela = async () => {
    if (!nombre || !paisSeleccionado || !director || !graduacionSeleccionada || !alias || !password) {
      Alert.alert('Error', idiomaActual === 'es' ? 'Por favor completá todos los campos obligatorios.' : 'Please fill all required fields.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'No se puede actualizar porque no hay una sesión activa.');
      return;
    }

    setCargando(true);
    try {
      let urlFinalLogo = logoUri;

      if (logoUri && !logoUri.startsWith('http')) {
        urlFinalLogo = await subirLogoASupabase(logoUri);
      }

      const paqueteDatos = {
        nombre: nombre.trim(),
        id_pais: paisSeleccionado.id,
        id_provincia: provinciaSeleccionada ? provinciaSeleccionada.id : null,
        director: director.trim(), 
        id_graduacion: graduacionSeleccionada.id,
        alias: alias.trim(),
        password: password.trim(),
        id_asociacion: asociacionSeleccionada ? asociacionSeleccionada.id : null, 
        logo_url: urlFinalLogo
      };

      const { data, error } = await supabase
        .from('escuelas')
        .update(paqueteDatos)
        .eq('id', userId)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Supabase bloqueó la actualización. Asegurate de tener los permisos RLS activados para UPDATE en la tabla escuelas.");
      }
      
      Alert.alert('Éxito', idiomaActual === 'es' ? 'Datos de tu escuela actualizados.' : 'School data updated.');
      router.back(); 
      
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />

      <TouchableOpacity style={styles.btnDevReset} onPress={() => router.back()}>
        <Text style={styles.txtDevReset}>← VOLVER</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          
          <Text style={styles.tituloHeader}>
            <Text style={styles.tituloHeaderRojo}>{idiomaActual === 'es' ? 'Actualizar ' : 'Update '}</Text>{idiomaActual === 'es' ? 'datos' : 'data'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Nombre de la Escuela o Dojang' : 'School or Dojang Name'}</Text>
            <TextInput style={styles.input} selectionColor="#e60000" value={nombre} onChangeText={setNombre} />
            <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
          </View>

          <View style={styles.rowGroup}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>{idiomaActual === 'es' ? 'País de Origen' : 'Country'}</Text>
              <TouchableOpacity style={styles.inputSelect} onPress={() => setModalPais(true)}>
                <Text style={styles.inputText}>{paisSeleccionado ? (idiomaActual === 'es' ? paisSeleccionado.nombre_es : paisSeleccionado.nombre_en) : 'Elegir...'}</Text>
                <Text style={styles.triangulo}>▽</Text>
              </TouchableOpacity>
              <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>{idiomaActual === 'es' ? 'Provincia / Estado' : 'Province / State'}</Text>
              {paisSeleccionado && provincias.length === 0 ? (
                <TextInput 
                  style={styles.input} 
                  selectionColor="#e60000" 
                  value={provinciaManual} 
                  onChangeText={setProvinciaManual}
                  placeholder={idiomaActual === 'es' ? 'Escribir...' : 'Type...'}
                  placeholderTextColor="#555"
                />
              ) : (
                <TouchableOpacity style={styles.inputSelect} onPress={() => setModalProvincia(true)} disabled={!paisSeleccionado}>
                  <Text style={styles.inputText}>{provinciaSeleccionada ? provinciaSeleccionada.nombre : '---'}</Text>
                  <Text style={styles.triangulo}>▽</Text>
                </TouchableOpacity>
              )}
              <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Director' : 'Director'}</Text>
            <TextInput style={styles.input} selectionColor="#e60000" value={director} onChangeText={setDirector} />
            <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Graduación' : 'Rank'}</Text>
            <TouchableOpacity style={styles.inputSelect} onPress={() => setModalGraduacion(true)}>
              <Text style={styles.inputText}>{graduacionSeleccionada ? (idiomaActual === 'es' ? (graduacionSeleccionada.nombre_es || graduacionSeleccionada.nombre) : (graduacionSeleccionada.nombre_en || graduacionSeleccionada.nombre)) : 'Seleccionar...'}</Text>
              <Text style={styles.triangulo}>▽</Text>
            </TouchableOpacity>
            <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Asociación (Opcional)' : 'Assoc. (Optional)'}</Text>
            <TouchableOpacity style={styles.inputSelect} onPress={() => setModalAsociacion(true)}>
              <Text style={styles.inputText} numberOfLines={1}>{asociacionSeleccionada ? asociacionSeleccionada.nombre : 'Ninguna...'}</Text>
              <Text style={styles.triangulo}>▽</Text>
            </TouchableOpacity>
            <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
          </View>

          <View style={styles.rowGroup}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>{idiomaActual === 'es' ? 'Tu Alias' : 'Your Alias'}</Text>
              <TextInput style={[styles.input, {opacity: 0.5}]} editable={false} value={alias} />
              <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>{idiomaActual === 'es' ? 'Cambiar Password' : 'Change Password'}</Text>
              <TextInput style={styles.input} selectionColor="#e60000" secureTextEntry autoCapitalize="none" value={password} onChangeText={setPassword} />
              <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaLarga} resizeMode="stretch" />
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.boxLogoContainer}>
              <TouchableOpacity onPress={abrirGaleria} style={styles.logotipoWrapper}>
                <Image source={require('../assets/images/angulo_rojo1.png')} style={styles.anguloLogoIzq} resizeMode="stretch" />
                <Image source={require('../assets/images/angulo_rojo2.png')} style={styles.anguloLogoDer} resizeMode="stretch" />
                <View style={styles.boxLogoGris}>
                  {logoUri && <Image source={{ uri: logoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
                </View>
              </TouchableOpacity>
              <Text style={styles.txtSubirLogo}>{idiomaActual === 'es' ? 'Cambiar\nLogotipo' : 'Change\nLogo'}</Text>
            </View>
            
            <TouchableOpacity onPress={actualizarEscuela} disabled={cargando} style={styles.btnCrearHitbox}>
              {cargando ? (
                <ActivityIndicator size="large" color="#e60000" />
              ) : (
                <Text style={{color: '#fff', fontSize: 16, fontWeight: '900'}}>{idiomaActual === 'es' ? 'GUARDAR' : 'SAVE'}</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalPais} transparent animationType="fade">
        <View style={styles.modalFondoOverlay}>
          <View style={styles.modalBoxContenedor}>
            <Text style={styles.modalTituloSelector}>{idiomaActual === 'es' ? 'PAÍSES' : 'COUNTRIES'}</Text>
            <FlatList data={paises} keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)} renderItem={({ item }) => (
              <TouchableOpacity style={styles.opcionItemSelector} onPress={() => seleccionarPais(item)}>
                <Text style={styles.opcionItemTexto}>{idiomaActual === 'es' ? item.nombre_es : item.nombre_en}</Text>
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalPais(false)}><Text style={styles.txtCerrarModal}>{idiomaActual === 'es' ? 'Cerrar ✕' : 'Close ✕'}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalProvincia} transparent animationType="fade">
        <View style={styles.modalFondoOverlay}>
          <View style={styles.modalBoxContenedor}>
            <Text style={styles.modalTituloSelector}>{idiomaActual === 'es' ? 'PROVINCIAS' : 'PROVINCES'}</Text>
            <FlatList data={provincias} keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)} renderItem={({ item }) => (
              <TouchableOpacity style={styles.opcionItemSelector} onPress={() => { setProvinciaSeleccionada(item); setModalProvincia(false); }}>
                <Text style={styles.opcionItemTexto}>{item.nombre}</Text>
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalProvincia(false)}><Text style={styles.txtCerrarModal}>{idiomaActual === 'es' ? 'Cerrar ✕' : 'Close ✕'}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalGraduacion} transparent animationType="fade">
        <View style={styles.modalFondoOverlay}>
          <View style={styles.modalBoxContenedor}>
            <Text style={styles.modalTituloSelector}>{idiomaActual === 'es' ? 'GRADUACIONES' : 'RANKS'}</Text>
            <FlatList data={graduaciones} keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)} renderItem={({ item }) => (
              <TouchableOpacity style={styles.opcionItemSelector} onPress={() => { setGraduacionSeleccionada(item); setModalGraduacion(false); }}>
                <Text style={styles.opcionItemTexto}>{idiomaActual === 'es' ? (item.nombre_es || item.nombre) : (item.nombre_en || item.nombre)}</Text>
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalGraduacion(false)}><Text style={styles.txtCerrarModal}>{idiomaActual === 'es' ? 'Cerrar ✕' : 'Close ✕'}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalAsociacion} transparent animationType="fade">
        <View style={styles.modalFondoOverlay}>
          <View style={styles.modalBoxContenedor}>
            <Text style={styles.modalTituloSelector}>{idiomaActual === 'es' ? 'ASOCIACIONES' : 'ASSOCIATIONS'}</Text>
            <TouchableOpacity style={styles.opcionItemSelector} onPress={() => { setAsociacionSeleccionada(null); setModalAsociacion(false); }}>
              <Text style={[styles.opcionItemTexto, { color: '#888', fontStyle: 'italic' }]}>{idiomaActual === 'es' ? 'Ninguna (Independiente)' : 'None (Independent)'}</Text>
            </TouchableOpacity>
            <FlatList data={asociaciones} keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)} renderItem={({ item }) => (
              <TouchableOpacity style={styles.opcionItemSelector} onPress={() => { setAsociacionSeleccionada(item); setModalAsociacion(false); }}>
                <Text style={styles.opcionItemTexto}>{item.nombre}</Text>
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalAsociacion(false)}><Text style={styles.txtCerrarModal}>{idiomaActual === 'es' ? 'Cerrar ✕' : 'Close ✕'}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, opacity: 0.6, zIndex: -1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 60, paddingBottom: 40 },
  btnDevReset: { position: 'absolute', top: 45, left: 15, borderWidth: 1, borderColor: '#333', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, zIndex: 10 },
  txtDevReset: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tituloHeader: { color: '#ffffff', fontSize: 28, fontWeight: '900', letterSpacing: 0.5, marginBottom: 40, textAlign: 'center' },
  tituloHeaderRojo: { color: '#e60000' },
  inputGroup: { position: 'relative', marginBottom: 25 },
  rowGroup: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  label: { color: '#ffffff', fontSize: 14, fontWeight: '900', marginBottom: 8 },
  input: { backgroundColor: '#1c1c1c', color: '#ffffff', height: 45, borderTopLeftRadius: 4, borderTopRightRadius: 4, paddingHorizontal: 15, fontSize: 15 },
  inputSelect: { backgroundColor: '#1c1c1c', height: 45, borderTopLeftRadius: 4, borderTopRightRadius: 4, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputText: { color: '#fff', fontSize: 14 },
  triangulo: { color: '#fff', fontSize: 12 },
  pinceladaLarga: { position: 'absolute', bottom: -10, left: 0, width: '90%', height: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 },
  boxLogoContainer: { flexDirection: 'row', alignItems: 'center' },
  logotipoWrapper: { position: 'relative', width: 70, height: 70, marginRight: 10 },
  boxLogoGris: { width: '100%', height: '100%', backgroundColor: '#111', borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  anguloLogoIzq: { position: 'absolute', top: -4, left: -4, width: 25, height: 25, zIndex: 1 },
  anguloLogoDer: { position: 'absolute', bottom: -4, right: -4, width: 25, height: 25, zIndex: 1 },
  txtSubirLogo: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  btnCrearHitbox: { width: 140, height: 65, justifyContent: 'center', alignItems: 'center' },
  modalFondoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBoxContenedor: { width: '85%', maxHeight: '70%', backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 20 },
  modalTituloSelector: { color: '#e60000', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, textAlign: 'center' },
  opcionItemSelector: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  opcionItemTexto: { color: '#fff', fontSize: 14 },
  btnCerrarModal: { marginTop: 15, alignSelf: 'center', padding: 8 },
  txtCerrarModal: { color: '#666', fontSize: 12, fontWeight: 'bold' },
});