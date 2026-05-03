/**
 * MakingBookingScreen.tsx
 *
 * CO4 — Cloud Connectivity (Web-based REST API):
 *   After saving locally to SQLite, POSTs the booking to the cloud REST API
 *   with the logged-in user's email so bookings are user-specific.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addBooking } from '../utils/Database';
import { createBooking } from '../utils/ApiService';

const MakeBookingScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const station = route?.params?.station || { name: 'Unknown Station', price: 'RM0.00 / kWh' };

  const [selectedDate, setSelectedDate]     = useState('');
  const [selectedTime, setSelectedTime]     = useState('');
  const [duration, setDuration]             = useState(1);
  const [availableDates, setAvailableDates] = useState<
    { fullDate: string; dateKey: string; displayDay: string; displayDate: string }[]
  >([]);
  const [isSyncing, setIsSyncing]           = useState(false);
  const [userEmail, setUserEmail]           = useState('');

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
  ];

  useEffect(() => {
    // Load logged-in user email from AsyncStorage
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserEmail(user.email || '');
      }
    };
    loadUser();

    // Build next 7 dates
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        fullDate:    d.toLocaleDateString('en-US'),
        dateKey:     `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, 
        displayDay:  d.toLocaleDateString('en-US', { weekday: 'short' }),
        displayDate: d.getDate().toString(),
      });
    }
    setAvailableDates(dates);
    setSelectedDate(dates[0].fullDate);
  }, []);

  // ── Price calculation ──────────────────────────────────────────────────────
  const getNumericRate = (priceString: string) => {
    const numericPart = priceString.replace(/[^\d.]/g, '');
    return parseFloat(numericPart) || 0;
  };

  const ASSUMED_POWER_KW   = 22;
  const ratePerKwh         = getNumericRate(station.price);
  const estimatedEnergyKwh = duration * ASSUMED_POWER_KW;
  const totalPrice         = (estimatedEnergyKwh * ratePerKwh).toFixed(2);

  const getLoggedInEmail = async () => {
    try {
      // Your LoginScreen saves the current user here.
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user?.email) return user.email;
      }

      // Keep this fallback in case another teammate uses AuthStorage.js.
      const sessionData = await AsyncStorage.getItem('@user_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session?.email) return session.email;
      }
    } catch (e) {
      console.warn('Failed to read logged-in user email:', e);
    }

    // Demo fallback: prevents server SQLITE NOT NULL error during assignment demo.
    return 'guest@evchargingapp.local';
  };


  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const parseDateKey = (dateText: string) => {
    const selected = availableDates.find(d => d.fullDate === dateText);
    if (selected?.dateKey) return selected.dateKey;

    const parts = dateText.split('/').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return '';

    let month = parts[0];
    let day = parts[1];
    const year = parts[2];

    // Support both MM/DD/YYYY and DD/MM/YYYY if another phone locale formats it differently.
    if (month > 12 && day <= 12) {
      day = parts[0];
      month = parts[1];
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const parseTimeToMinutes = (timeText: string) => {
    const match = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const formatCurrentDateTime = () => {
    const now = new Date();
    return `${now.toLocaleDateString('en-US')} ${now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  const isInvalidPastSlot = (dateText: string, timeText: string) => {
    const dateKey = parseDateKey(dateText);
    const todayKey = formatDateKey(new Date());
    const selectedMinutes = parseTimeToMinutes(timeText);
    if (!dateKey || selectedMinutes === null) return false;

    if (dateKey < todayKey) return true;
    if (dateKey > todayKey) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return selectedMinutes <= currentMinutes;
  };

  const showInvalidTimeAlert = (timeText: string) => {
    Alert.alert(
      'Invalid Booking Time',
      `You cannot book a time slot that has already passed.

Current date/time: ${formatCurrentDateTime()}
Selected date/time: ${selectedDate} ${timeText}`,
      [{ text: 'OK' }]
    );
  };

  // ── Confirm booking ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedTime || !selectedDate) {
      Alert.alert('Selection Required', 'Please select a date and a time slot.');
      return;
    }

    if (isInvalidPastSlot(selectedDate, selectedTime)) {
      showInvalidTimeAlert(selectedTime);
      return;
    }

    const emailForCloud = await getLoggedInEmail();
    setUserEmail(emailForCloud);

    // CO3 — Save locally to SQLite
    addBooking(
      station.name,
      selectedDate,
      selectedTime,
      duration,
      async (localSuccessMsg: string) => {

        // CO4 — Sync to cloud REST API with userEmail
        setIsSyncing(true);
        try {
          const payload = {
            userEmail:   emailForCloud,
            stationName: station.name,
            date:        selectedDate,
            time:        selectedTime,
            duration:    Number(duration),
            totalPrice:  Number(totalPrice),
            status:      'Upcoming',
          };

          console.log('[API] Sending booking payload:', payload);
          const result = await createBooking(payload);
          console.log('[API] Booking synced to cloud, id:', result.id);

          Alert.alert(
            'Booking Confirmed',
            'Saved locally and synced to cloud.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } catch (cloudErr: any) {
          console.warn('[API] Cloud sync failed:', cloudErr.message);
          Alert.alert(
            'Booking Saved (Local Only)',
            `${localSuccessMsg}\n\nCloud sync failed: ${cloudErr.message}`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } finally {
          setIsSyncing(false);
        }
      },
      (errorMsg: string) => {
        Alert.alert('Database Error', errorMsg);
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{station.name}</Text>
        <Text style={styles.rateText}>Rate: {station.price}</Text>

        {/* DATE SELECTOR */}
        <Text style={styles.sectionLabel}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {availableDates.map((item, index) => {
            const isSelected = selectedDate === item.fullDate;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                onPress={() => setSelectedDate(item.fullDate)}
              >
                <Text style={[styles.dateDay, isSelected && styles.selectedText]}>{item.displayDay}</Text>
                <Text style={[styles.dateNum, isSelected && styles.selectedText]}>{item.displayDate}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TIME SLOT SELECTOR */}
        <Text style={styles.sectionLabel}>Select Time Slot</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time, index) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
                onPress={() => {
                  if (selectedDate && isInvalidPastSlot(selectedDate, time)) {
                    showInvalidTimeAlert(time);
                    return;
                  }
                  setSelectedTime(time);
                }}
              >
                <Text style={[styles.timeText, isSelected && styles.selectedText]}>{time}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DURATION SELECTOR */}
        <Text style={styles.sectionLabel}>Charging Duration (Hours)</Text>
        <View style={styles.durationContainer}>
          <TouchableOpacity style={styles.durationBtn} onPress={() => setDuration(prev => Math.max(1, prev - 1))}>
            <Text style={styles.durationBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.durationValue}>{duration} hr{duration > 1 ? 's' : ''}</Text>
          <TouchableOpacity style={styles.durationBtn} onPress={() => setDuration(prev => Math.min(12, prev + 1))}>
            <Text style={styles.durationBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* BOOKING SUMMARY */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Est. Energy ({ASSUMED_POWER_KW}kW × {duration}h):</Text>
            <Text style={styles.summaryValue}>{estimatedEnergyKwh} kWh</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Total Estimated Price:</Text>
            <Text style={styles.priceText}>RM {totalPrice}</Text>
          </View>
        </View>

        {isSyncing && (
          <View style={styles.syncingRow}>
            <ActivityIndicator color="#00AB82" />
            <Text style={styles.syncingText}>Syncing with cloud…</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmBtn, isSyncing && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={isSyncing}
        >
          <Text style={styles.confirmBtnText}>Confirm Booking</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  title:             { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  rateText:          { fontSize: 16, color: '#28A745', marginBottom: 20, marginTop: 5, fontWeight: 'bold' },
  sectionLabel:      { fontSize: 18, fontWeight: '600', marginTop: 15, marginBottom: 10, color: '#333' },
  dateScroll:        { flexDirection: 'row', marginBottom: 10 },
  dateCard:          { padding: 15, borderRadius: 10, backgroundColor: '#F0F0F0', marginRight: 10, alignItems: 'center', width: 70 },
  selectedDateCard:  { backgroundColor: '#00AB82' },
  dateDay:           { fontSize: 14, color: '#666' },
  dateNum:           { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 5 },
  timeGrid:          { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timeSlot:          { width: '31%', paddingVertical: 12, backgroundColor: '#F0F0F0', borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  selectedTimeSlot:  { backgroundColor: '#00AB82' },
  timeText:          { fontSize: 14, color: '#333', fontWeight: '500' },
  selectedText:      { color: '#FFF' },
  durationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  durationBtn:       { backgroundColor: '#00AB82', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  durationBtnText:   { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  durationValue:     { fontSize: 20, fontWeight: 'bold', marginHorizontal: 30, color: '#333' },
  summaryBox:        { backgroundColor: '#F9F9F9', padding: 20, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  summaryTitle:      { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  summaryText:       { fontSize: 14, color: '#666' },
  summaryValue:      { fontSize: 14, fontWeight: 'bold', color: '#333' },
  divider:           { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },
  priceText:         { fontSize: 22, fontWeight: 'bold', color: '#00AB82' },
  syncingRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8 },
  syncingText:       { color: '#00AB82', fontSize: 14 },
  confirmBtn:        { backgroundColor: '#00AB82', padding: 18, borderRadius: 10, marginTop: 30, marginBottom: 40, alignItems: 'center' },
  confirmBtnText:    { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default MakeBookingScreen;
