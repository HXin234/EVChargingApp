import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    const data = await AsyncStorage.getItem('history');
    if (data) setHistory(JSON.parse(data));
  };

  const clearHistory = async () => {
    await AsyncStorage.removeItem('history');
    setHistory([]);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Charging History</Text>

      <Button title="Clear History" onPress={clearHistory} />

      <FlatList
        data={history}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.name}</Text>
        )}
      />
    </View>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  item: {
    padding: 10,
    backgroundColor: '#eee',
    marginVertical: 5
  }
});