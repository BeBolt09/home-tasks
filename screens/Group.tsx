import { View, Text, TextInput, Button, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';

import { FIREBASE_DB } from '../FirebaseConfig';
import { getAuth } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, FieldValue, arrayUnion } from "firebase/firestore"; 



const Group = () => {
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const handleCreate = () => {
    setCreating(true);
    setJoining(false); // Reset joining state when creating starts
  };
  const handleJoin = () => {
    setJoining(true);
    setCreating(false); // Reset creating state when joining starts
  };

  const currentUserId = getAuth().currentUser?.uid;
  const [groupName,setGroupName] = useState('')
  const [groupPassword,setGroupPassword] = useState('')

  const createGroup = async () => {
    const docRef = doc(FIREBASE_DB, "groups", groupName);
    try {
      const docSnap = await getDoc(docRef);// Check if a group with the same name already exists
      if (docSnap.exists()) {
        console.log("Group name already exists, cannot create");
        return; // Skip group creation
      }
      await setDoc(docRef, { // Create the group if it doesn't exist
        password: groupPassword,
        members: [currentUserId],
        createdAt: serverTimestamp(),
      });
      console.log("Group created successfully!");
      if (currentUserId){
        await updateDoc(doc(FIREBASE_DB, "users" ,currentUserId),{
          groupName:[groupName],
        })
      };
    } catch (error) {
      console.error("Error creating group:", error);// Handle any errors during group creation
    }
  };
  const joinGroup = async () => {
    const groupRef = doc(FIREBASE_DB, "groups", groupName);
  
    try {
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        console.log("Group doesn't exist!");
        return; // Exit if group doesn't exist
      }

      const groupData = groupSnap.data(); //get data from group
  
      // Verify password before adding user to members list
      if (groupData.password === groupPassword) {
        await updateDoc(groupRef, {
          members: arrayUnion(currentUserId),
        });
        console.log("Successfully joined the group!");
        if (currentUserId){
          await updateDoc(doc(FIREBASE_DB, "users" ,currentUserId),{
            groupName:[groupName],
          })
        };
      } else {
        console.log("Incorrect password!");
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  return (
    <View>
      <Button title="Create Group" onPress={handleCreate} />
      <Button title="Join Group" onPress={handleJoin} />

      {/* Conditionally render elements based on states */}
      {creating && (
        <View>
          <TextInput value={groupName} onChangeText={(text)=>setGroupName(text)} placeholder="Enter group name" style={{borderWidth:1,alignSelf:'center',padding:6}}/>
          <TextInput value={groupPassword} onChangeText={(text)=>setGroupPassword(text)} placeholder="Joining Password" style={{borderWidth:1,alignSelf:'center',padding:6,top:10}}/>
          <Button title="Confirm" onPress={createGroup}/>
        </View>
      )}

      {joining && (
        <View>
          <TextInput value={groupName} onChangeText={(text)=>setGroupName(text)} placeholder="Enter group name" style={{borderWidth:1,alignSelf:'center',padding:6}}/>
          <TextInput value={groupPassword} onChangeText={(text)=>setGroupPassword(text)} placeholder="Joining Password" style={{borderWidth:1,alignSelf:'center',padding:6,top:10}}/>
          {/* ...other elements as needed */}
          <Button title="Join" onPress={joinGroup}/>
        </View>
      )}
    </View>
  );
};

export default Group;
