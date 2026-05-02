import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, SafeAreaView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';
import { getBookings, deleteBooking, updateBooking } from '../utils/Database';

const BookingScreen = () => {
  const isFocused = useIsFocused();
  const [bookings, setBookings] = useState<any[]>([]);
  
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newTime, setNewTime] = useState('');

  // NEW STATES FOR PAYMENT
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [bookingToPay, setBookingToPay] = useState<any>(null);

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  useEffect(() => {
    if (isFocused) {
      fetchBookings();
    }
  }, [isFocused]);

  const fetchBookings = () => {
    getBookings((data: any[]) => {
      const formattedBookings = data.map(item => ({
        id: item.id,
        stationName: item.stationName,
        time: `${item.date} at ${item.time}`,
        duration: item.duration,
        totalPrice: (item.duration * 22 * 1.5).toFixed(2), 
        status: 'Upcoming'
      }));
      setBookings(formattedBookings);
    });
  };

  const handleCancel = (id: string | number) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      { 
        text: 'Yes, Cancel', 
        style: 'destructive',
        onPress: () => {
          deleteBooking(id, (successMsg: string) => {
            Alert.alert('Canceled', successMsg);
            fetchBookings();
          });
        }
      }
    ]);
  };

  const openEditModal = (booking: any) => {
    setSelectedBooking(booking);
    setNewTime(''); 
    setEditModalVisible(true);
  };

  const saveUpdatedTime = () => {
    if (!newTime) {
      Alert.alert('Selection Required', 'Please select a new time slot.');
      return;
    }
    updateBooking(
      selectedBooking.id,
      newTime,
      selectedBooking.duration,
      (successMsg: string) => {
        Alert.alert('Success', successMsg);
        setEditModalVisible(false);
        fetchBookings();
      },
      (errorMsg: string) => {
        Alert.alert('Error', errorMsg);
      }
    );
  };

  // MODIFIED FUNCTION TO OPEN MODAL INSTEAD OF ALERT
  const finishCharging = (booking: any) => {
    setBookingToPay(booking);
    setPaymentModalVisible(true);
  };

  // NEW FUNCTION TO PROCESS ACTUAL PAYMENT
  const confirmPaymentAndSave = async () => {
    if (!bookingToPay) return;

    deleteBooking(bookingToPay.id, async () => {
      const history = await loadData(STORAGE_KEYS.HISTORY) || [];
      const newHistoryRecord = {
        id: Date.now().toString(),
        stationName: bookingToPay.stationName,
        date: bookingToPay.time,
        cost: bookingToPay.totalPrice,
        usage: `${bookingToPay.duration} hr(s)` 
      };
      await saveData(STORAGE_KEYS.HISTORY, [newHistoryRecord, ...history]);

      setPaymentModalVisible(false);
      Alert.alert('Success', `Payment of RM ${bookingToPay.totalPrice} successful!`);
      fetchBookings();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.stationName}>{item.stationName}</Text>
              <Text style={styles.statusBadge}>{item.status}</Text>
            </View>
            
            <Text style={styles.detailText}>🗓️ {item.time}</Text>
            <Text style={styles.detailText}>⏱️ Duration: {item.duration} hour(s)</Text>
            <Text style={styles.priceText}>Est. Total: RM {item.totalPrice}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                <Text style={styles.editBtnText}>Edit Time</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.finishBtn} onPress={() => finishCharging(item)}>
              <Text style={styles.finishBtnText}>Finish Charging & Pay</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Active Bookings</Text>
            <Text style={styles.emptySub}>Your upcoming charging slots will appear here.</Text>
          </View>
        }
      />

      {/* EDIT TIME MODAL */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Booking</Text>
            <Text style={styles.modalSub}>Select a new time for {selectedBooking?.stationName}</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((time, index) => {
                const isSelected = newTime === time;
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
                    onPress={() => setNewTime(time)}
                  >
                    <Text style={[styles.timeText, isSelected && styles.selectedText]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveUpdatedTime}>
                <Text style={styles.modalSaveText}>Save Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NEW PAYMENT MODAL */}
      <Modal visible={isPaymentModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Details</Text>
            <Text style={styles.modalSub}>Confirm payment for {bookingToPay?.stationName}</Text>
            
            <View style={{ marginVertical: 25, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#666' }}>Total Amount</Text>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#00AB82' }}>RM {bookingToPay?.totalPrice}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPaymentModalVisible(false)}>
                <Text style={styles.modalCancelText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={confirmPaymentAndSave}>
                <Text style={styles.modalSaveText}>Confirm Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  
  // Card Styles
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#E6F4EA',
    color: '#00AB82',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00AB82',
    marginTop: 5,
    marginBottom: 15,
  },
  
  // Buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  editBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#00AB82',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  editBtnText: {
    color: '#00AB82',
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  cancelBtnText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  finishBtn: {
    backgroundColor: '#00AB82',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#888',
  },

  // Modal Styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  
  // Modal Time Grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '31%',
    paddingVertical: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#00AB82',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedText: {
    color: '#FFF',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginRight: 10,
  },
  modalCancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  modalSaveBtn: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#00AB82',
    borderRadius: 8,
    marginLeft: 10,
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default BookingScreen;