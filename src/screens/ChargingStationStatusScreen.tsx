/**
 * ChargingStationStatusScreen.tsx
 *
 * CO4 — Cloud Connectivity (WebSocket API — Socket.IO):
 *   This screen connects to the evSocketServer.js (namespace /charging) and
 *   lets the user check LIVE availability for a chosen EV charging station.
 *
 * Protocol:
 *   1. On mount → connect to ws://10.0.2.2:5001/charging
 *   2. Emit  "client_connected"  { connected: true }
 *   3. User taps a station → emit  "request_status"  { stationId }
 *   4. Listen for "status_update" → display real-time result
 *
 * Add this screen to your Drawer or Tab navigator as "Live Status".
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import io, { Socket } from 'socket.io-client';
import config from '../utils/config';

// ─── Station list (mirrors ChargingStationsScreen) ────────────────────────────
const STATIONS = [
  { id: '1', name: 'KLCC EV Station',    location: 'Level 2, KLCC Parking'         },
  { id: '2', name: 'Cyberjaya EV Point', location: 'Cyberjaya City Centre'          },
  { id: '3', name: 'Putrajaya EV Hub',   location: 'Precinct 1, Putrajaya'         },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatusResult {
  stationId:   string;
  stationName: string;
  available:   number;
  totalSlots:  number;
  powerOutput: number;
  waitTime:    number;
  message:     string;
}

const ChargingStationStatusScreen = () => {
  const socketRef                         = useRef<Socket | null>(null);
  const [connected, setConnected]         = useState(false);
  const [statusResult, setStatusResult]   = useState<StatusResult | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [isLoading, setIsLoading]         = useState(false);

  // ── Connect on mount, disconnect on unmount ────────────────────────────────
  useEffect(() => {
    const socket = io(`${config.socketUrl}/charging`, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket.IO] Connected to /charging, id:', socket.id);

      // Notify server that client is connected
      socket.emit('client_connected', { connected: true });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket.IO] Disconnected from /charging');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
      setConnected(false);
    });

    // Receive real-time status from server
    socket.on('status_update', (data: StatusResult) => {
      setStatusResult(data);
      setIsLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ── Request live status for a station ─────────────────────────────────────
  const requestStatus = (stationId: string) => {
    if (!socketRef.current || !connected) return;

    setSelectedStation(stationId);
    setStatusResult(null);
    setIsLoading(true);

    socketRef.current.emit('request_status', { stationId });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const availabilityColor = () => {
    if (!statusResult) return '#333';
    return statusResult.available > 0 ? '#00AB82' : '#FF3B30';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Connection status banner ───────────────────────────────────── */}
        <View style={[styles.banner, connected ? styles.bannerConnected : styles.bannerDisconnected]}>
          <View style={[styles.dot, { backgroundColor: connected ? '#00AB82' : '#FF3B30' }]} />
          <Text style={styles.bannerText}>
            {connected ? 'Connected to live server' : 'Disconnected — check server'}
          </Text>
        </View>

        <Text style={styles.heading}>Live Station Availability</Text>
        <Text style={styles.subheading}>Select a station to check real-time slot status.</Text>

        {/* ── Station selector buttons ──────────────────────────────────── */}
        {STATIONS.map((station) => {
          const isSelected = selectedStation === station.id;
          return (
            <TouchableOpacity
              key={station.id}
              style={[styles.stationCard, isSelected && styles.stationCardSelected]}
              onPress={() => requestStatus(station.id)}
              disabled={!connected}
            >
              <Text style={[styles.stationName, isSelected && styles.stationNameSelected]}>
                {station.name}
              </Text>
              <Text style={[styles.stationLocation, isSelected && styles.stationLocationSelected]}>
                📍 {station.location}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* ── Loading spinner ───────────────────────────────────────────── */}
        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#00AB82" />
            <Text style={styles.loadingText}>Requesting live status…</Text>
          </View>
        )}

        {/* ── Status result card ────────────────────────────────────────── */}
        {statusResult && !isLoading && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{statusResult.stationName}</Text>

            {/* Availability indicator */}
            <View style={styles.availabilityRow}>
              <Text style={styles.availabilityLabel}>Available Slots</Text>
              <Text style={[styles.availabilityValue, { color: availabilityColor() }]}>
                {statusResult.available} / {statusResult.totalSlots}
              </Text>
            </View>

            {/* Power output */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>⚡ Power Output</Text>
              <Text style={styles.infoValue}>{statusResult.powerOutput} kW</Text>
            </View>

            {/* Wait time (only if full) */}
            {statusResult.available === 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>⏳ Est. Wait Time</Text>
                <Text style={[styles.infoValue, { color: '#FF3B30' }]}>
                  {statusResult.waitTime} min
                </Text>
              </View>
            )}

            {/* Server message */}
            <View style={[styles.messageBubble,
              { backgroundColor: statusResult.available > 0 ? '#E6F4EA' : '#FDECEA' }]}>
              <Text style={[styles.messageText, { color: availabilityColor() }]}>
                {statusResult.message}
              </Text>
            </View>

            {/* Refresh button */}
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => requestStatus(statusResult.stationId)}
            >
              <Text style={styles.refreshBtnText}>🔄 Refresh Status</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!statusResult && !isLoading && connected && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Tap a station above to check live availability.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:               { flex: 1, backgroundColor: '#F8F9FA' },

  // Banner
  banner:                  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  bannerConnected:         { backgroundColor: '#E6F4EA' },
  bannerDisconnected:      { backgroundColor: '#FDECEA' },
  dot:                     { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  bannerText:              { fontSize: 13, fontWeight: '600', color: '#333' },

  // Headings
  heading:                 { fontSize: 22, fontWeight: 'bold', color: '#333', marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
  subheading:              { fontSize: 14, color: '#777', marginHorizontal: 16, marginBottom: 16 },

  // Station cards
  stationCard:             { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#E0E0E0' },
  stationCardSelected:     { borderColor: '#00AB82', backgroundColor: '#E6F4EA' },
  stationName:             { fontSize: 16, fontWeight: 'bold', color: '#333' },
  stationNameSelected:     { color: '#00AB82' },
  stationLocation:         { fontSize: 13, color: '#777', marginTop: 4 },
  stationLocationSelected: { color: '#07775C' },

  // Loading
  loadingRow:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 8 },
  loadingText:             { color: '#00AB82', fontSize: 14 },

  // Result card
  resultCard:              { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginHorizontal: 16, marginTop: 16, elevation: 3 },
  resultTitle:             { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  availabilityRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  availabilityLabel:       { fontSize: 15, color: '#555', fontWeight: '600' },
  availabilityValue:       { fontSize: 28, fontWeight: 'bold' },
  infoRow:                 { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel:               { fontSize: 14, color: '#666' },
  infoValue:               { fontSize: 14, fontWeight: '600', color: '#333' },
  messageBubble:           { borderRadius: 10, padding: 14, marginTop: 14 },
  messageText:             { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  refreshBtn:              { marginTop: 16, borderWidth: 1.5, borderColor: '#00AB82', borderRadius: 10, padding: 12, alignItems: 'center' },
  refreshBtnText:          { color: '#00AB82', fontWeight: '700', fontSize: 15 },

  // Empty state
  emptyState:              { alignItems: 'center', marginTop: 30 },
  emptyText:               { color: '#AAA', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});

export default ChargingStationStatusScreen;
