import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';

const MakeBookingScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const station = route?.params?.station || { name: 'Unknown Station', price: 'RM0.00 / kWh' };

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(1); 
  const [availableDates, setAvailableDates] = useState<{fullDate: string, displayDay: string, displayDate: string}[]>([]);

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  useEffect(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        fullDate: d.toLocaleDateString(),
        displayDay: d.toLocaleDateString('en-US', { weekday: 'short' }), 
        displayDate: d.getDate().toString(), 
      });
    }
    setAvailableDates(dates);
    setSelectedDate(dates[0].fullDate); 
  }, []);

  const getNumericRate = (priceString: string) => {
    if (!priceString) return 0;
    const numericPart = priceString.replace(/[^\d.]/g, ''); 
    return parseFloat(numericPart) || 0;
  };

  // --- NEW LOGICAL PRICE CALCULATION ---
  const ASSUMED_POWER_KW = 22; // Assuming a 22kW AC Charger
  const ratePerKwh = getNumericRate(station.price);
  
  // Energy (kWh) = Power (kW) * Time (hours)
  const estimatedEnergyKwh = duration * ASSUMED_POWER_KW; 
  
  // Total Price = Energy (kWh) * Rate (RM/kWh)
  const totalPrice = (estimatedEnergyKwh * ratePerKwh).toFixed(2);

  const handleConfirm = async () => {
    if (!selectedTime) {
      Alert.alert('Selection Required', 'Please select a time slot.');
      return;
    }

    const newBooking = {
      id: Date.now().toString(),
      stationName: station.name,
      time: `${selectedDate} at ${selectedTime}`,
      duration: duration.toString(),
      totalPrice: totalPrice,
      status: 'Upcoming'
    };

    const existing = await loadData(STORAGE_KEYS.BOOKINGS);
    const updated = [...existing, newBooking];
    await saveData(STORAGE_KEYS.BOOKINGS, updated);

    try {
      await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        body: JSON.stringify(newBooking),
        headers: { 'Content-type': 'application/json' },
      });
    } catch (e) { 
      console.log("Cloud sync error", e); 
    }

    Alert.alert('Success', 'Booking confirmed!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{station.name}</Text>
        <Text style={styles.rateText}>Rate: {station.price}</Text>

        {/* --- DATE SELECTOR --- */}
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

        {/* --- TIME SLOT SELECTOR --- */}
        <Text style={styles.sectionLabel}>Select Time Slot</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time, index) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity 
                key={index} 
                style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[styles.timeText, isSelected && styles.selectedText]}>{time}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* --- DURATION SELECTOR --- */}
        <Text style={styles.sectionLabel}>Charging Duration (Hours)</Text>
        <View style={styles.durationContainer}>
          <TouchableOpacity 
            style={styles.durationBtn} 
            onPress={() => setDuration(prev => Math.max(1, prev - 1))}
          >
            <Text style={styles.durationBtnText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.durationValue}>{duration} hr{duration > 1 ? 's' : ''}</Text>
          
          <TouchableOpacity 
            style={styles.durationBtn} 
            onPress={() => setDuration(prev => Math.min(12, prev + 1))}
          >
            <Text style={styles.durationBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* --- UPDATED LOGICAL SUMMARY --- */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Est. Energy ({ASSUMED_POWER_KW}kW x {duration}h):</Text>
            <Text style={styles.summaryValue}>{estimatedEnergyKwh} kWh</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Total Estimated Price:</Text>
            <Text style={styles.priceText}>RM {totalPrice}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Confirm Booking</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  rateText: { fontSize: 16, color: '#28A745', marginBottom: 20, marginTop: 5, fontWeight: 'bold' },
  sectionLabel: { fontSize: 18, fontWeight: '600', marginTop: 15, marginBottom: 10, color: '#333' },
  
  // Date Styles
  dateScroll: { flexDirection: 'row', marginBottom: 10 },
  dateCard: { padding: 15, borderRadius: 10, backgroundColor: '#F0F0F0', marginRight: 10, alignItems: 'center', width: 70 },
  selectedDateCard: { backgroundColor: '#00AB82' },
  dateDay: { fontSize: 14, color: '#666' },
  dateNum: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 5 },
  
  // Time Styles
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timeSlot: { width: '31%', paddingVertical: 12, backgroundColor: '#F0F0F0', borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  selectedTimeSlot: { backgroundColor: '#00AB82' },
  timeText: { fontSize: 14, color: '#333', fontWeight: '500' },
  
  // Duration Styles
  durationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  durationBtn: { backgroundColor: '#00AB82', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  durationBtnText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  durationValue: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 30, color: '#333' },

  // Summary Box Styles
  selectedText: { color: '#FFF' }, 
  summaryBox: { backgroundColor: '#F9F9F9', padding: 20, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  summaryText: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },
  priceText: { fontSize: 22, fontWeight: 'bold', color: '#00AB82' },
  
  confirmBtn: { backgroundColor: '#00AB82', padding: 18, borderRadius: 10, marginTop: 30, marginBottom: 40, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default MakeBookingScreen;