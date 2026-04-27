/**
 * src/components/DrawerContent.tsx
 * Custom side-drawer content showing user info and navigation links.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { CommonActions, useFocusEffect } from '@react-navigation/native';

const COLORS = {
  primary: '#00AB82',
  variant: '#B6E1C7',
  secondary: '#07775C',
  white: '#FFFFFF',
  text: '#333333',
  gray: '#777777',
  lightGray: '#F5F5F5',
};

const DrawerContent = ({ navigation }: DrawerContentComponentProps) => {
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [active, setActive] = useState('MainTabs');

  /**
   * Loads user data from local storage to sync UI with login state.
   */
  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsLoggedIn(true);
    } else {
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUser();
  }, []);

  // Refresh user data every time the drawer is focused
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
      return () => {};
    }, [])
  );

  const handleLogin = () => {
    navigation.closeDrawer();
    navigation.navigate('Login');
  };

  /**
   * Clears user session and resets the navigation stack.
   */
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          setUser(null);
          setIsLoggedIn(false);
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        },
      },
    ]);
  };

  /**
   * Navigation handler for drawer items, handles nested navigation.
   */
  const handleNavigation = (screenName: string) => {
    navigation.closeDrawer();
    
    if (screenName === 'Booking') {
      navigation.navigate('MainTabs', {
        screen: 'My Booking',
      });
    } else if (screenName === 'History') {
      navigation.navigate('History');
    } else if (screenName === 'MainTabs') {
      navigation.navigate('MainTabs');
    }
  };

  /**
   * Renders a clickable menu item with an icon and label.
   */
  const renderItem = (name: string, icon: string, label: string) => {
    const isActive = active === name;

    return (
      <TouchableOpacity
        style={[styles.menuItem, isActive && styles.activeItem]}
        onPress={() => {
          setActive(name);
          handleNavigation(name);
        }}
      >
        <FontAwesome5
          name={icon}
          size={18}
          color={isActive ? COLORS.primary : COLORS.variant}
        />
        <Text style={[styles.menuText, isActive && styles.activeText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Top Section: User Avatar and Credentials */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {isLoggedIn ? '🧑' : '👤'}
          </Text>
        </View>

        {isLoggedIn && user ? (
          <>
            <Text style={styles.userName}>{user.username}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={14} color={COLORS.primary} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.userName}>Guest</Text>
            <Text style={styles.userEmail}>Please login to access more features</Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <FontAwesome5 name="sign-in-alt" size={14} color={COLORS.white} />
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Navigation Menu Section */}
      <View style={styles.menuSection}>
        {renderItem('MainTabs', 'home', 'Home')}
        {renderItem('History', 'history', 'Charging History')}
        {renderItem('Booking', 'calendar-check', 'Booking')}
      </View>
    </View>
  );
};

export default DrawerContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  userSection: {
    backgroundColor: COLORS.secondary,
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  avatar: {
    fontSize: 36,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
    elevation: 3,
  },
  loginText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
    elevation: 3,
  },
  logoutText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  menuSection: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeItem: {
    backgroundColor: COLORS.lightGray,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.variant,
    marginLeft: 16,
  },
  activeText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});