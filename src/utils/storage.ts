import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  BOOKINGS: '@bookings_key',
  HISTORY: '@history_key',
};

// Save data permanently to the phone
export const saveData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error saving data: ', e);
  }
};

// Load data permanently from the phone
export const loadData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error loading data: ', e);
    return null;
  }
};