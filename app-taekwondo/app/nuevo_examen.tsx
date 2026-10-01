import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function NuevoExamenScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [guardando, setGuardando] = useState(false);

  const [nombreExamen, setNombreExamen] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugar, setLugar] = useState('');
  const [valor, setValor] = useState('');
  const [pinExamen, setPinExamen] = useState('');

  useEffect(() => {
    const obtenerIdioma = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
    };
    obtenerIdioma();
  }, []);

  const handleCrearExamen = async () => {
    if (!nombreExamen || !fecha || !lugar || !pinExamen) {
      Alert.alert("Atención", idiomaActual === 'es' ? "Por favor completa Nombre, Fecha, Lugar y PIN." : "Please complete Name, Date, Location and PIN.");
      return;
    }

    setGuardando(true);
    try {
      const idDojang = await AsyncStorage.getItem('@dojang_id_logueado');
      if (!idDojang) {
        throw new Error("No se encontró la sesión del Dojang.");
      }

      const { error } = await supabase
        .from('examenes')
        .insert({
          nombre: nombreExamen,
          fecha: fecha,
          lugar: lugar,
          valor: parseFloat(valor) || 0,
          pin_acceso: pinExamen,
          id_dojang: idDojang
        });

      if (error) throw error;

      Alert.alert("Éxito", idiomaActual === 'es' ? "Examen creado correctamente." : "Exam created successfully.");
      
      // Limpiar campos y navegar al calendario
      setNombreExamen('');
      setFecha('');
      setLugar('');
      setValor('');
      setPinExamen('');

      router.push('/calendario_examenes');

    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      {/* HEADER SUPERIOR */}
      <View style={styles.headerTop}>
        <Text style={styles.tituloHeader}>
          <Text style={styles.textoRojo}>{idiomaActual === 'es' ? 'Nuestros' : 'Our'}</Text> {idiomaActual === 'es' ? 'Exámenes' : 'Exams'}
        </Text>
        <TouchableOpacity style={styles.btnIrCalendarioTop} onPress={() => router.push('/calendario_examenes')}>
          <Text style={styles.textoIrTop}>IR</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
          
          <Text style={styles.subtituloCrear}>
            <Text style={styles.textoRojo}>{idiomaActual === 'es' ? 'Crear' : 'Create'}</Text> {idiomaActual === 'es' ? 'Examen' : 'Exam'}
          </Text>

          {/* Campo 1: Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Nombra tu examen' : 'Name your exam'}</Text>
            <TextInput 
              style={styles.inputTxt} 
              value={nombreExamen} 
              onChangeText={setNombreExamen} 
              selectionColor="#e60000" 
            />
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
          </View>

          {/* Campo 2: Fecha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Fecha' : 'Date'}</Text>
            <TextInput 
              style={styles.inputTxt} 
              value={fecha} 
              onChangeText={setFecha} 
              placeholder="DD/MM/YYYY" 
              placeholderTextColor="#555"
              selectionColor="#e60000" 
            />
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
          </View>

          {/* Campo 3: Lugar */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Lugar' : 'Location'}</Text>
            <TextInput 
              style={styles.inputTxt} 
              value={lugar} 
              onChangeText={setLugar} 
              selectionColor="#e60000" 
            />
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
          </View>

          {/* Campo 4: Valor $ */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{idiomaActual === 'es' ? 'Valor $' : 'Value $'}</Text>
            <TextInput 
              style={styles.inputTxt} 
              value={valor} 
              onChangeText={setValor} 
              keyboardType="numeric"
              selectionColor="#e60000" 
            />
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
          </View>

          {/* Campo 5: Examen PIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Examen PIN</Text>
            <TextInput 
              style={styles.inputTxt} 
              value={pinExamen} 
              onChangeText={setPinExamen} 
              secureTextEntry={true}
              selectionColor="#e60000" 
            />
            <Image source={require('../assets/images/esquina_roja_corta.png')} style={styles.pinceladaInput} resizeMode="stretch" />
          </View>

          {/* BOTÓN CREAR Y ENLACE AL CALENDARIO */}
          <View style={styles.bloqueAccionesFinales}>
            {guardando ? (
              <ActivityIndicator size="large" color="#e60000" style={{ marginVertical: 20 }} />
            ) : (
              <TouchableOpacity style={styles.btnCrear} onPress={handleCrearExamen}>
                <Image 
                  source={idiomaActual === 'es' ? require('../assets/images/boton_crear.png') : require('../assets/images/boton_crear_en.png')} 
                  style={styles.imagenBotonCrear} 
                  resizeMode="contain" 
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.btnVerCalendarioTexto} onPress={() => router.push('/calendario_examenes')}>
              <Text style={styles.textoVerCalendario}>
                <Text style={styles.textoRojo}>{idiomaActual === 'es' ? 'Ver calendario' : 'View calendar'}</Text> {idiomaActual === 'es' ? 'de exámenes' : 'of exams'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* BARRA DE NAVEGACIÓN INFERIOR CON BOTÓN HOME */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/dojang_principal')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_home.png') : require('../assets/images/boton_home_en.png')} style={styles.imagenNav} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/mis_alumnos')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_alumnos.png') : require('../assets/images/boton_alumnos_en.png')} style={styles.imagenNav} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBoton} onPress={() => router.replace('/calendario_examenes')}>
          <Image source={idiomaActual === 'es' ? require('../assets/images/boton_examenesinferior.png') : require('../assets/images/boton_examenesinf_en.png')} style={styles.imagenNav} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, opacity: 0.5, zIndex: -1 },
  fondoAbajoCentro: { position: 'absolute', bottom: 10, alignSelf: 'center', width: '90%', height: 20, zIndex: -1 },
  
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  tituloHeader: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  textoRojo: { color: '#e60000' },
  btnIrCalendarioTop: { backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: '#e60000', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  textoIrTop: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },

  scrollContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  subtituloCrear: { color: '#ffffff', fontSize: 16, fontWeight: '900', marginBottom: 20, textAlign: 'center' },

  inputGroup: { marginBottom: 18, position: 'relative', width: '100%' },
  label: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 6, marginLeft: 4 },
  inputTxt: { backgroundColor: '#1c1c1c', color: '#ffffff', height: 38, borderRadius: 4, paddingHorizontal: 12, fontSize: 12, borderWidth: 1, borderColor: '#333' },
  pinceladaInput: { position: 'absolute', bottom: -12, left: -15, width: '90%', height: 14 },

  bloqueAccionesFinales: { alignItems: 'center', marginTop: 15, marginBottom: 20 },
  btnCrear: { width: 140, height: 60, marginBottom: 15, alignItems: 'center', justifyContent: 'center' },
  imagenBotonCrear: { width: '100%', height: '100%' },
  btnVerCalendarioTexto: { padding: 8 },
  textoVerCalendario: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },

  navBar: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 10, zIndex: 10, backgroundColor: '#050505', paddingVertical: 10 },
  navBoton: { width: '30%', alignItems: 'center' },
  imagenNav: { width: '100%', height: 28 }
});