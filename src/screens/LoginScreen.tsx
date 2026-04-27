/**
 * LoginScreen.tsx
 * Authentication screen with Login and Sign Up functionality.
 * Uses AsyncStorage for local data persistence.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { height, width } = Dimensions.get('window');

const COLORS = {
  primary: '#00AB82',
  variant: '#B6E1C7',
  secondary: '#07775C',
  white: '#FFFFFF',
  text: '#333333',
  gray: '#777777',
  lightGray: '#F5F5F5',
  border: '#E0E0E0',
};

export default function LoginScreen({ navigation }: any) {
  // State management for form data and mode toggle
  const [isLogin, setIsLogin] = useState(true);  // true: Login mode, false: Sign Up mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  /**
   * Validates and submits the auth form.
   */
  const handleSubmit = async () => {
    if (isLogin) {
      // ========== LOGIN LOGIC ==========
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      
      const found = userList.find((u: any) => u.email === email && u.password === password);
      
      if (found) {
        await AsyncStorage.setItem('user', JSON.stringify(found));
        Alert.alert('Success', 'Logged in successfully');
        navigation.replace('Main');
      } else {
        Alert.alert('Error', 'Invalid email or password');
      }
    } else {
      // ========== SIGN UP LOGIC ==========
      if (!username || !email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      
      const existing = userList.find((u: any) => u.email === email);
      if (existing) {
        Alert.alert('Error', 'Email already exists');
        return;
      }
      
      const newUser = { username, email, password };
      userList.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(userList));
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      Alert.alert('Success', 'Account created successfully');
      navigation.replace('Main');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Navigation back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Section */}
        <View style={styles.topSection}>
          <Image
            source={require('../assets/images/login.jpg')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Input Card Section */}
        <View style={styles.card}>
          
          {/* Mode Switch Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity onPress={() => setIsLogin(true)}>
              <Text style={[styles.tab, isLogin && styles.activeTab]}>
                Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(false)}>
              <Text style={[styles.tab, !isLogin && styles.activeTab]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conditional field for Username during registration */}
          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput 
                placeholder="Enter your username" 
                placeholderTextColor={COLORS.gray} 
                style={styles.input} 
                value={username} 
                onChangeText={setUsername} 
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput 
              placeholder="Enter your email" 
              placeholderTextColor={COLORS.gray} 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              autoCapitalize="none" 
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput 
              placeholder="Enter your password" 
              placeholderTextColor={COLORS.gray} 
              secureTextEntry 
              style={styles.input} 
              value={password} 
              onChangeText={setPassword} 
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>
              {isLogin ? 'Login' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerText}>
            <Text style={styles.footerTextLight}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.footerTextLink}>
                {isLogin ? 'Sign Up' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    height: height * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  image: {
    width: width * 0.7,
    height: '100%',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 32,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  tab: {
    marginHorizontal: 24,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    paddingBottom: 8,
  },
  activeTab: {
    color: COLORS.primary,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  footerText: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    paddingBottom: 30,
  },
  footerTextLight: {
    fontSize: 14,
    color: COLORS.gray,
  },
  footerTextLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});