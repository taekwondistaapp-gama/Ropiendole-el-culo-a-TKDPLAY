import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView, Image, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; 
import * as FileSystem from 'expo-file-system'; 
import { supabase } from '../lib/supabase'; 
import { diccionario } from '../constants/textos'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

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

export default function RegistroScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [guardando, setGuardando] = useState(false);

  // --- CAMPOS DEL FORMULARIO ---
  const [nombre, setNombre] = useState('');
  const [presidente, setPresidente] = useState('');
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  // --- ESTADOS DE GEOLOCALIZACIÓN Y SELECCIÓN ---
  const [paises, setPaises] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [paisSeleccionado, setPaisSeleccionado] = useState<any>(null);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<any>(null);
  const [provinciaTextoLibre, setProvinciaTextoLibre] = useState('');
  const [graduacionSeleccionada, setGraduacionSeleccionada] = useState<any>(null);

  const [cargandoPaises, setCargandoPaises] = useState(true);
  const [cargandoProvincias, setCargandoProvincias] = useState(false);

  // Modales
  const [modalPaisVisible, setModalPaisVisible] = useState(false);
  const [modalProvinciaVisible, setModalProvinciaVisible] = useState(false);
  const [modalGraduacionVisible, setModalGraduacionVisible] = useState(false);

  useEffect(() => {
    const inicializarRegistro = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
      
      try {
        setCargandoPaises(true);
        const { data: dataPaises } = await supabase.from('paises').select('*').order(guardado === 'en' ? 'nombre_en' : 'nombre_es', { ascending: true });
        if (dataPaises) setPaises(dataPaises);

        // 🔥 CHAU FANTASMA: Se borró todo el código que buscaba sesiones viejas.

      } catch (err) {
        console.log("Error inicializando formulario:", err);
      } finally {
        setCargandoPaises(false);
      }
    };
    inicializarRegistro();
  }, [idiomaActual]);

  useEffect(() => {
    const cargarProvinciasRegistro = async () => {
      if (!paisSeleccionado) {
        setProvincias([]);
        return;
      }
      try {
        setCargandoProvincias(true);
        const { data, error } = await supabase
          .from('provincias')
          .select('*')
          .eq('id_pais', paisSeleccionado.id)
          .order('nombre', { ascending: true });

        if (!error && data) setProvincias(data);
      } catch (err) {
        console.log("Error trayendo provincias:", err);
      } finally {
        setCargandoProvincias(false);
      }
    };
    cargarProvinciasRegistro();
  }, [paisSeleccionado]);

  const abrirGaleriaDispositivo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos para subir el logo.");
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

 const procesarFormularioForm = async () => {
    const tieneProvinciaValida = provincias.length > 0 ? provinciaSeleccionada : provinciaTextoLibre.trim();

    if (!nombre || !paisSeleccionado || !tieneProvinciaValida || !alias || !password) {
      Alert.alert("Error", idiomaActual === 'es' ? "Por favor completa todos los datos (Nombre, País, Provincia, Alias y Password)." : "Please fill all required fields.");
      return;
    }

    setGuardando(true);
    try {
      let urlFinalLogo = logoUri;

      if (logoUri && !logoUri.startsWith('http')) {
        urlFinalLogo = await subirLogoASupabase(logoUri);
      }

      const paqueteDatos = {
        nombre,
        presidente,
        alias,
        password, 
        id_graduacion: graduacionSeleccionada?.id || null, 
        logo_url: urlFinalLogo,
        id_pais: paisSeleccionado?.id || null,             
        // 🔥 ACÁ DEJAMOS SOLO EL ID Y ELIMINAMOS LA COLUMNA FANTASMA
        id_provincia: provincias.length > 0 ? (provinciaSeleccionada?.id || null) : null
      };

      const { error } = await supabase
        .from('asociaciones')
        .insert([paqueteDatos]);

      if (error) throw error;
      
      Alert.alert("Ok", idiomaActual === 'es' ? "Asociación creada con éxito." : "Association created.");
      router.back();

    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="cover" />
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          
          <Text style={styles.tituloHeader}>
            <Text style={styles.tituloHeaderRojo}>
              {idiomaActual === 'es' ? 'Crear' : 'Create'}
            </Text>{' '}
            {idiomaActual === 'es' ? 'usuario' : 'user'}
          </Text>

          <View style={styles.inputGroupNombre}>
            <Text style={styles.labelNombre}>{idiomaActual === 'es' ? 'Nombre de la Asociación o Escuela' : 'Association or School Name'}</Text>
            <TextInput style={styles.inputTxtNombre} value={nombre} onChangeText={setNombre} selectionColor="#e60000" />
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaNombre} resizeMode="stretch" />
          </View>

          <View style={styles.filaDivididaGeo}>
            <View style={styles.inputGroupPais}>
              <Text style={styles.labelPais}>{idiomaActual === 'es' ? 'País de Origen' : 'Country of Origin'}</Text>
              <TouchableOpacity style={styles.inputConIconoPais} onPress={() => !cargandoPaises && setModalPaisVisible(true)} activeOpacity={0.8}>
                <TextInput 
                  style={styles.inputTxtPais} 
                  editable={false} 
                  placeholder={idiomaActual === 'es' ? "Elegir..." : "Select..."}
                  placeholderTextColor="#555"
                  value={paisSeleccionado ? (idiomaActual === 'es' ? paisSeleccionado.nombre_es : paisSeleccionado.nombre_en) : ''}
                />
                {cargandoPaises ? <ActivityIndicator size="small" color="#e60000" style={{ marginRight: 5 }} /> : <Text style={styles.trianguloPais}>▽</Text>}
              </TouchableOpacity>
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaPais} resizeMode="stretch" />
            </View>

            <View style={styles.inputGroupProvincia}>
              <Text style={styles.labelProvincia}>{diccionario[idiomaActual].provincia}</Text>
              {cargandoProvincias ? (
                <View style={styles.inputConIconoProvincia}>
                  <TextInput style={styles.inputTxtProvincia} editable={false} placeholder="..." placeholderTextColor="#555" />
                  <ActivityIndicator size="small" color="#e60000" style={{ marginRight: 5 }} />
                </View>
              ) : !paisSeleccionado ? (
                <View style={[styles.inputConIconoProvincia, { opacity: 0.4 }]}>
                  <TextInput style={styles.inputTxtProvincia} editable={false} placeholder="---" placeholderTextColor="#444" />
                </View>
              ) : provincias.length > 0 ? (
                <TouchableOpacity style={styles.inputConIconoProvincia} onPress={() => setModalProvinciaVisible(true)} activeOpacity={0.8}>
                  <TextInput style={styles.inputTxtProvincia} editable={false} placeholder={idiomaActual === 'es' ? "Elegir..." : "Select..."} placeholderTextColor="#555" value={provinciaSeleccionada ? provinciaSeleccionada.nombre : ''} />
                  <Text style={styles.trianguloProvincia}>▽</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.inputConIconoProvincia}>
                  <TextInput style={styles.inputTxtProvincia} editable={true} placeholder={idiomaActual === 'es' ? "Escriba..." : "Type..."} placeholderTextColor="#555" selectionColor="#e60000" value={provinciaTextoLibre} onChangeText={setProvinciaTextoLibre} />
                </View>
              )}
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaProvincia} resizeMode="stretch" />
            </View>
          </View>

          <View style={styles.inputGroupPresidente}>
            <Text style={styles.labelPresidente}>{idiomaActual === 'es' ? 'Presidente' : 'President'}</Text>
            <TextInput style={styles.inputTxtPresidente} value={presidente} onChangeText={setPresidente} selectionColor="#e60000" />
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaPresidente} resizeMode="stretch" />
          </View>

          <View style={styles.inputGroupGraduacion}>
            <Text style={styles.labelGraduacion}>{idiomaActual === 'es' ? 'Graduación' : 'Rank'}</Text>
            <TouchableOpacity style={styles.inputConIconoGraduacion} onPress={() => setModalGraduacionVisible(true)} activeOpacity={0.8}>
              <TextInput 
                style={styles.inputTxtGraduacion} 
                editable={false} 
                placeholder={idiomaActual === 'es' ? "Seleccionar..." : "Select Rank..."}
                placeholderTextColor="#555" 
                value={graduacionSeleccionada ? (idiomaActual === 'es' ? graduacionSeleccionada.es : graduacionSeleccionada.en) : ''}
              />
              <Text style={styles.trianguloGraduacion}>▽</Text>
            </TouchableOpacity>
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaGraduacion} resizeMode="stretch" />
          </View>

          <View style={styles.filaDivididaCredenciales}>
            <View style={styles.inputGroupAlias}>
              <Text style={styles.labelAlias}>{idiomaActual === 'es' ? 'Elegir Alias' : 'Choose Username'}</Text>
              <TextInput style={styles.inputTxtAlias} editable={true} value={alias} onChangeText={setAlias} selectionColor="#e60000" autoCapitalize="none" />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaAlias} resizeMode="stretch" />
            </View>
            <View style={styles.inputGroupPassword}>
              <Text style={styles.labelPassword}>{idiomaActual === 'es' ? 'Elegir Password' : 'Choose Password'}</Text>
              <TextInput style={styles.inputTxtPassword} editable={true} placeholderTextColor="#444" value={password} onChangeText={setPassword} secureTextEntry={true} selectionColor="#e60000" />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaPassword} resizeMode="stretch" />
            </View>
          </View>

          <View style={styles.bloquePieSeccion}>
            <TouchableOpacity style={styles.cajaSubirLogoContenedor} onPress={abrirGaleriaDispositivo} activeOpacity={0.7}>
              <View style={styles.cuadroLogoAncla}>
                <View style={styles.cuadroLogoMascara}>
                  {logoUri && <Image source={{ uri: logoUri }} style={styles.imagenLogoPreview} />}
                </View>
                <Image source={require('../assets/images/angulo_rojo1.png')} style={styles.anguloRojoEstilo} resizeMode="stretch" />
              </View>
              <Text style={styles.textoSubirLogoLabel}>
                {idiomaActual === 'es' ? `Subir\nLogotipo` : `Upload\nLogo`}
              </Text>
            </TouchableOpacity>

            <View style={styles.columnaBotonAccionSubmit}>
              {guardando ? (
                <ActivityIndicator size="small" color="#e60000" />
              ) : (
                <TouchableOpacity onPress={procesarFormularioForm} style={styles.hitboxBotonPngCrear}>
                  <Image source={require('../assets/images/boton_crear.png')} style={styles.imagenAssetBotonCrear} resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalPaisVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>{idiomaActual === 'es' ? 'Seleccionar País' : 'Select Country'}</Text>
            <FlatList data={paises} keyExtractor={(item: any) => item.id.toString()} renderItem={({ item }) => (
              <TouchableOpacity style={styles.opcionItem} onPress={() => { 
                setPaisSeleccionado(item); 
                setProvinciaSeleccionada(null);
                setProvinciaTextoLibre(''); 
                setModalPaisVisible(false); 
              }}>
                <Text style={styles.opcionTexto}>{idiomaActual === 'es' ? item.nombre_es : item.nombre_en}</Text>
              </TouchableOpacity>
            )}/>
            <TouchableOpacity style={styles.botonCerrarModal} onPress={() => setModalPaisVisible(false)}>
              <Text style={styles.textoCerrarModal}>{idiomaActual === 'es' ? 'Cancelar' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalProvinciaVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>{idiomaActual === 'es' ? 'Seleccionar Región' : 'Select Region'}</Text>
            <FlatList data={provincias} keyExtractor={(item: any) => item.id.toString()} renderItem={({ item }) => (
              <TouchableOpacity style={styles.opcionItem} onPress={() => { setProvinciaSeleccionada(item); setModalProvinciaVisible(false); }}>
                <Text style={styles.opcionTexto}>{item.nombre}</Text>
              </TouchableOpacity>
            )}/>
            <TouchableOpacity style={styles.botonCerrarModal} onPress={() => setModalProvinciaVisible(false)}>
              <Text style={styles.textoCerrarModal}>{idiomaActual === 'es' ? 'Cancelar' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalGraduacionVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>{idiomaActual === 'es' ? 'Seleccionar Graduación' : 'Select Rank'}</Text>
            <FlatList data={GRADUACIONES_BILINGUES} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
              <TouchableOpacity style={styles.opcionItem} onPress={() => { setGraduacionSeleccionada(item); setModalGraduacionVisible(false); }}>
                <Text style={styles.opcionTexto}>{idiomaActual === 'es' ? item.es : item.en}</Text>
              </TouchableOpacity>
            )}/>
            <TouchableOpacity style={styles.botonCerrarModal} onPress={() => setModalGraduacionVisible(false)}>
              <Text style={styles.textoCerrarModal}>{idiomaActual === 'es' ? 'Cancelar' : 'Cancel'}</Text>
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
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, zIndex: -1 },
  fondoAbajoCentro: { position: 'absolute', bottom: 20, alignSelf: 'center', width: '90%', height: 15, zIndex: -1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 30, paddingBottom: 80 },
  tituloHeader: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 35 },
  tituloHeaderRojo: { color: '#e60000' },
  inputGroupNombre: { marginBottom: 10, width: '100%' },
  labelNombre: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  inputTxtNombre: { backgroundColor: '#1c1c1c', color: '#ffffff', height: 35, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 15, fontSize: 12 },
  pinceladaNombre: { width: '90%', height: 8, marginTop: -2, marginLeft: -30, alignSelf: 'flex-start' },
  filaDivididaGeo: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  inputGroupPais: { marginBottom: 10, flex: 1, marginRight: 15 },
  labelPais: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  inputConIconoPais: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1c', borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingRight: 10 },
  inputTxtPais: { flex: 1, backgroundColor: '#1c1c1c', color: '#ffffff', height: 35, paddingHorizontal: 15, fontSize: 12, borderTopLeftRadius: 6 },
  trianguloPais: { color: '#ffffff', fontSize: 12, paddingRight: 10 },
  pinceladaPais: { width: '95%', height: 8, marginTop: -2, marginLeft: -20, alignSelf: 'flex-start' },
  inputGroupProvincia: { marginBottom: 10, flex: 1 },
  labelProvincia: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  inputConIconoProvincia: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1c', borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingRight: 10 },
  inputTxtProvincia: { flex: 1, backgroundColor: '#1c1c1c', color: '#ffffff', height: 35, paddingHorizontal: 15, fontSize: 12, borderTopLeftRadius: 6 },
  trianguloProvincia: { color: '#ffffff', fontSize: 12, paddingRight: 10 },
  pinceladaProvincia: { width: '95%', height: 8, marginTop: -2, marginLeft: -20, alignSelf: 'flex-start' },
  inputGroupPresidente: { marginBottom: 10, width: '100%' },
  labelPresidente: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  inputTxtPresidente: { backgroundColor: '#1c1c1c', color: '#ffffff', height: 35, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 15, fontSize: 12 },
  pinceladaPresidente: { width: '90%', height: 8, marginTop: -2, marginLeft: -30, alignSelf: 'flex-start' },
  inputGroupGraduacion: { marginBottom: 10, width: '55%', paddingRight: 10 },
  labelGraduacion: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  inputConIconoGraduacion: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1c', borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingRight: 10 },
  inputTxtGraduacion: { flex: 1, backgroundColor: '#1c1c1c', color: '#ffffff', height: 35, paddingHorizontal: 15, fontSize: 12, borderTopLeftRadius: 6 },
  trianguloGraduacion: { color: '#ffffff', fontSize: 12, paddingRight: 10 },
  pinceladaGraduacion: { width: '90%', height: 8, marginTop: -2, marginLeft: -25, alignSelf: 'flex-start' },
  filaDivididaCredenciales: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  inputGroupAlias: { marginBottom: 10, flex: 1, marginRight: 15 },
  labelAlias: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  inputTxtAlias: { backgroundColor: '#1c1c1c', color: '#ffffff', height: 35, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 15, fontSize: 12 },
  pinceladaAlias: { width: '95%', height: 8, marginTop: -2, marginLeft: -20, alignSelf: 'flex-start' },
  inputGroupPassword: { marginBottom: 10, flex: 1 },
  labelPassword: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  inputTxtPassword: { backgroundColor: '#1c1c1c', color: '#ffffff', height: 35, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 15, fontSize: 12 },
  pinceladaPassword: { width: '95%', height: 8, marginTop: -2, marginLeft: -20, alignSelf: 'flex-start' },
  bloquePieSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, width: '100%' },
  cajaSubirLogoContenedor: { flexDirection: 'row', alignItems: 'center', flex: 0.4 },
  cuadroLogoAncla: { position: 'relative', marginRight: 12 },
  cuadroLogoMascara: { width: 75, height: 75, borderWidth: 1.5, borderColor: '#333', backgroundColor: '#0a0a0a', zIndex: 1, overflow: 'hidden' },
  imagenLogoPreview: { width: '100%', height: '100%' },
  anguloRojoEstilo: { position: 'absolute', bottom: -6, left: -6, width: 55, height: 55, zIndex: 0 },
  textoSubirLogoLabel: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', lineHeight: 18 },
  columnaBotonAccionSubmit: { flex: 0.6, alignItems: 'flex-end', justifyContent: 'center' },
  hitboxBotonPngCrear: { width: '100%', height: 70, justifyContent: 'center', alignItems: 'flex-end' },
  imagenAssetBotonCrear: { width: '100%', height: '100%' },
  hitboxBotonNativoActualizar: { height: 50, justifyContent: 'center' },
  textoActualizarNativoEstilo: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5, textAlign: 'right' },
  textoActualizarNativoRojo: { color: '#e60000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContenido: { width: '85%', maxHeight: '60%', backgroundColor: '#121212', borderRadius: 8, borderWidth: 1, borderColor: '#252525', padding: 20 },
  modalTitulo: { color: '#e60000', fontSize: 14, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', textTransform: 'uppercase' },
  opcionItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', width: '100%' },
  opcionTexto: { color: '#fff', fontSize: 13, fontWeight: '500' },
  botonCerrarModal: { marginTop: 15, backgroundColor: '#e60000', paddingVertical: 10, borderRadius: 4, alignItems: 'center' },
  textoCerrarModal: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});