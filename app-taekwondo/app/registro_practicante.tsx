import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// --- EL TRADUCTOR COREANO PERFECCIONADO ---
const traducirACoreanoOficial = (textoEspanol: string): string => {
  if (!textoEspanol) return '';
  let texto = textoEspanol.toUpperCase().trim();

  const diccionario: { [key: string]: string } = {
    'JUAN': '주안', 'JOSE': '호세', 'CARLOS': '카를로스', 'MARTIN': '마르틴',
    'DIEGO': '디에고', 'PABLO': '파블로', 'LUIS': '루이스', 'ALEJANDRO': '알레한드로',
    'MATIAS': '마티아스', 'NICOLAS': '니콜라스', 'FRANCO': '프랑코', 'AGUSTIN': '아구스틴',
    'SANTIAGO': '산티아고', 'LUCAS': '루카스', 'MATEO': '마테오', 'MARIA': '마리아',
    'ANA': '아나', 'VALENTINA': '발렌티나', 'LUCIA': '루시아', 'CAMILA': '카밀라',
    'PEDRO': '페드로', 'FACUNDO': '파쿤도', 'IGNACIO': '이그나시오'
  };

  if (diccionario[texto]) return diccionario[texto];

  const mapaSilabas: { [key: string]: string } = {
    'CH': '치', 'LL': '이', 'RR': '르', 'QU': '케', 'GU': '구',
    'BA': '바', 'BE': '베', 'BI': '비', 'BO': '보', 'BU': '부',
    'CA': '카', 'CE': '세', 'CI': '시', 'CO': '코', 'CU': '쿠',
    'DA': '다', 'DE': '데', 'DI': '디', 'DO': '도', 'DU': '두',
    'FA': '파', 'FE': '페', 'FI': '피', 'FO': '포', 'FU': '푸',
    'GA': '가', 'GE': '헤', 'GI': '히', 'GO': '고', 'GU': '구',
    'HA': '하', 'HE': '헤', 'HI': '히', 'HO': '호', 'HU': '후',
    'LA': '라', 'LE': '레', 'LI': '리', 'LO': '로', 'LU': '루',
    'MA': '마', 'ME': '메', 'MI': '미', 'MO': '모', 'MU': '무',
    'NA': '나', 'NE': '네', 'NI': '니', 'NO': '노', 'NU': '누',
    'PA': '파', 'PE': '페', 'PI': '피', 'PO': '포', 'PU': '푸',
    'RA': '라', 'RE': '레', 'RI': '리', 'RO': '로', 'RU': '루',
    'SA': '사', 'SE': '세', 'SI': '시', 'SO': '소', 'SU': '수',
    'TA': '타', 'TE': '테', 'TI': '티', 'TO': '토', 'TU': '투',
    'A': '아', 'E': '에', 'I': '이', 'O': '오', 'U': '우',
    'N': 'ㄴ', 'S': '스', 'R': 'ㄹ', 'L': 'ㄹ', 'M': 'ㅁ',
    // --- ESCUDO ANTI-CONSONANTES SUELTAS ---
    'D': '드', 'B': '브', 'P': '프', 'T': '트', 'K': '크', 'C': '크',
    'G': '그', 'F': '프', 'V': '브', 'Z': '스', 'J': '흐', 'H': '흐', 'X': '크스'
  };

  let resultado = '';
  let i = 0;
  while (i < texto.length) {
    let chunk2 = texto.substr(i, 2);
    if (mapaSilabas[chunk2]) {
      resultado += mapaSilabas[chunk2];
      i += 2;
    } else {
      let chunk1 = texto.substr(i, 1);
      resultado += mapaSilabas[chunk1] || chunk1;
      i += 1;
    }
  }
  return resultado;
};

const InputCampo = ({ label, value, onChangeText, placeholder = "", secureTextEntry = false, keyboardType = 'default', editable = true }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput 
        style={[styles.inputTxt, !editable && { color: '#e60000', fontWeight: 'bold' }]} 
        selectionColor="#e60000" 
        value={value} 
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#555"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
      />
    </View>
    <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaInput} resizeMode="stretch" />
  </View>
);

const SelectorModal = ({ label, data, valorSeleccionado, onSelect, placeholder = "Seleccionar...", disabled = false }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const itemSeleccionado = data.find((item: any) => item.id === valorSeleccionado);

  const handleAbrir = () => {
    if (disabled) {
      Alert.alert('Atención', `Primero debes seleccionar un País para ver las opciones de ${label}.`);
      return;
    }
    setModalVisible(true);
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={[styles.inputTxt, { justifyContent: 'center', opacity: disabled ? 0.5 : 1 }]} onPress={handleAbrir}>
        <Text style={{ color: itemSeleccionado ? '#ffffff' : '#555' }}>
          {itemSeleccionado ? itemSeleccionado.nombre : placeholder}
        </Text>
        <View style={styles.dropdownIconContainer}>
          <Text style={styles.dropdownIcon}>▼</Text>
        </View>
      </TouchableOpacity>
      <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaInput} resizeMode="stretch" />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Seleccionar {label}</Text>
            
            {label === 'Dojang' && (
              <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(''); setModalVisible(false); }}>
                <Text style={[styles.modalItemTexto, { color: '#888' }]}>Aún no tengo / Ninguno</Text>
              </TouchableOpacity>
            )}

            {data.length === 0 && (
              <Text style={{color: '#888', textAlign: 'center', marginTop: 10}}>No hay opciones disponibles.</Text>
            )}

            <FlatList
              data={data}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item.id); setModalVisible(false); }}>
                  <Text style={styles.modalItemTexto}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalVisible(false)}>
              <Text style={styles.textoCerrarModal}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function PracticanteRegistroScreen() {
  const [form, setForm] = useState({ 
    nombre: '', apellido: '', fecha: '', id_usuario: '', dir: '', tel: '', peso: '', alias: '', pass: '',
    id_genero: '', id_pais: '', id_provincia: '', id_dojang: '', id_graduacion: '', nombre_coreano: ''
  });

  const [listas, setListas] = useState({
    generos: [], paises: [], provincias: [], dojangs: [], graduaciones: []
  });
  
  const [cargandoDB, setCargandoDB] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  // AHORA ESTO ES SIEMPRE FALSE: El formulario SIEMPRE crea usuarios nuevos.
  const [esEdicion, setEsEdicion] = useState(false); 
  const [idActual, setIdActual] = useState(null);
  
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  useEffect(() => {
    const inicializarPantalla = async () => {
      try {
        const [resGen, resPais, resDoj, resGrad] = await Promise.all([
          supabase.from('generos').select('id, nombre'),
          supabase.from('paises').select('id, nombre_es'),
          supabase.from('dojangs').select('id, nombre_dojang'),
          supabase.from('graduaciones').select('id, nombre')
        ]);

        setListas(prev => ({
          ...prev,
          generos: resGen.data || [],
          paises: (resPais.data || []).map((p: any) => ({ id: p.id, nombre: p.nombre_es })),
          dojangs: (resDoj.data || []).map((d: any) => ({ id: d.id, nombre: d.nombre_dojang })),
          graduaciones: resGrad.data || []
        }));

        // NOTA DE DIRECTOR: Se eliminó el AsyncStorage.getItem acá. 
        // Ya no cargamos los datos del padre/instructor que tenga el celular prestado.
        // Así aseguramos que SIEMPRE se cree un registro nuevo y limpio.

      } catch (error) {
        console.error("Error inicializando pantalla:", error);
      } finally {
        setCargandoDB(false);
      }
    };
    
    inicializarPantalla();
  }, []);

  useEffect(() => {
    const cargarProvincias = async () => {
      if (!form.id_pais) {
        setListas(prev => ({ ...prev, provincias: [] }));
        return;
      }
      const { data } = await supabase.from('provincias').select('id, nombre').eq('id_pais', form.id_pais);
      setListas(prev => ({ ...prev, provincias: data || [] }));
    };
    cargarProvincias();
  }, [form.id_pais]);

  const handleNombreChange = (texto: string) => {
    const traduccion = traducirACoreanoOficial(texto);
    setForm(prev => ({
      ...prev,
      nombre: texto,
      nombre_coreano: traduccion
    }));
  };

  const seleccionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a la galería para cambiar tu foto.');
      return;
    }

    let resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4], 
      quality: 0.7,
    });

    if (!resultado.canceled) {
      setFotoUri(resultado.assets[0].uri);
    }
  };

  // --- EL MOTOR QUE FUNCIONÓ DE 10 PARA SUBIR LA FOTO ---
  const subirFotoASupabase = async (uri: string) => {
    try {
      if (uri.startsWith('http')) return uri;

      let fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
      if (fileExt === 'jpg') fileExt = 'jpeg'; 
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const supabaseUrl = 'https://xjvusrgxwhchxhriwedt.supabase.co'; 
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdnVzcmd4d2hjaHhocml3ZWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTg5MTQsImV4cCI6MjA5NTM5NDkxNH0.71av-GKLhzZxOFjjqdu_eoKQg2aqrJ65UjtC6liBbbE';

      const uploadUrl = `${supabaseUrl}/storage/v1/object/fotos_perfil/${fileName}`;

      const fileRes = await fetch(uri);
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

      return `${supabaseUrl}/storage/v1/object/public/fotos_perfil/${fileName}`;
      
    } catch (error: any) {
      console.error("Fallo la subida universal:", error);
      throw new Error(`Error en la red: ${error.message}`);
    }
  };

  const handleGuardarUsuario = async () => {
    if (!form.nombre || !form.apellido || !form.alias || !form.pass) {
      Alert.alert("Campos incompletos", "Por favor completa Nombre, Apellido, Alias y Password.");
      return;
    }

    setEnviando(true);
    
    try {
      let urlFinalFoto = null;

      if (fotoUri && fotoUri.startsWith('file://')) {
        urlFinalFoto = await subirFotoASupabase(fotoUri);
      } else if (fotoUri && fotoUri.startsWith('http')) {
        urlFinalFoto = fotoUri;
      }

      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        fecha_nacimiento: form.fecha,
        genero: form.id_genero,
        identificacion: form.id_usuario,
        pais_origen: form.id_pais,
        estado_provincia: form.id_provincia,
        direccion: form.dir,
        telefono: form.tel,
        id_dojang: form.id_dojang || null,
        graduacion: form.id_graduacion,
        peso_kg: parseFloat(form.peso) || 0,
        alias: form.alias,
        password: form.pass,
        nombre_coreano: form.nombre_coreano,
        foto_perfil_url: urlFinalFoto 
      };

      // Como quitamos el esEdicion automático, esto SIEMPRE va a insertar un nuevo registro.
      const { error } = await supabase
        .from('practicantes')
        .insert(payload);

      if (error) throw error;
      Alert.alert("Éxito", "Usuario registrado correctamente.");
      router.back();
      
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />

      {cargandoDB ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#e60000" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Cargando datos...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces={false}>
            
            <View style={styles.headerContenedor}>
              <Text style={styles.tituloHeader}>
                <Text style={styles.textoRojo}>Crear</Text> usuario
              </Text>
            </View>

            <View style={styles.filaDoble}>
              <View style={styles.columnaMitad}>
                <InputCampo label="Nombre" value={form.nombre} onChangeText={handleNombreChange} />
              </View>
              <View style={styles.columnaMitad}>
                <InputCampo label="Apellido" value={form.apellido} onChangeText={(t: string) => setForm({...form, apellido: t})} />
              </View>
            </View>

            <View style={styles.filaUnica}>
              <InputCampo label="Nombre en Coreano (Automático)" value={form.nombre_coreano} onChangeText={(t: string) => setForm({...form, nombre_coreano: t})} editable={true} />
            </View>

            <View style={styles.filaDoble}>
              <View style={styles.columnaMitad}>
                <InputCampo label="Fecha Nac." value={form.fecha} onChangeText={(t: string) => setForm({...form, fecha: t})} />
              </View>
              <View style={styles.columnaMitad}>
                <SelectorModal label="Genero" data={listas.generos} valorSeleccionado={form.id_genero} onSelect={(id: any) => setForm({...form, id_genero: id})} />
              </View>
            </View>

            <View style={styles.filaUnica}>
              <InputCampo label="N° de identificación" value={form.id_usuario} onChangeText={(t: string) => setForm({...form, id_usuario: t})} />
            </View>

            <View style={styles.filaDoble}>
              <View style={styles.columnaMitad}>
                <SelectorModal label="Pais" data={listas.paises} valorSeleccionado={form.id_pais} onSelect={(id: any) => setForm({...form, id_pais: id, id_provincia: ''})} />
              </View>
              <View style={styles.columnaMitad}>
                <SelectorModal label="Estado/Prov." data={listas.provincias} valorSeleccionado={form.id_provincia} onSelect={(id: any) => setForm({...form, id_provincia: id})} disabled={!form.id_pais} />
              </View>
            </View>

            <View style={styles.filaUnica}>
              <InputCampo label="Dirección" value={form.dir} onChangeText={(t: string) => setForm({...form, dir: t})} />
            </View>

            <View style={styles.filaUnica}>
              <InputCampo label="Teléfono" value={form.tel} onChangeText={(t: string) => setForm({...form, tel: t})} keyboardType="phone-pad" />
            </View>

            <View style={styles.filaDoble}>
              <View style={styles.columnaMitad}>
                <SelectorModal label="Dojang" data={listas.dojangs} valorSeleccionado={form.id_dojang} onSelect={(id: any) => setForm({...form, id_dojang: id})} />
              </View>
              <View style={styles.columnaMitad}>
                <SelectorModal label="Graduación" data={listas.graduaciones} valorSeleccionado={form.id_graduacion} onSelect={(id: any) => setForm({...form, id_graduacion: id})} />
              </View>
            </View>

            <View style={styles.bloqueInferior}>
              <View style={styles.columnaIzquierda}>
                <View style={styles.filaUnica}><InputCampo label="Peso (Kg)" value={form.peso} onChangeText={(t: string) => setForm({...form, peso: t})} keyboardType="numeric" /></View>
                <View style={styles.filaUnica}><InputCampo label="Alias" value={form.alias} onChangeText={(t: string) => setForm({...form, alias: t})} /></View>
                <View style={styles.filaUnica}><InputCampo label="Password" value={form.pass} onChangeText={(t: string) => setForm({...form, pass: t})} secureTextEntry={true} /></View>
              </View>

              <View style={styles.columnaDerecha}>
                <TouchableOpacity style={styles.contenedorFoto} onPress={seleccionarFoto}>
                  <Image source={require('../assets/images/angulo_rojo1.png')} style={styles.anguloTopLeft} resizeMode="contain" />
                  
                  {fotoUri ? (
                    <Image source={{ uri: fotoUri }} style={styles.imagenSeleccionada} />
                  ) : (
                    <Text style={styles.textoFoto}>Foto{'\n'}del{'\n'}practicante</Text>
                  )}
                  
                  <Image source={require('../assets/images/angulo_rojo2.png')} style={styles.anguloBottomRight} resizeMode="contain" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.contenedorBoton}>
              {enviando ? (
                <ActivityIndicator size="large" color="#e60000" style={{marginLeft: 20}} />
              ) : (
                <TouchableOpacity onPress={handleGuardarUsuario} style={styles.btnCrear}>
                  <Image source={require('../assets/images/boton_crear.png')} style={styles.imgBoton} resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, opacity: 0.3, zIndex: -1 },
  btnVolverTop: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(230,0,0,0.2)', borderRadius: 5, borderWidth: 1, borderColor: '#e60000' },
  textoVolverTop: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  scroll: { paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 40 : 80, paddingBottom: 60 },
  headerContenedor: { alignItems: 'center', marginBottom: 30 },
  tituloHeader: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  textoRojo: { color: '#e60000' },
  filaUnica: { width: '100%', marginBottom: 18 },
  filaDoble: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
  columnaMitad: { width: '45%' },
  bloqueInferior: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 5 },
  columnaIzquierda: { width: '40%' },
  columnaDerecha: { width: '30%', alignItems: 'center', paddingTop: 20 },
  inputContainer: { width: '100%', position: 'relative' },
  label: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  inputWrapper: { position: 'relative', width: '100%' },
  inputTxt: { backgroundColor: '#222222', color: '#ffffff', height: 35, borderRadius: 4, paddingHorizontal: 10, fontSize: 12 },
  dropdownIconContainer: { position: 'absolute', right: 15, height: '100%', justifyContent: 'center' },
  dropdownIcon: { color: '#ffffff', fontSize: 12 },
  pinceladaInput: { position: 'absolute', bottom: -12, left: -25, width: '90%', height: 12 },
  contenedorFoto: { 
    width: '100%', aspectRatio: 0.8, backgroundColor: '#0a0a0a', borderWidth: 1.5, borderColor: '#333333', 
    justifyContent: 'center', alignItems: 'center', position: 'relative', marginTop: 35, overflow: 'hidden',
    transform: [{ scale: 1.8 }, { translateX: -20 }]
  }, 
  textoFoto: { color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: 12, lineHeight: 22 },
  imagenSeleccionada: { width: '100%', height: '100%', resizeMode: 'cover' },
  anguloTopLeft: { position: 'absolute', top: -5, left: -5, width: 45, height: 45, zIndex: 10 },
  anguloBottomRight: { position: 'absolute', bottom: -5, right: -5, width: 45, height: 45, zIndex: 10 },
  contenedorBoton: { width: '100%', alignItems: 'flex-start', marginTop: 10 },
  btnCrear: { width: 140, height: 80, marginLeft: 100 },
  imgBoton: { width: '100%', height: '100%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxHeight: '60%', backgroundColor: '#151515', borderRadius: 8, borderWidth: 1, borderColor: '#e60000', padding: 20 },
  modalTitulo: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalItemTexto: { color: '#fff', fontSize: 12, textAlign: 'center' },
  btnCerrarModal: { marginTop: 20, backgroundColor: '#e60000', padding: 12, borderRadius: 5, alignItems: 'center' },
  textoCerrarModal: { color: '#fff', fontWeight: 'bold' }
});