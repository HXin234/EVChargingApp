/**
 * AppNavigator.tsx
 * The root navigator of the application.
 * Manages the transition between Auth screens and the Main application flow (Tabs/Drawer).
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import ChargingStationsScreen from '../screens/ChargingStationsScreen';
import LoginScreen from '../screens/LoginScreen';
import AccountScreen from '../screens/AccountScreen';
import BookingScreen from '../screens/BookingScreen';
import HistoryScreen from '../screens/HistoryScreen';        
import DrawerContent from '../components/DrawerContent';    

// Color configuration for the navigation theme
const COLORS = {
  primary: '#00AB82',
  variant: '#B6E1C7',
  secondary: '#07775C',
  white: '#FFFFFF',
  text: '#333333',
  gray: '#777777',
  lightGray: '#F5F5F5',
};

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

/**
 * Custom Header Component
 * Displays a common header with a side-menu (Drawer) trigger and a title.
 */
function CustomHeader({ navigation, title }: any) {
  return (
    <View style={{
      height: 80,
      backgroundColor: COLORS.white,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    }}>
      {/* Drawer menu button */}
      <TouchableOpacity 
        onPress={() => navigation.openDrawer()} 
        style={{ 
          position: 'absolute', 
          left: 25,
          top: '50%',
          marginTop: -10,
          padding: 8,
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <FontAwesome5 name="bars" size={20} color={COLORS.text} />
      </TouchableOpacity>
      
      {/* Centered screen title */}
      <Text style={{
        fontFamily: 'Poppins-Bold',
        fontSize: 25,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginTop: 19,
      }}>
        {title}
      </Text>
    </View>
  );
}

/**
 * Bottom Tab Navigator
 * Defines the primary navigation tabs at the bottom of the screen.
 */
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.variant,
        tabBarIcon: ({ focused, color }) => {
          const iconSize = 24;
          let iconName = '';

          // Determine icon based on the route name
          if (route.name === 'Stations') {
            iconName = 'home';
          } else if (route.name === 'My Booking') {
            iconName = 'calendar-check';
          } else if (route.name === 'Account') {
            iconName = 'user-circle';
          }

          return <FontAwesome5 name={iconName} size={iconSize} color={color} solid={focused} />;
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          height: 97,
          paddingBottom: 20,
          paddingTop: 16,
          paddingHorizontal: 24,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
      })}
    >
      <Tab.Screen 
        name="Stations" 
        component={ChargingStationsScreen} 
        options={{
          headerShown: true,
          header: ({ navigation }) => <CustomHeader navigation={navigation} title="Charging Stations" />,
        }}
      />
      <Tab.Screen 
        name="My Booking" 
        component={BookingScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <CustomHeader navigation={navigation} title="My Booking" />,
        }}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <CustomHeader navigation={navigation} title="Account" />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Drawer Navigator
 * Wraps the TabNavigator and adds side-menu screens like History.
 */
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ headerShown: false, title: 'Home' }}
      />
      
      <Drawer.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <CustomHeader navigation={navigation} title="Charging History" />,
        }}
      />
      
      <Drawer.Screen 
        name="Booking" 
        component={BookingScreen}
        options={{
          headerShown: true,
          header: ({ navigation }) => <CustomHeader navigation={navigation} title="My Booking" />,
        }}
      />
    </Drawer.Navigator>
  );
}

/**
 * AppNavigator (Main Export)
 * Checks authentication status and decides which stack to show initially.
 */
export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login session from AsyncStorage on startup
  useEffect(() => {
    const checkLogin = async () => {
      const user = await AsyncStorage.getItem('user');
      setIsLoggedIn(!!user);
      setIsLoading(false);
    };
    checkLogin();
  }, []);

  // Display loading indicator while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={DrawerNavigator} />
        {!isLoggedIn && <Stack.Screen name="Login" component={LoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}