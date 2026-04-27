/**
 * ChargingStationsScreen.tsx
 * Main dashboard showing available EV stations with search and filtering.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import StationCard from '../components/StationCard';

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

// Static dataset for the application
const stationsData: Station[] = [
  {
    id: '1',
    name: 'KLCC EV Station',
    available: '2/4',
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
    available: '6/8',
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
    available: '0/5',
    type: 'Type 2 / CCS2',
    location: 'Precinct 1, Putrajaya',
    price: 'RM1.20 / kWh',
    time: '6:00AM - 12:00PM',
    rating: '4.7',
    amenities: 'Wifi · Cafe · Parking',
  },
];

const ChargingStationsScreen = () => {
  const [search, setSearch] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  /**
   * Checks if slots are available based on the "x/y" format.
   */
  const isAvailable = (available: string) => {
    const [availableSlots] = available.split('/');
    return parseInt(availableSlots) > 0;
  };

  /**
   * Filters the master list based on search text and availability switch.
   */
  const filtered = stationsData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesAvailable = showAvailableOnly ? isAvailable(item.available) : true;
    return matchesSearch && matchesAvailable;
  });

  const handleStationPress = (station: Station) => {
    console.log('Pressed:', station.name);
  };

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
        <Text style={styles.switchLabel}>Available</Text>
      </View>

      {/* Main Results List */}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stations found</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 5,
    width: 379,
    height: 40,
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
  },
});

export default ChargingStationsScreen;