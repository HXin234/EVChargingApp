/**
 * StationCard.tsx
 * UI Component for displaying summary information of a charging station.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

// Component Props definition
interface Props {
  name: string;        // Name of the station
  available: string;   // Availability status (e.g., "2/4")
  type: string;        // Charger technical type
  location: string;    // Address/Location description
  price: string;       // Cost per unit
  time: string;        // Operational hours
  rating: string;      // User rating
  amenities: string;   // Nearby facilities
  onPress: () => void; // Click callback function
}

const StationCard: React.FC<Props> = ({
  name,
  available,
  type,
  location,
  price,
  time,
  rating,
  amenities,
  onPress,
}) => {
  // Parse availability string to check if slots are free
  const [availableSlots, totalSlots] = available.split('/');
  const hasAvailable = parseInt(availableSlots) > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      
      {/* Top Right: Status Badge for availability */}
      <View style={styles.topRightContainer}>
        <Text style={styles.availableLabel}>Available Charger</Text>
        
        <View style={styles.availableCountContainer}>
          {/* Dynamic color based on availability (Green for yes, Red for no) */}
          <Text style={[styles.availableCount, !hasAvailable && styles.availableCountRed]}>
            {availableSlots}
          </Text>
          <Text style={styles.availableTotal}>/{totalSlots}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        
        {/* Left Section: Station Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/ev.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Right Section: Details (Title, Amenities, Stats) */}
        <View style={styles.textContent}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.amenities}>{amenities}</Text>
          
          <View style={styles.row}>
            <FontAwesome5 name="star" size={12} color="#FFD700" solid />
            <Text style={styles.rating}> {rating}</Text>
          </View>
          
          <View style={styles.row}>
            <FontAwesome5 name="map-marker-alt" size={12} color="#777777" />
            <Text style={styles.location}> {location}</Text>
          </View>
          
          <View style={styles.row}>
            <FontAwesome5 name="clock" size={12} color="#777777" />
            <Text style={styles.time}> {time}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Right: Charger Specs and Price */}
      <View style={styles.bottomRightContainer}>
        <View style={styles.dashedBox}>
          <Text style={styles.chargerType}>{type}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>{price.split(' ')[0]}</Text>
            <Text style={styles.priceUnit}> / {price.split(' ')[2]}</Text>
          </View>
        </View>
      </View>
      
    </TouchableOpacity>
  );
};

export default StationCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginBottom: 15,
    marginHorizontal: -2,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: 'relative',
  },
  topRightContainer: {
    position: 'absolute',
    top: 12,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  availableLabel: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  availableCountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  availableCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00AB82',
  },
  availableCountRed: {
    color: '#E74C3C',
  },
  availableTotal: {
    fontSize: 14,
    color: '#777777',
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 16,
  },
  imageContainer: {
    marginRight: 16,
    width: 80,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    marginTop: 20,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  amenities: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 6,
    opacity: 0.46,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    fontSize: 12,
    color: '#333333',
  },
  location: {
    fontSize: 11,
    color: '#000000',
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: '#000000',
  },
  bottomRightContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    zIndex: 1,
  },
  dashedBox: {
    width: 100,
    height: 51,
    borderWidth: 1,
    borderColor: '#FAB70C',
    borderRadius: 0,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  chargerType: {
    fontSize: 13,
    color: '#000000',
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00AB82',
  },
  priceUnit: {
    fontSize: 12,
    color: '#0C2964',
  },
});