import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, ImageBackground, SafeAreaView, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

const { width } = Dimensions.get('window');

export default function CredencialScreen() {
  const { idEvento } = useLocalSearchParams();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [datosPracticante, setDatosPracticante] = useState<any>(null);
  const [datosEvento, setDatosEvento] = useState<any>(null);
  const [rolesInscripcion, setRolesInscripcion] = useState<any>(null);

  // Referencia para capturar la tarjeta exacta
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    const cargarDatosCredencial = async () => {
      try {
        const idPracticante = await AsyncStorage.getItem('@practicante_id_logueado');
        if (!idPracticante) return;

        // BLINDAJE: Aseguramos que el ID del evento sea un texto simple para evitar la pantalla roja
        const eventoIdSeguro = Array.isArray(idEvento) ? idEvento[0] : idEvento;

        // 1. Cargar datos del practicante
        const { data: pracData, error: pracError } = await supabase
          .from('practicantes')
          .select('*')
          .eq('id', idPracticante)
          .single();
          
        if (pracError) throw pracError;
        setDatosPracticante(pracData);

        // 2. Cargar datos del evento e inscripción
        if (eventoIdSeguro) {
          const { data: evData, error: evError } = await supabase
            .from('eventos')
            .select('nombre')
            .eq('id', eventoIdSeguro)
            .single();
            
          if (evError) throw evError;
          setDatosEvento(evData);

          // Buscar inscripciones sin .single() para evitar crasheos si te inscribiste más de una vez probando
          const { data: insData, error: insError } = await supabase
            .from('inscripciones')
            .select('*')
            .eq('id_evento', eventoIdSeguro)
            .eq('id_practicante', idPracticante);

          if (insError) throw insError;

          if (insData && insData.length > 0) {
            // Nos quedamos con la ÚLTIMA inscripción registrada (adiós "ASISTENTE")
            setRolesInscripcion(insData[insData.length - 1]);
          }
        }
      } catch (err: any) {
        console.error("Error cargando credencial:", err);
        Alert.alert("Aviso de Sistema", "Ocurrió un error cargando los datos: " + err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosCredencial();
  }, [idEvento]);

  const obtenerRolesTexto = () => {
    if (!rolesInscripcion) return 'ASISTENTE';
    let r = [];
    if (rolesInscripcion.compite_lucha || rolesInscripcion.compite_tul || rolesInscripcion.compite_rotura || rolesInscripcion.compite_rotura_poder) r.push('COMPETIDOR');
    if (rolesInscripcion.es_coach) r.push('COACH');
    if (rolesInscripcion.es_juez) r.push('JUEZ');
    if (rolesInscripcion.es_arbitro) r.push('ÁRBITRO');
    return r.length > 0 ? r.join(' • ') : 'ASISTENTE';
  };

  // Función que "fotografía" el componente y lo comparte/guarda
  const handleGuardarYVolver = async () => {
    setGuardando(true);
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { dialogTitle: 'Tu Credencial Oficial' });
        } else {
          Alert.alert("Éxito", "Credencial generada correctamente.");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", "No se pudo guardar la credencial: " + error.message);
    } finally {
      setGuardando(false);
      router.replace('/practicante_principal');
    }
  };

  if (cargando) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#e60000" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Preparando credencial...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* VIEWSHOT: Todo lo que esté adentro de esta etiqueta será "fotografiado" */}
      <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 1.0 }} style={styles.credencialWrapper}>
        
        <ImageBackground 
          source={require('../assets/images/fondo_credencial.png')} 
          style={styles.fondoCredencial} 
          resizeMode="cover"
        >
          {/* NOMBRE DEL EVENTO */}
          <Text style={[styles.textoEvento, { top: 30, left: 0, right: 0 }]}>
            {datosEvento?.nombre || 'TORNEO OFICIAL'}
          </Text>

          {/* FOTO DEL PRACTICANTE */}
          <View style={[styles.contenedorFoto, { top: 75, left: '50%', marginLeft: -55 }]}>
            {datosPracticante?.foto_perfil_url ? (
              <Image source={{ uri: datosPracticante.foto_perfil_url }} style={styles.fotoPerfil} />
            ) : (
              <View style={styles.fotoPlaceholder}><Text style={styles.textoPlaceholderFoto}>SIN FOTO</Text></View>
            )}
            
            {/* MARCO DE LA FOTO (Superpuesto) */}
            <Image 
              source={require('../assets/images/marco_foto.png')} 
              style={styles.marcoFoto} 
              resizeMode="stretch" 
            />
          </View>

          {/* NOMBRE Y APELLIDO */}
          <Text style={[styles.textoNombreApellido, { top: 220, left: 0, right: 0 }]}>
            {datosPracticante?.nombre} {datosPracticante?.apellido}
          </Text>

          {/* ROL / MODALIDAD */}
          <View style={[styles.seccionRol, { top: 250, left: '50%', marginLeft: -75 }]}>
            <Text style={styles.textoRol}>{obtenerRolesTexto()}</Text>
          </View>

          {/* NOMBRE EN COREANO */}
          <Text style={[styles.textoCoreano, { top: 290, left: 0, right: 0 }]}>
            {datosPracticante?.nombre_coreano || ''}
          </Text>
          
          {/* LEYENDA PEQUEÑA DEL COREANO */}
          <Text style={[styles.leyendaCoreano, { top: 318, left: 0, right: 0 }]}>
            tu nombre en coreano
          </Text>

          {/* ID DEL PRACTICANTE (Abajo) */}
          <Text style={[styles.textoID, { bottom: 20, left: 0, right: 0 }]}>
            ID: {datosPracticante?.id?.substring(0, 8) || 'TKD'}
          </Text>

        </ImageBackground>
      </ViewShot>

      {/* BOTÓN GUARDAR Y VOLVER */}
      <View style={styles.contenedorBotonGuardar}>
        <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardarYVolver} disabled={guardando}>
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBtnGuardar}>GUARDAR Y VOLVER</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' },
  loaderContainer: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' },
  
  credencialWrapper: { 
    width: width * 0.82, 
    height: (width * 0.82) * 1.6, // Mantiene la proporción vertical fija
    borderRadius: 12, 
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 20
  },
  fondoCredencial: { flex: 1, width: '100%', height: '100%', position: 'relative' },
  
  // Elementos con Posicionamiento Absoluto
  textoEvento: { position: 'absolute', color: '#ffffff', fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  
  contenedorFoto: { position: 'absolute', width: 110, height: 130, justifyContent: 'center', alignItems: 'center' },
  fotoPerfil: { width: '100%', height: '100%', borderRadius: 6, resizeMode: 'cover' },
  fotoPlaceholder: { width: '100%', height: '100%', borderRadius: 6, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  textoPlaceholderFoto: { color: '#777', fontSize: 10, fontWeight: 'bold' },
  marcoFoto: { position: 'absolute', top: -5, left: -5, width: 120, height: 140, zIndex: 10 }, // El zIndex lo pone por encima de la foto
  
  textoNombreApellido: { position: 'absolute', color: '#ffffff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  
  seccionRol: { position: 'absolute', width: 150, backgroundColor: 'rgba(230,0,0,0.85)', paddingVertical: 4, borderRadius: 4 },
  textoRol: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  
  textoCoreano: { position: 'absolute', color: '#e60000', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  leyendaCoreano: { position: 'absolute', color: '#888888', fontSize: 9, fontStyle: 'italic', textAlign: 'center' },
  
  textoID: { position: 'absolute', color: '#ffffff', fontSize: 10, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2 },

  contenedorBotonGuardar: { width: '80%', alignItems: 'center' },
  btnGuardar: { backgroundColor: '#e60000', width: '100%', paddingVertical: 14, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#ff1a1a' },
  textoBtnGuardar: { color: '#ffffff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }
});