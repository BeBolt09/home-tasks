import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';

import { FIREBASE_DB } from '../FirebaseConfig';
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, arrayUnion } from "firebase/firestore"; 

const Group = () => {
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [hasGroup, setHasGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');

  useEffect(() => {
    checkUserGroup();
  }, []);

  const checkUserGroup = async () => {
    const currentUserId = getAuth().currentUser?.uid;
    if (currentUserId) {
      try {
        const userDocRef = doc(FIREBASE_DB, "users", currentUserId);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        if (userData && userData.groupName) {
          setHasGroup(true);
        } else {
          setHasGroup(false);
        }
      } catch (error) {
        console.error("Error checking user group:", error);
      }
    }
  };

  const handleCreate = () => {
    setCreating(true);
    setJoining(false);
  };

  const handleJoin = () => {
    setJoining(true);
    setCreating(false);
  };

  const handleLeave = async () => {
    const currentUserId = getAuth().currentUser?.uid;
    if (currentUserId) {
      try {
        await updateDoc(doc(FIREBASE_DB, "users", currentUserId), {
          groupName: ''
        });
        setHasGroup(false);
        console.log("Successfully left the group!");
      } catch (error) {
        console.error("Error leaving group:", error);
      }
    }
  };

  const createGroup = async () => {
    const currentUserId = getAuth().currentUser?.uid;
    if (currentUserId) {
      const docRef = doc(FIREBASE_DB, "groups", groupName);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log("Group name already exists, cannot create");
          return;
        }
        await setDoc(docRef, {
          password: groupPassword,
          members: [currentUserId],
          createdAt: serverTimestamp(),
        });
        console.log("Group created successfully!");
        await updateDoc(doc(FIREBASE_DB, "users", currentUserId), {
          groupName: [groupName],
        });
        setHasGroup(true);
      } catch (error) {
        console.error("Error creating group:", error);
      }
    }
  };

  const joinGroup = async () => {
    const currentUserId = getAuth().currentUser?.uid;
    if (currentUserId) {
      const groupRef = doc(FIREBASE_DB, "groups", groupName);
      try {
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) {
          console.log("Group doesn't exist!");
          return;
        }
        const groupData = groupSnap.data();
        if (groupData.password === groupPassword) {
          await updateDoc(groupRef, {
            members: arrayUnion(currentUserId),
          });
          console.log("Successfully joined the group!");
          await updateDoc(doc(FIREBASE_DB, "users", currentUserId), {
            groupName: [groupName],
          });
          setHasGroup(true);
        } else {
          console.log("Incorrect password!");
        }
      } catch (error) {
        console.error("Error joining group:", error);
      }
    }
  };

  const renderGroupActions = () => {
    if (hasGroup) {
      return (
        <Button title="Leave Group" onPress={handleLeave} color="#1e90ff" />
      );
    } else {
      return (
        <View>
          <Button title="Create Group" onPress={handleCreate} color="#1e90ff" />
          <Button title="Join Group" onPress={handleJoin} color="#1e90ff" />
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderGroupActions()}

      {creating && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
          />
          <TextInput
            style={styles.input}
            placeholder="Joining Password"
            value={groupPassword}
            onChangeText={setGroupPassword}
          />
          <Button title="Confirm" onPress={createGroup} color="#1e90ff" />
        </View>
      )}

      {joining && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
          />
          <TextInput
            style={styles.input}
            placeholder="Joining Password"
            value={groupPassword}
            onChangeText={setGroupPassword}
          />
          <Button title="Join" onPress={joinGroup} color="#1e90ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff', // Light blue background color
  },
  form: {
    width: '80%',
    backgroundColor: '#fff', // White background color for forms
    padding: 20,
    borderRadius: 10, // Rounded corners
    elevation: 5, // Shadow effect for Android
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1e90ff', // Blue border color
    borderRadius: 5, // Rounded corners for inputs
    padding: 10,
    marginBottom: 10,
  },
});

export default Group;
