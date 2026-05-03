/**
 * BookingScreen.tsx
 *
 * CO4 — Cloud Connectivity (Web-based REST API):
 *   Cloud is the SINGLE source of truth for all CRUD operations.
 *   Local SQLite is NOT used here to avoid ID mismatch issues.
 *
 *   - READ:   GET    /api/bookings?email=xxx
 *   - UPDATE: PUT    /api/bookings/:id
 *   - DELETE: DELETE /api/bookings/:id
 *
 * History is still saved to local AsyncStorage after payment.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveData, loadData, STORAGE_KEYS } from '../utils/storage';
import {
  getAllBookings,
  updateBooking as updateCloudBooking,
  deleteBooking as deleteCloudBooking,
} from '../utils/ApiService';

const BookingScreen = () => {
  const isFocused = useIsFocused();

  const [bookings, setBookings]                         = useState<any[]>([]);
  const [isLoading, setIsLoading]                       = useState(false);
  const [userEmail, setUserEmail]                       = useState('');
  const [isEditModalVisible, setEditModalVisible]       = useState(false);
  const [selectedBooking, setSelectedBooking]           = useState<any>(null);
  const [newTime, setNewTime]                           = useState('');
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [bookingToPay, setBookingToPay]                 = useState<any>(null);
  const [isProcessing, setIsProcessing]                 = useState(false);

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
  ];


  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const parseDateKey = (dateText: string) => {
    const parts = dateText.split('/').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return '';

    let month = parts[0];
    let day = parts[1];
    const year = parts[2];

    // Support both MM/DD/YYYY and DD/MM/YYYY.
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

  const showInvalidRescheduleAlert = (timeText: string) => {
    Alert.alert(
      'Invalid Reschedule Time',
      `You cannot change your booking to a time that has already passed.

Current date/time: ${formatCurrentDateTime()}
Selected date/time: ${selectedBooking?.date || ''} ${timeText}`,
      [{ text: 'OK' }]
    );
  };

  // ── Load user email then fetch bookings ───────────────────────────────────
  useEffect(() => {
    if (isFocused) loadUserAndFetch();
  }, [isFocused]);

  const loadUserAndFetch = async () => {
    try {
      const userData =
        (await AsyncStorage.getItem('user')) ||
        (await AsyncStorage.getItem('@user_session'));

      if (!userData) {
        setUserEmail('');
        setBookings([]);
        return;
      }

      const user = JSON.parse(userData);
      const email = user.email || '';

      if (!email) {
        setUserEmail('');
        setBookings([]);
        return;
      }

      setUserEmail(email);
      fetchBookings(email);
    } catch (err) {
      console.warn('Failed to load user from AsyncStorage');
    }
  };

  // ── READ — fetch only this user's bookings from cloud ─────────────────────
  const fetchBookings = async (email: string) => {
    if (!email) {
      setBookings([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getAllBookings(email);
      const formatted = data.map((item: any) => ({
        id:          item.id,           // cloud ID — used for all cloud operations
        stationName: item.stationName,
        date:        item.date,
        time:        item.time,
        displayTime: `${item.date} at ${item.time}`,
        duration:    item.duration,
        totalPrice:  item.totalPrice,
        status:      item.status,
      }));
      setBookings(formatted);
    } catch (err: any) {
      console.warn('[API] fetchBookings failed:', err.message);
      Alert.alert('Network Error', 'Could not load bookings from cloud.\nMake sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── DELETE — cloud only ───────────────────────────────────────────────────
  const handleCancel = (item: any) => {
    Alert.alert('Cancel Booking', `Cancel booking at ${item.stationName}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setIsProcessing(true);
          try {
            await deleteCloudBooking(item.id);
            Alert.alert('Canceled', 'Your booking has been canceled.');
            fetchBookings(userEmail);
          } catch (err: any) {
            Alert.alert('Error', `Failed to cancel booking: ${err.message}`);
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  // ── EDIT MODAL open ───────────────────────────────────────────────────────
  const openEditModal = (booking: any) => {
    setSelectedBooking(booking);
    setNewTime('');
    setEditModalVisible(true);
  };

  // ── UPDATE — cloud only ───────────────────────────────────────────────────
  const saveUpdatedTime = async () => {
    if (!newTime) {
      Alert.alert('Selection Required', 'Please select a new time slot.');
      return;
    }

    if (selectedBooking?.date && isInvalidPastSlot(selectedBooking.date, newTime)) {
      showInvalidRescheduleAlert(newTime);
      return;
    }

    setIsProcessing(true);
    try {
      await updateCloudBooking(selectedBooking.id, {
        time:     newTime,
        duration: selectedBooking.duration,
      });
      Alert.alert('Success', `Booking time updated to ${newTime}!`);
      setEditModalVisible(false);
      fetchBookings(userEmail);
    } catch (err: any) {
      Alert.alert('Error', `Failed to update booking: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── PAYMENT — delete from cloud + save to local history ──────────────────
  const finishCharging = (booking: any) => {
    setBookingToPay(booking);
    setPaymentModalVisible(true);
  };

  const confirmPaymentAndSave = async () => {
    if (!bookingToPay) return;

    setIsProcessing(true);
    try {
      // 1. Delete from cloud
      await deleteCloudBooking(bookingToPay.id);

      // 2. Save to this user's local AsyncStorage history only
      const historyKey = `${STORAGE_KEYS.HISTORY}_${userEmail}`;
      const history = (await loadData(historyKey)) || [];
      const newRecord = {
        id:          Date.now().toString(),
        userEmail:   userEmail,
        stationName: bookingToPay.stationName,
        date:        bookingToPay.displayTime,
        cost:        bookingToPay.totalPrice,
        usage:       `${bookingToPay.duration} hr(s)`,
      };
      await saveData(historyKey, [newRecord, ...history]);

      setPaymentModalVisible(false);
      Alert.alert(
        '✅ Payment Successful',
        `RM ${bookingToPay.totalPrice} paid for ${bookingToPay.stationName}.\nThank you!`,
        [{ text: 'OK', onPress: () => fetchBookings(userEmail) }]
      );
    } catch (err: any) {
      Alert.alert('Payment Error', `Failed to process payment: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* Global loading / processing overlay */}
      {(isLoading || isProcessing) && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#00AB82" />
          <Text style={styles.loadingText}>
            {isProcessing ? 'Processing…' : 'Loading from cloud…'}
          </Text>
        </View>
      )}

      <FlatList
        data={bookings}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        onRefresh={() => fetchBookings(userEmail)}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.stationName}>{item.stationName}</Text>
              <Text style={styles.statusBadge}>{item.status}</Text>
            </View>
            <Text style={styles.detailText}>🗓️ {item.displayTime}</Text>
            <Text style={styles.detailText}>⏱️ Duration: {item.duration} hour(s)</Text>
            <Text style={styles.priceText}>Est. Total: RM {item.totalPrice}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal(item)}
                disabled={isProcessing}
              >
                <Text style={styles.editBtnText}>Edit Time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancel(item)}
                disabled={isProcessing}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.finishBtn, isProcessing && { opacity: 0.6 }]}
              onPress={() => finishCharging(item)}
              disabled={isProcessing}
            >
              <Text style={styles.finishBtnText}>Finish Charging & Pay</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{userEmail ? 'No Active Bookings' : 'Login Required'}</Text>
              <Text style={styles.emptySub}>{userEmail ? 'Your upcoming charging slots will appear here.' : 'Please login to view your bookings.'}</Text>
            </View>
          ) : null
        }
      />

      {/* ── EDIT TIME MODAL ─────────────────────────────────────────────── */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Booking</Text>
            <Text style={styles.modalSub}>
              Select a new time for {selectedBooking?.stationName}
            </Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((time, index) => {
                const isSelected = newTime === time;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
                    onPress={() => {
                        if (selectedBooking?.date && isInvalidPastSlot(selectedBooking.date, time)) {
                          showInvalidRescheduleAlert(time);
                          return;
                        }
                        setNewTime(time);
                      }}
                  >
                    <Text style={[styles.timeText, isSelected && styles.selectedText]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={isProcessing}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, isProcessing && { opacity: 0.6 }]}
                onPress={saveUpdatedTime}
                disabled={isProcessing}
              >
                {isProcessing
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.modalSaveText}>Save Time</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── PAYMENT MODAL ───────────────────────────────────────────────── */}
      <Modal visible={isPaymentModalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Details</Text>
            <Text style={styles.modalSub}>
              Confirm payment for {bookingToPay?.stationName}
            </Text>
            <View style={styles.paymentAmountBox}>
              <Text style={styles.paymentLabel}>Total Amount</Text>
              <Text style={styles.paymentAmount}>RM {bookingToPay?.totalPrice}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPaymentModalVisible(false)}
                disabled={isProcessing}
              >
                <Text style={styles.modalCancelText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, isProcessing && { opacity: 0.6 }]}
                onPress={confirmPaymentAndSave}
                disabled={isProcessing}
              >
                {isProcessing
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.modalSaveText}>Confirm Pay</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 15, paddingTop: 10 },
  loadingRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  loadingText:      { color: '#00AB82', fontSize: 14 },
  card:             { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 15, elevation: 2 },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stationName:      { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge:      { backgroundColor: '#E6F4EA', color: '#00AB82', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  detailText:       { fontSize: 14, color: '#555', marginBottom: 6 },
  priceText:        { fontSize: 16, fontWeight: 'bold', color: '#00AB82', marginTop: 5, marginBottom: 15 },
  actionRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  editBtn:          { flex: 1, borderWidth: 1, borderColor: '#00AB82', padding: 10, borderRadius: 8, alignItems: 'center', marginRight: 5 },
  editBtnText:      { color: '#00AB82', fontWeight: '600' },
  cancelBtn:        { flex: 1, borderWidth: 1, borderColor: '#FF3B30', padding: 10, borderRadius: 8, alignItems: 'center', marginLeft: 5 },
  cancelBtnText:    { color: '#FF3B30', fontWeight: '600' },
  finishBtn:        { backgroundColor: '#00AB82', padding: 12, borderRadius: 8, alignItems: 'center' },
  finishBtnText:    { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  emptyContainer:   { alignItems: 'center', marginTop: 100 },
  emptyTitle:       { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptySub:         { fontSize: 14, color: '#888' },
  modalBg:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:     { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle:       { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  modalSub:         { fontSize: 14, color: '#666', marginBottom: 20 },
  timeGrid:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timeSlot:         { width: '31%', paddingVertical: 12, backgroundColor: '#F0F0F0', borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  selectedTimeSlot: { backgroundColor: '#00AB82' },
  timeText:         { fontSize: 14, color: '#333', fontWeight: '500' },
  selectedText:     { color: '#FFF' },
  modalActions:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalCancelBtn:   { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 8, marginRight: 10 },
  modalCancelText:  { color: '#333', fontWeight: 'bold' },
  modalSaveBtn:     { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#00AB82', borderRadius: 8, marginLeft: 10 },
  modalSaveText:    { color: '#FFF', fontWeight: 'bold' },
  paymentAmountBox: { marginVertical: 25, alignItems: 'center' },
  paymentLabel:     { fontSize: 16, color: '#666', marginBottom: 8 },
  paymentAmount:    { fontSize: 36, fontWeight: 'bold', color: '#00AB82' },
});

export default BookingScreen;
