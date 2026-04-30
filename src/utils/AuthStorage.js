// AuthStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save user session (Called after Huixin's Login/Register screen)
export const saveUserSession = async (userData) => {
  try {
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem('@user_session', jsonValue);
    console.log('User session saved successfully.');
  } catch (e) {
    console.error('Failed to save user session.', e);
  }
};

// Read user session (Used to check if user is already logged in)
export const getUserSession = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@user_session');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to fetch user session.', e);
    return null;
  }
};

// Delete user session (Called on Logout)
export const clearUserSession = async () => {
  try {
    await AsyncStorage.removeItem('@user_session');
    console.log('User logged out.');
  } catch (e) {
    console.error('Failed to clear session.', e);
  }
};