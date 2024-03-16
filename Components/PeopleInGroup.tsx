import { View, Text, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { FIREBASE_DB, FIREBASE_ST } from '../FirebaseConfig';
import { getBlob,getDownloadURL, ref } from 'firebase/storage';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, FieldValue, arrayUnion } from "firebase/firestore"; 

const PeopleInGroup = async () => {
    const [userGroupName,setUserGroupName] = useState();
    const [members,setMembers] = useState();
    const currentUserId = getAuth().currentUser?.uid;
    if(currentUserId){
        const userSnap = await getDoc(doc(FIREBASE_DB, "users", currentUserId));
        const userData = userSnap.data(); //get data from group
        if(userData){
            console.log("user group name:",userData.groupName);
            setUserGroupName(userData.groupName);
            };
        if(userGroupName){
            const groupRef = doc(FIREBASE_DB, "groups", userGroupName);
        
                const groupSnap = await getDoc(groupRef);
        
                if (!groupSnap.exists()) {
                console.log("Group doesn't exist!");
                return; // Exit if group doesn't exist
                }
        
                const groupData = groupSnap.data(); //get data from group
                setMembers(groupData.members);
                
        };
    };



  return (
    <>
    <Text>Hello</Text>
    </>
  )
}

export default PeopleInGroup