import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, Animated, StyleSheet } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { FIREBASE_AUTH } from '../FirebaseConfig';
import Tasks from '../Components/Tasks';
import TestTasks from '../Components/TestTasks';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

export default function Home({ navigation }: RouterProps) {
  const roomatesLogo = require("../assets/RoommatesLogo.png");
  const hamburgerIcon = require("../assets/Hamburger_icon.svg.png");
  const ProfileIcon = require('../assets/ProfileIcon.png');

  const [isOpen, setIsOpen] = useState(false);
  const slideAnimation = useRef(new Animated.Value(-300)).current;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    Animated.timing(slideAnimation, {
      toValue: isOpen ? -300 : 0, // Slide out if open, slide in if closed
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeDropdown = () => {
    setIsOpen(false);
    Animated.timing(slideAnimation, {
      toValue: -300,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={{ height: '100%', backgroundColor: '#2E86C1' }}>
      <TouchableOpacity onPress={toggleDropdown}>
        <Image source={hamburgerIcon} style={{ height: 40, width: 30, top: 85, left: 25 }} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <Image source={ProfileIcon} style={{ height: 40, width: 40, top: 40, left: 335 }} />
      </TouchableOpacity>

      <Image source={roomatesLogo} style={{ height: 100, width: 250, top: -20, alignSelf: 'center' }} />
      {/* <Tasks/> */}
      <TestTasks/>
      <Animated.View style={[styles.dropdownContainer, { left: slideAnimation }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Roommates')}>
          <Text style={styles.dropdownItem}>Roommates</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Group')}>
          <Text style={styles.dropdownItem}>Group</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Messaging')}>
          <Text style={styles.dropdownItem}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => FIREBASE_AUTH.signOut()}>
          <Text style={styles.dropdownItem}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {isOpen && (
        <TouchableOpacity style={styles.overlay} onPress={closeDropdown} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'white',
    paddingTop: 50,
    paddingLeft: 20,
    zIndex: 1,
  },
  dropdownItem: {
    fontSize: 18,
    marginBottom: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 0,
  },
});
