import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown'; // <-- Traemos el nuevo repuesto visual
import { supabase } from '../lib/supabase';
import { diccionario } from '../constants/textos'; // <-- El diccionario de hoy
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Para recordar la elección

export default function EventosScreen() {
  // --- LÓGICA DE DETECCIÓN DE IDIOMA ---
  const [idiomaActual, setIdiomaActual] = useState('es');

  useEffect(() => {
    const cargarIdioma = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
    };
    cargarIdioma();
  }, []);

  // --- ESTADOS DEL FORMULARIO ---
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(''); 
  const [lugar, setLugar] = useState('');
  const [valor, setValor] = useState('');
  const [pin, setPin] = useState('');
  const [cargando, setCargando] = useState(false);

  // --- ESTADOS PARA LOS DROPDOWNS REALES ---
  const [listaTipos, setListaTipos] = useState([]);
  const [listaPaises, setListaPaises] = useState([]);
  const [listaProvincias, setListaProvincias] = useState([]);

  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState(null);

  // --- AL ABRIR LA PANTALLA: CARGAMOS DATOS BASE ---
  useEffect(() => {
    obtenerDatosIniciales();
  }, []);

  // --- ESCUCHA CAMBIOS DE PAÍS PARA TRAER SUS PROVINCIAS ---
  useEffect(() => {
    if (paisSeleccionado) {
      obtenerProvincias(paisSeleccionado);
    } else {
      setListaProvincias([]);
      setProvinciaSeleccionada(null);
    }
  }, [paisSeleccionado]);

  const obtenerDatosIniciales = async () => {
    try {
      // 1. Traer tipos de eventos
      const { data: tipos } = await supabase.from('tipos_evento').select('*');
      if (tipos) setListaTipos(tipos);

      // 2. Traer países
      const { data: paises } = await supabase.from('paises').select('*');
      if (paises) setListaPaises(paises);

    } catch (error) {
      console.log("Error cargando selectores iniciales:", error);
    }
  };

  const obtenerProvincias = async (idPais) => {
    try {
      const { data: provs } = await supabase
        .from('provincias')
        .select('*')
        .eq('id_pais', idPais);
      
      if (provs) setListaProvincias(provs);
    } catch (error) {
      console.log("Error cargando provincias:", error);
    }
  };

  // --- FUNCIÓN GUARDAR EVENTO ---
  const guardarEvento = async () => {
    if (!nombre || !fecha || !lugar || !valor || !pin || !tipoSeleccionado || !paisSeleccionado || !provinciaSeleccionada) {
      Alert.alert(
        idiomaActual === 'es' ? 'Faltan datos' : 'Missing data', 
        idiomaActual === 'es' ? 'Por favor completá todos los campos del formulario.' : 'Please fill all form fields.'
      );
      return;
    }

    setCargando(true);
    const idSimulado = Math.floor(Math.random() * 999999) + 1;

    const { error } = await supabase
      .from('eventos')
      .insert([
        { 
          id: idSimulado, 
          nombre: nombre, 
          fecha: fecha, 
          lugar: lugar, 
          valor: parseFloat(valor), 
          pin_acceso: pin,
          id_tipo: tipoSeleccionado,       
          id_pais: paisSeleccionado,       
          id_provincia: provinciaSeleccionada 
        }
      ]);

    setCargando(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        idiomaActual === 'es' ? '¡Éxito total!' : 'Success!', 
        idiomaActual === 'es' ? 'El evento ya está guardado con sus llaves de localización.' : 'The event has been successfully saved.'
      );
      setNombre('');
      setFecha('');
      setLugar('');
      setValor('');
      setPin('');
      setTipoSeleccionado(null);
      setPaisSeleccionado(null);
      setProvinciaSeleccionada(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* FONDOS ABSOLUTOS */}
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          
          {/* HEADER SECTION INTERNACIONALIZADO */}
          <View style={styles.headerSection}>
            <Text style={styles.tituloPrincipal}>
              <Text style={styles.textoRojo}>
                {idiomaActual === 'es' ? 'Cronograma de' : 'Schedule of'}
              </Text> {idiomaActual === 'es' ? 'Eventos' : 'Events'}
            </Text>
            <TouchableOpacity style={styles.contenedorBotonIr} onPress={() => router.push('/lista_eventos')}>
              <Image source={require('../assets/images/boton_ir.png')} style={styles.imagenBotonIr} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* SUBTÍTULO INTERNACIONALIZADO */}
          <Text style={styles.subtituloSection}>
            {diccionario[idiomaActual].crearEvento}
          </Text>

          {/* FORMULARIO */}
          <View style={styles.formContainer}>
            
            {/* Campo: Tipo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{diccionario[idiomaActual].tipo}</Text>
              <Dropdown
                style={styles.dropdownComponente}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownTextoSeleccionado}
                containerStyle={styles.dropdownMenuFlotante}
                itemTextStyle={styles.dropdownItemsTexto}
                activeColor="#333"
                data={listaTipos}
                labelField={idiomaActual === 'es' ? 'nombre_es' : 'nombre_en'} 
                valueField="id"
                placeholder="..."
                value={tipoSeleccionado}
                onChange={item => setTipoSeleccionado(item.id)}
              />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            {/* Campo: Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{diccionario[idiomaActual].nombre}</Text>
              <TextInput style={styles.input} selectionColor="#e60000" value={nombre} onChangeText={setNombre} />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            {/* Campo: País */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{diccionario[idiomaActual].pais}</Text>
              <Dropdown
                style={styles.dropdownComponente}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownTextoSeleccionado}
                containerStyle={styles.dropdownMenuFlotante}
                itemTextStyle={styles.dropdownItemsTexto}
                activeColor="#333"
                data={listaPaises}
                labelField={idiomaActual === 'es' ? 'nombre_es' : 'nombre_en'}
                valueField="id"
                placeholder="..."
                value={paisSeleccionado}
                onChange={item => setPaisSeleccionado(item.id)}
              />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            {/* Fila Dividida: Provincia y Fecha */}
            <View style={styles.filaDividida}>
              <View style={[styles.inputGroup, { flex: 1.2, marginRight: 15 }]}>
                <Text style={styles.label}>{diccionario[idiomaActual].provincia}</Text>
                <Dropdown
                  style={[styles.dropdownComponente, !paisSeleccionado && { opacity: 0.4 }]}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownTextoSeleccionado}
                  containerStyle={styles.dropdownMenuFlotante}
                  itemTextStyle={styles.dropdownItemsTexto}
                  activeColor="#333"
                  data={listaProvincias}
                  labelField="nombre"
                  valueField="id"
                  placeholder="..."
                  value={provinciaSeleccionada}
                  disable={!paisSeleccionado} 
                  onChange={item => setProvinciaSeleccionada(item.id)}
                />
                <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{diccionario[idiomaActual].fecha}</Text>
                <TextInput style={styles.input} selectionColor="#e60000" placeholder="AAAA-MM-DD" placeholderTextColor="#555" value={fecha} onChangeText={setFecha} />
                <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaFecha} resizeMode="stretch" />
              </View>
            </View>

            {/* Campo: Lugar */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{diccionario[idiomaActual].lugar}</Text>
              <TextInput style={styles.input} selectionColor="#e60000" value={lugar} onChangeText={setLugar} />
              <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
            </View>

            {/* Bloque Inferior: Valores + Botón Crear */}
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

              {/* Botón CREAR (DINÁMICO CON TU NUEVA IMAGEN) */}
              <TouchableOpacity style={[styles.contenedorBotonCrear, cargando && { opacity: 0.5 }]} onPress={guardarEvento} disabled={cargando}>
                {cargando ? (
                  <ActivityIndicator size="large" color="#e60000" style={{ marginRight: 40, marginBottom: 20 }} />
                ) : (
                  <Image 
                    source={idiomaActual === 'es' ? require('../assets/images/boton_crear.png') : require('../assets/images/boton_crear_en.png')} 
                    style={styles.imagenBotonCrear} 
                    resizeMode="contain" 
                  />
                )}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MENÚ INFERIOR (DINÁMICO CON TUS NUEVAS IMÁGENES) */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/asociacion_principal')}>
          <Image 
            source={idiomaActual === 'es' ? require('../assets/images/boton_home.png') : require('../assets/images/boton_home_en.png')} 
            style={styles.imagenHome} 
            resizeMode="contain" 
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.push('/escuelas')}>
          <Image 
            source={idiomaActual === 'es' ? require('../assets/images/boton_escuelas.png') : require('../assets/images/boton_escuelas_en.png')} 
            style={styles.imagenEscuelas} 
            resizeMode="contain" 
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton}>
          <Image 
            source={idiomaActual === 'es' ? require('../assets/images/boton_eventos.png') : require('../assets/images/boton_eventos_en.png')} 
            style={styles.imagenEventos} 
            resizeMode="contain" 
          />
        </TouchableOpacity>
      </View>

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
  contenedorBotonIr: { width: 70, height: 70 },
  imagenBotonIr: { width: '100%', height: '100%' },
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
  contenedorBotonCrear: { width: '60%', alignItems: 'flex-end', paddingBottom: 5 },
  imagenBotonCrear: { width: '100%', height: 80 },
  navBar: { position: 'absolute', bottom: 35, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 10, zIndex: 10 },
  navBoton: { width: '25%', alignItems: 'center' },
  imagenHome: { width: '100%', height: 25 },
  imagenEscuelas: { width: '100%', height: 25 },
  imagenEventos: { width: '100%', height: 25 }
});