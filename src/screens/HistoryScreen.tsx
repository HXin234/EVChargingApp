import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';

const HistoryScreen = () => {
  const isFocused = useIsFocused();
  const [history, setHistory] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (isFocused) {
      fetchHistory();
    }
  }, [isFocused]);

  const getCurrentUserEmail = async () => {
    const userData =
      (await AsyncStorage.getItem('user')) ||
      (await AsyncStorage.getItem('@user_session'));

    if (!userData) return '';

    try {
      const user = JSON.parse(userData);
      return user?.email || '';
    } catch (e) {
      return '';
    }
  };

  const getUserHistoryKey = (email: string) => `${STORAGE_KEYS.HISTORY}_${email}`;

  const fetchHistory = async () => {
    const email = await getCurrentUserEmail();
    setUserEmail(email);

    if (!email) {
      setHistory([]);
      return;
    }

    const data = await loadData(getUserHistoryKey(email));
    setHistory(data || []);
  };

  const deleteRecord = (id: string) => {
    if (!userEmail) return;

    Alert.alert('Remove Record', 'Do you want to clear this record from your history?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: async () => {
          const updatedHistory = history.filter(item => item.id !== id);
          setHistory(updatedHistory);
          await saveData(getUserHistoryKey(userEmail), updatedHistory);
        }
      }
    ]);
  };

  const clearAllHistory = () => {
    if (!userEmail || history.length === 0) return;

    Alert.alert('Clear All History', 'Are you sure you want to delete all past charging records?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Clear All', 
        style: 'destructive',
        onPress: async () => {
          setHistory([]);
          await saveData(getUserHistoryKey(userEmail), []);
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Charging History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearAllHistory}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const hours = parseFloat(item.usage) || 1;
          const estimatedKwh = hours * 22;
          const totalCost = parseFloat(item.cost) || 0;
          const ratePerKwh = estimatedKwh > 0 ? (totalCost / estimatedKwh).toFixed(2) : '0.00';

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.stationName}>{item.stationName}</Text>
                <TouchableOpacity onPress={() => deleteRecord(item.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date & Time:</Text>
                <Text style={styles.receiptValue}>{item.date}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Usage:</Text>
                <Text style={styles.receiptValue}>{item.usage}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Cost:</Text>
                <Text style={styles.receiptValueCost}>RM {item.cost}</Text>
              </View>

              <View style={styles.calculationBox}>
                <Text style={styles.calcTitle}>Calculation Breakdown:</Text>
                <Text style={styles.calcText}>
                  • Power Consumed: {hours} hr × 22 kW = {estimatedKwh} kWh
                </Text>
                <Text style={styles.calcText}>
                  • Rate applied: RM {ratePerKwh} / kWh
                </Text>
                <Text style={styles.calcMath}>
                  {estimatedKwh} kWh × RM {ratePerKwh} = RM {item.cost}
                </Text>
              </View>

            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{userEmail ? 'No Past Records' : 'Login Required'}</Text>
            <Text style={styles.emptySub}>{userEmail ? 'Your completed charging sessions will appear here.' : 'Please login to view your charging history.'}</Text>
          </View>
        }
      />
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

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  clearAllText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },

  // Card Styles
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#00AB82',
    flex: 1,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 10,
  },

  // Receipt Rows
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  receiptValueCost: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },

  // Calculation Box
  calculationBox: {
    backgroundColor: '#F0FDF8',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#BFF0DF',
  },
  calcTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#007A5A',
    marginBottom: 4,
  },
  calcText: {
    fontSize: 12,
    color: '#007A5A',
    marginBottom: 2,
  },
  calcMath: {
    fontSize: 13,
    color: '#007A5A',
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'right',
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
});

export default HistoryScreen;