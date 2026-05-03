/**
 * ChargingStationsScreen.tsx
 * Main dashboard showing available EV stations with search and filtering.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import StationCard from '../components/StationCard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAllBookings } from '../utils/ApiService';

const COLORS = {
  primary: '#00AB82',
  variant: '#B6E1C7',
  secondary: '#07775C',
  white: '#FFFFFF',
  text: '#333333',
  gray: '#777777',
  lightGray: '#F5F5F5',
  border: '#C4C4C4',
};

// Interface defining the station object structure
interface Station {
  id: string;
  name: string;
  available: string;    // "count/total"
  type: string;
  location: string;
  price: string;
  time: string;
  rating: string;
  amenities: string;
}

// Base station data (without availability - will be calculated dynamically)
const baseStationsData: Omit<Station, 'available'>[] = [
  {
    id: '1',
    name: 'KLCC EV Station',
    type: 'Type 2 / CCS2',
    location: 'Level 2, KLCC Parking',
    price: 'RM1.20 / kWh',
    time: '8:00AM - 10:00PM',
    rating: '4.5',
    amenities: 'Wifi · Cafe · Restaurant',
  },
  {
    id: '2',
    name: 'Cyberjaya EV Point',
    type: 'CCS2',
    location: 'Cyberjaya City Centre',
    price: 'RM1.10 / kWh',
    time: '8:00AM - 10:00PM',
    rating: '4.4',
    amenities: 'Wifi · Cafe · Gym',
  },
  {
    id: '3',
    name: 'Putrajaya EV Hub',
    type: 'Type 2 / CCS2',
    location: 'Precinct 1, Putrajaya',
    price: 'RM1.20 / kWh',
    time: '6:00AM - 12:00PM',
    rating: '4.7',
    amenities: 'Wifi · Cafe · Parking',
  },
];

// Default availability for offline/fallback
const defaultAvailability: Record<string, string> = {
  '1': '2/4',
  '2': '6/8',
  '3': '0/5',
};

// Station totals (maximum slots per station)
const STATION_TOTALS: Record<string, number> = {
  '1': 4,  // KLCC EV Station
  '2': 8,  // Cyberjaya EV Point
  '3': 5,  // Putrajaya EV Hub
};

const ChargingStationsScreen = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Get station ID by name
   */
  const getStationIdByName = (name: string): string => {
    if (name === 'KLCC EV Station') return '1';
    if (name === 'Cyberjaya EV Point') return '2';
    if (name === 'Putrajaya EV Hub') return '3';
    return '';
  };

  /**
   * Get current logged-in user
   */
  const getCurrentUser = async () => {
    const userData =
      (await AsyncStorage.getItem('user')) ||
      (await AsyncStorage.getItem('@user_session'));
    return userData ? JSON.parse(userData) : null;
  };

  /**
   * Load charging stations with current availability
   */
  const loadStations = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      // Get the current user
      const userData = await getCurrentUser();
      const userEmail = userData?.email || '';

      // Initialize booking counts
      const bookingCounts: Record<string, number> = {
        '1': 0,
        '2': 0,
        '3': 0,
      };

      // Fetch user's active bookings from cloud (if logged in)
      if (userEmail) {
        try {
          const userBookings = await getAllBookings(userEmail);

          const today = new Date().toLocaleDateString('en-US');

          // Count active bookings for each station
          userBookings.forEach((booking: any) => {
          if (booking.status === 'Upcoming' && booking.date === today) {
            const stationId = getStationIdByName(booking.stationName);
            if (stationId) {
              bookingCounts[stationId]++;
            }
          }
        });
      } catch (error) {
        console.log('Could not fetch bookings from cloud');
      }
    }

      // Build stations with calculated availability
      const stationsWithAvailability = baseStationsData.map((baseStation) => {
        const totalSlots = STATION_TOTALS[baseStation.id];
        const bookedCount = bookingCounts[baseStation.id];
        let availableSlots = totalSlots - bookedCount;

        // For Putrajaya (id:3), if no bookings, show 0 for demo
        if (baseStation.id === '3' && bookedCount === 0 && !userEmail) {
          availableSlots = 0;
        }

        availableSlots = Math.max(0, availableSlots);

        return {
          ...baseStation,
          available: `${availableSlots}/${totalSlots}`,
        };
      });

      setStations(stationsWithAvailability);
    } catch (error) {
      console.error('Failed to load stations:', error);
      // Fallback to default data
      const fallbackStations = baseStationsData.map((baseStation) => ({
        ...baseStation,
        available: defaultAvailability[baseStation.id],
      }));
      setStations(fallbackStations);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  /**
   * Load user data
   */
  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  /**
   * Refresh station availability (used after booking)
   */
  const refreshAvailability = useCallback(async () => {
    await loadStations(false);
  }, []);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadStations(true);
      return () => {};
    }, [])
  );

  /**
   * Checks if slots are available based on the "x/y" format.
   */
  const isAvailable = (available: string) => {
    const [availableSlots] = available.split('/');
    return parseInt(availableSlots) > 0;
  };

  /**
   * Filters the station list based on search text and availability switch.
   * NOW using dynamic 'stations' state instead of static 'stationsData'
   */
  const filtered = stations.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesAvailable = showAvailableOnly ? isAvailable(item.available) : true;
    return matchesSearch && matchesAvailable;
  });

  /**
   * Handle station press
   */
  const handleStationPress = async (station: Station) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      Alert.alert(
        "Login Required",
        "Please login or sign up to view details and make a booking.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    const availableCount = parseInt(station.available.split('/')[0]);

    if (availableCount === 0) {
      Alert.alert(
        "Station Full",
        "Sorry, there are no available charging slots at this station right now. Please choose another station.",
        [{ text: "OK", style: "cancel" }]
      );
    } else {
      navigation.navigate('MakeBookingScreen', { station: station });
    }
  };

  // Show loading indicator
  if (isLoading && stations.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading stations...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Search Section */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search station..."
          placeholderTextColor={COLORS.gray}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        <Icon name="search" size={16} color={COLORS.gray} style={styles.searchIcon} />
      </View>

      {/* Filter Switch Area */}
      <View style={styles.switchContainer}>
        <Switch
          value={showAvailableOnly}
          onValueChange={setShowAvailableOnly}
          trackColor={{ false: COLORS.variant, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
        <Text style={styles.switchLabel}>Show available only</Text>
      </View>

      {/* Main Results List - using dynamic 'stations' data */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StationCard
            name={item.name}
            available={item.available}
            type={item.type}
            location={item.location}
            price={item.price}
            time={item.time}
            rating={item.rating}
            amenities={item.amenities}
            onPress={() => handleStationPress(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={refreshAvailability}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {search || showAvailableOnly
                ? 'No stations match your criteria'
                : 'No stations available'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 5,
    marginHorizontal: 16,
    marginTop: 25,
    marginBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    paddingVertical: 0,
  },
  searchIcon: {
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ChargingStationsScreen;