import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { GOOGLE_API_KEY } from './Secrets';

import {
  Accuracy,
  requestForegroundPermissionsAsync,
  watchPositionAsync
} from 'expo-location';

export default function App() {

  const [ places, setPlaces ] = useState([]);

  const initRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }
  const [location, setLocation] = useState(null);
  const [ permissionsGranted, setPermissionsGranted ] = useState(false);
  const [ mapRegion, setMapRegion ] = useState(initRegion);


  let unsubscribeFromLocation = null;

  const subscribeToLocation = async () => {
    const { status } = await requestForegroundPermissionsAsync();
    setPermissionsGranted(status === 'granted');

    if (unsubscribeFromLocation) {
      unsubscribeFromLocation();
    }
    unsubscribeFromLocation = await watchPositionAsync({
      accuracy: Accuracy.Highest,
      distanceInterval: 1, // 1 meter
      timeInterval: 1000 // 1000ms = 1s
    }, location => {
      setLocation(location);
      setMapRegion({
        ...mapRegion,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      })
    });
  }

  useEffect(() => {
    subscribeToLocation();
  }, []);

  const searchLocations = async () => {
    const params = new URLSearchParams({
      location: `${location.coords.latitude},${location.coords.longitude}`,
      type: 'restaurant',
      radius: '5000', // 5KM
      key: GOOGLE_API_KEY
    });

    const placesURI = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`
    const response = await fetch(placesURI);
    const results = await response.json();
    const newPlaces = [];
    for (let r of results.results) {
      const newPlace = {};
      newPlace.latitude = r.geometry.location.lat;
      newPlace.longitude = r.geometry.location.lng;
      newPlace.name = r.name;
      newPlace.id = r.place_id;
      newPlaces.push(newPlace);
    }
    setPlaces(newPlaces);
  }


  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>
        {permissionsGranted ?
          location ?
            `lat: ${location.coords.latitude} \n` +
            `lon: ${location.coords.longitude}`
            :
            "Waiting..."
          :
          "Location permission not granted."
        }
      </Text>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        initialRegion={initRegion}
        showsUserLocation={true}
      >

        {places.map(place => {
          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude
              }}
              title={place.name}
            />
          )
        })}
      </MapView>

      <Button
        title="Search for Restaurants"
        onPress={searchLocations}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 24
  },
  map: {
    flex: 0.5,
    width: '100%',
    height: '100%'
  }
})