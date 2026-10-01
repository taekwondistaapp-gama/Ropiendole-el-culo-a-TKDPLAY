import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { diccionario } from '../constants/textos';
import { supabase } from '../lib/supabase';

export default function DetalleEventoScreen() {
  const { id } = useLocalSearchParams(); 
  const [idiomaActual, setIdiomaActual] = useState('es');

  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(''); 
  const [lugar, setLugar] = useState('');
  const [valor, setValor] = useState('');
  const [pin, setPin] = useState('');
  
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [listaTipos, setListaTipos] = useState([]);
  const [listaPaises, setListaPaises] = useState([]);
  const [listaProvincias, setListaProvincias] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState(null);

  useEffect(() => {
    const inicializar = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
      
      await obtenerListasDesplegables();
      if (id) {
        await cargarDatosDelEvento(id as string);
      }
      setCargandoInicial(false);
    };
    inicializar();
  }, [id]);

  useEffect(() => {
    if (paisSeleccionado) obtenerProvincias(paisSeleccionado);
  }, [paisSeleccionado]);

  const obtenerListasDesplegables = async () => {
    const { data: tipos } = await supabase.from('tipos_evento').select('*');
    if (tipos) setListaTipos(tipos as any);
    const { data: paises } = await supabase.from('paises').select('*');
    if (paises) setListaPaises(paises as any);
  };

  const obtenerProvincias = async (idPais: any) => {
    const { data: provs } = await supabase.from('provincias').select('*').eq('id_pais', idPais);
    if (provs) setListaProvincias(provs as any);
  };

  const cargarDatosDelEvento = async (eventoId: string) => {
    try {
      // 🔥 BLINDAJE: limit(1).maybeSingle()
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.log("Error de base de datos:", error.message);
        return;
      }

      if (data) {
        setNombre(data.nombre || '');
        setFecha(data.fecha || '');
        setLugar(data.lugar || '');
        setValor(data.valor ? data.valor.toString() : '');
        setPin(data.pin_acceso || '');
        setTipoSeleccionado(data.id_tipo || null);
        setPaisSeleccionado(data.id_pais || null);
        setProvinciaSeleccionada(data.id_provincia || null);
      }
    } catch (error) {
      console.log("Error trayendo datos del evento:", error);
    }
  };

  const actualizarEvento = async () => {
    if (!nombre || !fecha || !lugar || !valor || !pin || !tipoSeleccionado || !paisSeleccionado || !provinciaSeleccionada) {
      Alert.alert(idiomaActual === 'es' ? 'Faltan datos' : 'Missing data', 'Completá todos los campos.');
      return;
    }

    setGuardando(true);
    const { error } = await supabase
      .from('eventos')
      .update({ 
        nombre, 
        fecha, 
        lugar, 
        valor: parseFloat(valor), 
        pin_acceso: pin, 
        id_tipo: tipoSeleccionado, 
        id_pais: paisSeleccionado, 
        id_provincia: provinciaSeleccionada 
      })
      .eq('id', id);

    setGuardando(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Ok', idiomaActual === 'es' ? 'Evento actualizado con éxito.' : 'Event updated successfully.');
      router.back(); 
    }
  };

  if (cargandoInicial) {
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
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          
          <View style={styles.headerSection}>
            <Text style={styles.tituloPrincipal}>
              <Text style={styles.textoRojo}>{idiomaActual === 'es' ? 'Cronograma de' : 'Schedule of'}</Text> {idiomaActual === 'es' ? 'Eventos' : 'Events'}
            </Text>
            <TouchableOpacity style={styles.contenedorBotonIr} onPress={() => router.back()}>
              <Text style={{color: '#555', fontSize: 12, fontWeight: 'bold'}}>VOLVER</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtituloSection}>
            {idiomaActual === 'es' ? 'Editar Evento' : 'Edit Event'}
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{diccionario[idiomaActual].tipo}</Text>
              <Dropdown style={styles.dropdownComponente} placeholderStyle={styles.dropdownPlaceholder} selectedTextStyle={styles.dropdownTextoSeleccionado} containerStyle={styles.dropdownMenuFlotante} itemTextStyle={styles.dropdownItemsTexto} activeColor="#333" data={listaTipos} labelField={idiomaActual === 'es' ? 'nombre_es' : 'nombre_en'} valueField="id" placeholder="..." value={tipoSeleccionado} onChange={item => setTipoSeleccionado(item.id)} />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{diccionario[idiomaActual].nombre}</Text>
              <TextInput style={styles.input} selectionColor="#e60000" value={nombre} onChangeText={setNombre} />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{diccionario[idiomaActual].pais}</Text>
              <Dropdown style={styles.dropdownComponente} placeholderStyle={styles.dropdownPlaceholder} selectedTextStyle={styles.dropdownTextoSeleccionado} containerStyle={styles.dropdownMenuFlotante} itemTextStyle={styles.dropdownItemsTexto} activeColor="#333" data={listaPaises} labelField={idiomaActual === 'es' ? 'nombre_es' : 'nombre_en'} valueField="id" placeholder="..." value={paisSeleccionado} onChange={item => setPaisSeleccionado(item.id)} />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            <View style={styles.filaDividida}>
              <View style={[styles.inputGroup, { flex: 1.2, marginRight: 15 }]}>
                <Text style={styles.label}>{diccionario[idiomaActual].provincia}</Text>
                <Dropdown style={[styles.dropdownComponente, !paisSeleccionado && { opacity: 0.4 }]} placeholderStyle={styles.dropdownPlaceholder} selectedTextStyle={styles.dropdownTextoSeleccionado} containerStyle={styles.dropdownMenuFlotante} itemTextStyle={styles.dropdownItemsTexto} activeColor="#333" data={listaProvincias} labelField="nombre" valueField="id" placeholder="..." value={provinciaSeleccionada} disable={!paisSeleccionado} onChange={item => setProvinciaSeleccionada(item.id)} />
                <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{diccionario[idiomaActual].fecha}</Text>
                <TextInput style={styles.input} selectionColor="#e60000" placeholder="AAAA-MM-DD" placeholderTextColor="#555" value={fecha} onChangeText={setFecha} />
                <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaFecha} resizeMode="stretch" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{diccionario[idiomaActual].lugar}</Text>
              <TextInput style={styles.input} selectionColor="#e60000" value={lugar} onChangeText={setLugar} />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            <View style={styles.seccionAccionesForm}>
              <View style={styles.bloqueCamposCortos}>
                <View style={[styles.inputGroup, { width: '100%' }]}>
                  <Text style={styles.label}>{diccionario[idiomaActual].valor}</Text>
                  <TextInput style={styles.input} keyboardType="numeric" selectionColor="#e60000" value={valor} onChangeText={setValor} />
                  <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaCortaForm} resizeMode="stretch" />
                </View>

                <View style={[styles.inputGroup, { width: '100%', marginTop: 10 }]}>
                  <Text style={styles.label}>{diccionario[idiomaActual].pin}</Text>
                  <TextInput style={styles.input} secureTextEntry={false} keyboardType="default" selectionColor="#e60000" value={pin} onChangeText={setPin} />
                  <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaCortaForm} resizeMode="stretch" />
                </View>
              </View>

              <TouchableOpacity style={[styles.contenedorBotonCrear, guardando && { opacity: 0.5 }]} onPress={actualizarEvento} disabled={guardando}>
                {guardando ? (
                  <ActivityIndicator size="large" color="#e60000" style={{ marginRight: 20 }} />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 25, textAlign: 'right' }}>
                    {idiomaActual === 'es' ? 'ACTUALIZAR ' : 'UPDATE '}
                    <Text style={{ color: '#e60000' }}>DATOS</Text>
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  dropdownComponente: { backgroundColor: '#1c1c1c', height: 35, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 10 },
  dropdownPlaceholder: { color: '#555', fontSize: 12 },
  dropdownTextoSeleccionado: { color: '#ffffff', fontSize: 12 },
  dropdownMenuFlotante: { backgroundColor: '#1c1c1c', borderWidth: 0, borderRadius: 6 },
  dropdownItemsTexto: { color: '#ffffff', fontSize: 12 },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, opacity: 1, zIndex: -1 },
  fondoAbajoCentro: { position: 'absolute', bottom: 10, alignSelf: 'center', width: '90%', height: 30, zIndex: 0 },
  scrollContainer: { flexGrow: 1, paddingTop: 40, paddingHorizontal: 25, paddingBottom: 110 },
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 25, paddingHorizontal: 5 },
  tituloPrincipal: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  contenedorBotonIr: { padding: 10 },
  subtituloSection: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 25 },
  textoRojo: { color: '#e60000' },
  formContainer: { width: '90%', marginLeft: 15 },
  inputGroup: { marginBottom: 12 },
  label: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 6, marginLeft: 5 },
  input: { backgroundColor: '#1c1c1c', color: '#ffffff', height: 35, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingHorizontal: 10, fontSize: 12 },
  filaDividida: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  pinceladaInput: { width: '100%', height: 25, marginTop: -5, marginLeft: -40, alignSelf: 'flex-start' },
  pinceladaFecha: { width: '100%', height: 25, marginTop: -2, marginLeft: -25, alignSelf: 'flex-start' },
  pinceladaCortaForm: { width: '100%', height: 20, marginTop: -5, marginLeft: -35, alignSelf: 'flex-start' },
  seccionAccionesForm: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: 0 },
  bloqueCamposCortos: { width: '50%' },
  contenedorBotonCrear: { width: '50%', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 5 }
});