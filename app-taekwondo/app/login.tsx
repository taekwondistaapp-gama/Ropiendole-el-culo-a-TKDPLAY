import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [idiomaActual, setIdiomaActual] = useState('es');
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [rolActual, setRolActual] = useState('practicante'); 

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      const guardado = await AsyncStorage.getItem('@idioma_app');
      if (guardado) setIdiomaActual(guardado);
      
      const rol = await AsyncStorage.getItem('@rol_usuario');
      if (rol) setRolActual(rol);
    };
    cargarDatosIniciales();
  }, []);

  const irAlRegistroSaberRol = () => {
    if (rolActual === 'practicante') {
      router.push('/registro_practicante');
    } else if (rolActual === 'dojang') {
      router.push('/dojang_registro'); 
    } 
  };

  const procesarLogin = async () => {
    const aliasLimpio = alias.trim();
    const passwordLimpio = password.trim();

    if (!aliasLimpio || !passwordLimpio) {
      Alert.alert('Error', idiomaActual === 'es' ? 'Completá tu Alias y Password.' : 'Please enter Alias and Password.');
      return;
    }

    setCargando(true);

    try {
      if (rolActual === 'dojang') {
        const { data: practData, error: practError } = await supabase
          .from('practicantes')
          .select('id, password')
          .ilike('alias', aliasLimpio)
          .limit(1)
          .maybeSingle();

        if (practError) {
          Alert.alert('Error de Servidor', practError.message);
          setCargando(false);
          return;
        }

        if (!practData || practData.password !== passwordLimpio) {
          Alert.alert('Acceso Denegado', idiomaActual === 'es' ? 'Credenciales incorrectas o alias no encontrado.' : 'Incorrect credentials.');
          setCargando(false);
          return;
        }

        // BLINDAJE APLICADO: .limit(1).maybeSingle() ya estaba en uso
        const { data: dojangData, error: dojError } = await supabase
          .from('dojangs')
          .select('id')
          .eq('id_instructor', practData.id)
          .limit(1)
          .maybeSingle();

        if (dojError) {
          Alert.alert('Error de Servidor', dojError.message);
          setCargando(false);
          return;
        }

        if (!dojangData) {
          Alert.alert('Acceso Denegado', idiomaActual === 'es' ? 'Este usuario no tiene un Dojang registrado a su nombre.' : 'No dojang registered to this user.');
          setCargando(false);
          return;
        }

        await AsyncStorage.setItem('@usuario_id', dojangData.id);
        await AsyncStorage.setItem('@dojang_id_logueado', dojangData.id);
        router.replace('/dojang_principal');
        setCargando(false);
        return;
      }

      let tablaDeBusqueda = 'practicantes';
      if (rolActual === 'escuela') tablaDeBusqueda = 'escuelas';
      if (rolActual === 'asociacion') tablaDeBusqueda = 'asociaciones';

      const { data: usuarioData, error: usuarioError } = await supabase
        .from(tablaDeBusqueda)
        .select('id, password')
        .ilike('alias', aliasLimpio)
        .limit(1)
        .maybeSingle();

      if (usuarioError) {
        Alert.alert('Error de Servidor', usuarioError.message);
        setCargando(false);
        return;
      }

      if (!usuarioData) {
        Alert.alert('Alerta de Sistema', idiomaActual === 'es' ? `El alias no existe en el sistema para este rol.` : `Alias not found for this role.`);
        setCargando(false);
        return;
      }

      if (usuarioData.password !== passwordLimpio) {
        Alert.alert('Error', idiomaActual === 'es' ? 'Password incorrecto.' : 'Incorrect password.');
        setCargando(false);
        return;
      }

      const usuarioId = usuarioData.id;
      await AsyncStorage.setItem('@usuario_id', usuarioId);

      if (rolActual === 'practicante') {
        await AsyncStorage.setItem('@practicante_id_logueado', usuarioId);
        router.replace('/practicante_principal');
      } else if (rolActual === 'escuela') {
        await AsyncStorage.setItem('@escuela_id_logueada', usuarioId);
        router.replace('/escuela_principal');
      } else if (rolActual === 'asociacion') {
        await AsyncStorage.setItem('@asociacion_id_logueada', usuarioId);
        router.replace('/asociacion_principal');
      }

    } catch (err: any) {
      console.log("Error en login:", err);
      Alert.alert('Error de Sistema', err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image source={require('../assets/images/pincelada_negra.png')} style={styles.fondoArribaDerecha} resizeMode="contain" />
      <Image source={require('../assets/images/pincelada_roja.png')} style={styles.fondoAbajoCentro} resizeMode="stretch" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          
          <View style={styles.headerContenedor}>
            <Text style={styles.tituloLogin}>
              {idiomaActual === 'es' ? 'Acceso al ' : 'Enter '}
              <Text style={styles.tituloLoginRojo}>{idiomaActual === 'es' ? 'Sistema' : 'System'}</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            
            <View style={styles.inputGroupAlias}>
              <Text style={styles.labelAlias}>{idiomaActual === 'es' ? 'Alias' : 'Alias'}</Text>
              <TextInput 
                style={styles.inputTxtAlias} 
                selectionColor="#e60000" 
                autoCapitalize="none"
                value={alias} 
                onChangeText={setAlias} 
              />
              <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaAlias} resizeMode="stretch" />
            </View>

            <View style={styles.inputGroupPassword}>
              <Text style={styles.labelPassword}>{idiomaActual === 'es' ? 'Password' : 'Password'}</Text>
              <TextInput 
                style={styles.inputTxtPassword} 
                selectionColor="#e60000" 
                secureTextEntry={true}
                autoCapitalize="none"
                value={password} 
                onChangeText={setPassword} 
              />
              <Image source={require('../assets/images/esquina_roja_larga.png')} style={styles.pinceladaPassword} resizeMode="stretch" />
            </View>

          </View>

          <View style={styles.contenedorBotonEntrar}>
            <TouchableOpacity 
              style={[styles.hitboxBtnEntrar, cargando && { opacity: 0.5 }]} 
              onPress={procesarLogin} 
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator size="large" color="#e60000" />
              ) : (
                <Image source={require('../assets/images/boton_entrar.png')} style={styles.imgBtnEntrar} resizeMode="contain" />
              )}
            </TouchableOpacity>
          </View>

          {(rolActual === 'practicante' || rolActual === 'dojang') && (
            <TouchableOpacity onPress={irAlRegistroSaberRol} style={styles.hitboxRegistro}>
              <Text style={styles.textoRegistro}>
                {idiomaActual === 'es' ? 'Si no tiene cuenta ' : 'If you have no account '}
                <Text style={styles.textoRegistroRojo}>{idiomaActual === 'es' ? 'Creela aquí' : 'Create one here'}</Text>
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.contenedorLogoInferior}>
            <Image source={require('../assets/images/logo_taekwondista.png')} style={styles.imgLogoInferior} resizeMode="contain" />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  fondoArribaDerecha: { position: 'absolute', top: 0, right: 0, width: 300, height: 600, opacity: 0.6, zIndex: -1 },
  fondoAbajoCentro: { position: 'absolute', bottom: 15, alignSelf: 'center', width: '90%', height: 20, zIndex: -1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 25, paddingBottom: 40 },
  headerContenedor: { width: '100%', alignItems: 'center', marginBottom: 10 },
  tituloLogin: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  tituloLoginRojo: { color: '#e60000' },
  formContainer: { width: '100%', alignItems: 'center' },
  inputGroupAlias: { width: '85%', position: 'relative', marginBottom: 30 },
  labelAlias: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 6, marginLeft: 0 },
  inputTxtAlias: { backgroundColor: '#222222', color: '#ffffff', height: 35, borderTopLeftRadius: 0, borderTopRightRadius: 4, paddingHorizontal: 15, fontSize: 15 },
  pinceladaAlias: { position: 'absolute', bottom: -18, left: -55, width: '100%', height: 16 },
  inputGroupPassword: { width: '85%', position: 'relative', marginBottom: 45 },
  labelPassword: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginBottom: 6, marginLeft: 0 },
  inputTxtPassword: { backgroundColor: '#222222', color: '#ffffff', height: 35, borderTopLeftRadius: 4, borderTopRightRadius: 4, paddingHorizontal: 15, fontSize: 15 },
  pinceladaPassword: { position: 'absolute', bottom: -18, left: -55, width: '100%', height: 16 },
  contenedorBotonEntrar: { width: '100%', alignItems: 'center', marginBottom: 20 },
  hitboxBtnEntrar: { width: 180, height: 55, justifyContent: 'center', alignItems: 'center' },
  imgBtnEntrar: { width: '100%', height: '100%' },
  hitboxRegistro: { width: '100%', alignItems: 'center', marginBottom: 30 },
  textoRegistro: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  textoRegistroRojo: { color: '#e60000' },
  contenedorLogoInferior: { width: '100%', alignItems: 'center', marginTop: 0 },
  imgLogoInferior: { width: 200, height: 200 } 
});