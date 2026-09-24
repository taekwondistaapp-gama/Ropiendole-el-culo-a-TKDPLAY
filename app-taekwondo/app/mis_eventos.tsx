import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { StatusBar } from 'expo-status-bar';

export default function MisEventosScreen() {
  const [inscripciones, setInscripciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarMisEventos();
  }, []);

  const cargarMisEventos = async () => {
    try {
      const idPracticante = await AsyncStorage.getItem('@practicante_id_logueado');
      
      if (!idPracticante) return;

      // Hacemos una consulta "join" para traer la inscripción y los datos del evento
      const { data, error } = await supabase
        .from('inscripciones')
        .select(`
          id,
          compite_lucha,
          compite_tul,
          compite_rotura,
          compite_rotura_poder,
          eventos (
            id,
            nombre
          )
        `)
        .eq('id_practicante', idPracticante);

      if (error) throw error;
      setInscripciones(data || []);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnVolver}>
          <Text style={styles.textoVolver}>{"< Volver"}</Text>
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>MIS EVENTOS</Text>
        <View style={{ width: 60 }} /> {/* Espaciador para centrar el título */}
      </View>

      {/* LISTA DE EVENTOS */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {cargando ? (
          <ActivityIndicator size="large" color="#e60000" style={{ marginTop: 50 }} />
        ) : inscripciones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No estás inscripto a ningún evento todavía.</Text>
          </View>
        ) : (
          inscripciones.map((inscripcion, index) => (
            <View key={index} style={styles.tarjetaEvento}>
              <Text style={styles.nombreEvento}>{inscripcion.eventos?.nombre}</Text>
              
              <View style={styles.divisor} />
              
              <Text style={styles.subtituloModalidades}>Modalidades inscriptas:</Text>
              <View style={styles.filaModalidades}>
                {inscripcion.compite_lucha && <Text style={styles.etiquetaModalidad}>Lucha</Text>}
                {inscripcion.compite_tul && <Text style={styles.etiquetaModalidad}>Tul</Text>}
                {inscripcion.compite_rotura && <Text style={styles.etiquetaModalidad}>Rotura</Text>}
                {inscripcion.compite_rotura_poder && <Text style={styles.etiquetaModalidad}>Rot. Poder</Text>}
              </View>

              {/* Botón para ver la llave (Magia futura) */}
              <TouchableOpacity style={styles.btnVerLlave}>
                <Text style={styles.textoBtnLlave}>VER LLAVE Y CATEGORÍA</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  btnVolver: { paddingVertical: 10, paddingRight: 10 },
  textoVolver: { color: '#e60000', fontSize: 14, fontWeight: 'bold' },
  tituloHeader: { color: '#ffffff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  scrollContainer: { padding: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#aaaaaa', fontSize: 14, textAlign: 'center' },
  
  // Diseño de la tarjeta del evento
  tarjetaEvento: { backgroundColor: '#111111', borderRadius: 8, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#333333', position: 'relative', overflow: 'hidden' },
  nombreEvento: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  divisor: { height: 1, backgroundColor: '#333333', marginVertical: 10 },
  subtituloModalidades: { color: '#aaaaaa', fontSize: 10, marginBottom: 10, textTransform: 'uppercase' },
  filaModalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  etiquetaModalidad: { backgroundColor: '#e60000', color: '#ffffff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, fontSize: 14, fontWeight: 'bold' },
  
  btnVerLlave: { backgroundColor: '#222222', paddingVertical: 12, borderRadius: 4, alignItems: 'center', borderWidth: 1, borderColor: '#e60000' },
  textoBtnLlave: { color: '#e60000', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 }
});