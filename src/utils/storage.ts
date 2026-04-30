import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  BOOKINGS: '@bookings_list',
  HISTORY: '@charging_history',
};

// Reusable function to save data locally
export const saveData = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error saving data", e);
  }
};

// Reusable function to load data locally
export const loadData = async (key: string) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error loading data", e);
    return [];
  }
};