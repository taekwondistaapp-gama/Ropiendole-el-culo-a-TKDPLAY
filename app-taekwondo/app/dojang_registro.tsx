import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList } from 'react-native';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker'; 
import * as FileSystem from 'expo-file-system'; 

export default function DojangRegistroScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [cargando, setCargando] = useState(false);

  // --- CAMPOS DEL FORMULARIO ---
  const [alias, setAlias] = useState(''); // 🔥 EL DATO FUNDAMENTAL
  const [nombre, setNombre] = useState('');
  const [provinciaManual, setProvinciaManual] = useState(''); 
  const [logoUri, setLogoUri] = useState<string | null>(null); 

  // --- ESTADOS DE LISTAS ---
  const [paises, setPaises] = useState<any[]>([]);
  const [provincias, setProvincias] = useState<any[]>([]);
  const [escuelas, setEscuelas] = useState<any[]>([]); 
  
  const [paisSeleccionado, setPaisSeleccionado] = useState<any>(null);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<any>(null);
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<any>(null);

  // --- MODALES ---
  const [modalPais, setModalPais] = useState(false);
  const [modalProvincia, setModalProvincia] = useState(false);
  const [modalEscuela, setModalEscuela] = useState(false);

  useEffect(() => {
    const inicializar = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
      
      try {
        // Magia: Si ya hay un usuario logueado, le buscamos y autocompletamos el Alias
        const { data: { session } } = await supabase.auth.getSession();
        let idLogueado = session?.user?.id || await AsyncStorage.getItem('@usuario_id');
        
        if (idLogueado) {
          const { data: practData } = await supabase.from('practicantes').select('alias').eq('id', idLogueado).single();
          if (practData && practData.alias) {
            setAlias(practData.alias);
          }
        }

        // Cargamos Paises y Escuelas
        const [ { data: dataPaises }, { data: dataEscuelas } ] = await Promise.all([
          supabase.from('paises').select('*').order(guardado === 'en' ? 'nombre_en' : 'nombre_es', { ascending: true }),
          supabase.from('escuelas').select('id, nombre').order('nombre', { ascending: true })
        ]);
        
        if (dataPaises) setPaises(dataPaises);
        if (dataEscuelas) setEscuelas(dataEscuelas);

      } catch (error) {
        console.log("Error cargando datos iniciales:", error);
      }
    };
    inicializar();
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
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.');
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
      
      const uploadUrl = `${supabaseUrl}/storage/v1/object/logos_dojangs/${fileName}`;

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
        throw new Error(`Rechazo del servidor: ${uploadRes.status}`);
      }

      return `${supabaseUrl}/storage/v1/object/public/logos_dojangs/${fileName}`;
      
    } catch (error: any) {
      console.error("Fallo la subida:", error);
      throw new Error(`Error subiendo la foto: ${error.message}`);
    }
  };

  const registrarDojang = async () => {
    const tieneProvinciaValida = provincias.length > 0 ? provinciaSeleccionada : provinciaManual.trim();

    // Verificamos que no falte nada básico
    if (!alias || !nombre || !paisSeleccionado || !tieneProvinciaValida) {
      Alert.alert('Error', idiomaActual === 'es' ? 'Alias, Nombre, País y Provincia son obligatorios.' : 'Alias, Name, Country and Province are required.');
      return;
    }

    setCargando(true);
    try {
      // 🔥 EL PATOVICA MEJORADO: Usamos .ilike() para que ignore mayúsculas y minúsculas
      const { data: practicanteData, error: practError } = await supabase
        .from('practicantes')
        .select('id')
        .ilike('alias', alias.trim()) 
        .single();

      if (practError || !practicanteData) {
        Alert.alert('Alias no encontrado', idiomaActual === 'es' ? 'No encontramos un practicante con ese Alias. Primero debés registrarte como practicante.' : 'Alias not found. You must register as a practitioner first.');
        setCargando(false);
        return;
      }

      // Si pasamos el control, el dueño del Dojang es ese ID.
      const id_instructor = practicanteData.id;

      // Subimos logo si hay
      let urlFinalLogo = logoUri;
      if (logoUri && !logoUri.startsWith('http')) {
        urlFinalLogo = await subirLogoASupabase(logoUri);
      }

      const nuevoDojang = {
        nombre: nombre.trim(),
        id_instructor: id_instructor, 
        id_pais: paisSeleccionado.id,
        id_provincia: provinciaSeleccionada ? provinciaSeleccionada.id : null,
        id_escuela: escuelaSeleccionada ? escuelaSeleccionada.id : null, // Opcional
        foto_url: urlFinalLogo
      };

      const { error } = await supabase.from('dojangs').insert([nuevoDojang]);
      if (error) throw error;
      
      Alert.alert('Éxito', idiomaActual === 'es' ? 'Dojang creado correctamente.' : 'Dojang created successfully.');
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
        <Text style={styles.txtDevReset}>← {idiomaActual === 'es' ? 'VOLVER' : 'BACK'}</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          
          <Text style={styles.tituloHeader}>
            <Text style={styles.tituloHeaderRojo}>{idiomaActual === 'es' ? 'Crear ' : 'Create '}</Text>{idiomaActual === 'es' ? 'dojang' : 'dojang'}
          </Text>

          {/* 🔥 EL CAMPO ALIAS AL PRINCIPIO */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Tu Alias de Practicante' : 'Your Practitioner Alias'}</Text>
            <TextInput style={styles.input} selectionColor="#e60000" value={alias} onChangeText={setAlias} autoCapitalize="none" />
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.esquinaRojaCorta} resizeMode="stretch" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Nombre del Dojang' : 'Dojang Name'}</Text>
            <TextInput style={styles.input} selectionColor="#e60000" value={nombre} onChangeText={setNombre} />
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.esquinaRojaCorta} resizeMode="stretch" />
          </View>

          <View style={styles.rowGroup}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>{idiomaActual === 'es' ? 'País de Origen' : 'Country'}</Text>
              <TouchableOpacity style={styles.inputSelect} onPress={() => setModalPais(true)}>
                <Text style={styles.inputText}>{paisSeleccionado ? (idiomaActual === 'es' ? paisSeleccionado.nombre_es : paisSeleccionado.nombre_en) : 'Elegir...'}</Text>
                <Text style={styles.triangulo}>▽</Text>
              </TouchableOpacity>
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.esquinaRojaCorta} resizeMode="stretch" />
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
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.esquinaRojaCorta} resizeMode="stretch" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Escuela (Opcional)' : 'School (Optional)'}</Text>
            <TouchableOpacity style={styles.inputSelect} onPress={() => setModalEscuela(true)}>
              <Text style={styles.inputText} numberOfLines={1}>{escuelaSeleccionada ? escuelaSeleccionada.nombre : 'Ninguna...'}</Text>
              <Text style={styles.triangulo}>▽</Text>
            </TouchableOpacity>
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.esquinaRojaCorta} resizeMode="stretch" />
          </View>

          <View style={styles.footerRow}>
            <View style={styles.boxLogoContainer}>
              <TouchableOpacity onPress={abrirGaleria} style={styles.logotipoWrapper}>
                <View style={styles.boxLogoGris}>
                  {logoUri && <Image source={{ uri: logoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
                </View>
                <Image source={require('../assets/images/angulo_rojo2.png')} style={styles.anguloRojoLogo} resizeMode="stretch" />
              </TouchableOpacity>
              <Text style={styles.txtSubirLogo}>{idiomaActual === 'es' ? 'Subir\nLogotipo' : 'Upload\nLogo'}</Text>
            </View>
            
            <TouchableOpacity onPress={registrarDojang} disabled={cargando} style={styles.btnCrearHitbox}>
              {cargando ? (
                <ActivityIndicator size="large" color="#e60000" />
              ) : (
                <Image 
                  source={idiomaActual === 'es' ? require('../assets/images/boton_crear.png') : require('../assets/images/boton_crear_en.png')} 
                  style={styles.imgBotonCrear} 
                  resizeMode="contain" 
                />
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODALES */}
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

      <Modal visible={modalEscuela} transparent animationType="fade">
        <View style={styles.modalFondoOverlay}>
          <View style={styles.modalBoxContenedor}>
            <Text style={styles.modalTituloSelector}>{idiomaActual === 'es' ? 'ESCUELAS' : 'SCHOOLS'}</Text>
            <TouchableOpacity style={styles.opcionItemSelector} onPress={() => { setEscuelaSeleccionada(null); setModalEscuela(false); }}>
              <Text style={[styles.opcionItemTexto, { color: '#888', fontStyle: 'italic' }]}>{idiomaActual === 'es' ? 'Ninguna (Independiente)' : 'None (Independent)'}</Text>
            </TouchableOpacity>
            <FlatList data={escuelas} keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)} renderItem={({ item }) => (
              <TouchableOpacity style={styles.opcionItemSelector} onPress={() => { setEscuelaSeleccionada(item); setModalEscuela(false); }}>
                <Text style={styles.opcionItemTexto}>{item.nombre}</Text>
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalEscuela(false)}><Text style={styles.txtCerrarModal}>{idiomaActual === 'es' ? 'Cerrar ✕' : 'Close ✕'}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: -20, right: -20, width: 400, height: 600, opacity: 0.8, zIndex: -1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 60, paddingBottom: 40 },
  btnDevReset: { position: 'absolute', top: 45, left: 15, borderWidth: 1, borderColor: '#333', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, zIndex: 10 },
  txtDevReset: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tituloHeader: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5, marginBottom: 40, textAlign: 'center' },
  tituloHeaderRojo: { color: '#e60000' },
  inputGroup: { position: 'relative', marginBottom: 25 },
  rowGroup: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  label: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 8, marginLeft: 2 },
  input: { backgroundColor: '#1c1c1c', color: '#ffffff', height: 40, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 15, fontSize: 14 },
  inputSelect: { backgroundColor: '#1c1c1c', height: 40, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputText: { color: '#fff', fontSize: 14 },
  triangulo: { color: '#fff', fontSize: 12 },
  esquinaRojaCorta: { position: 'absolute', bottom: -18, left: -10, width: 40, height: 40, zIndex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 },
  boxLogoContainer: { flexDirection: 'row', alignItems: 'center' },
  logotipoWrapper: { position: 'relative', width: 75, height: 75, marginRight: 15 },
  boxLogoGris: { width: '100%', height: '100%', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#333', overflow: 'hidden' },
  anguloRojoLogo: { 
  position: 'absolute', 
  bottom: -12, 
  left: -12, 
  width: 60, 
  height: 60, 
  zIndex: 2,
  transform: [{ rotate: '90deg' }] // 🔄 Giro exacto de 180 grados
},
  txtSubirLogo: { color: '#fff', fontSize: 13, fontWeight: 'bold', lineHeight: 18 },
  btnCrearHitbox: { width: 140, height: 80, justifyContent: 'center', alignItems: 'center' },
  imgBotonCrear: { width: '100%', height: '100%' },
  modalFondoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBoxContenedor: { width: '85%', maxHeight: '70%', backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 20 },
  modalTituloSelector: { color: '#e60000', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, textAlign: 'center' },
  opcionItemSelector: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  opcionItemTexto: { color: '#fff', fontSize: 14 },
  btnCerrarModal: { marginTop: 15, alignSelf: 'center', padding: 8 },
  txtCerrarModal: { color: '#666', fontSize: 12, fontWeight: 'bold' },
});