import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { getAuth } from 'firebase/auth';
import { FIREBASE_DB, FIREBASE_ST } from '../FirebaseConfig';
import { getDownloadURL, ref } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';

interface Member {
  id: string;
  name: string;
  url: string
}

export default function Roommates() {
  const [memberImages, setMemberImages] = useState<Member[]>([]);
  const currentUserId = getAuth().currentUser?.uid;

  useEffect(() => {
    const fetchMemberImages = async () => {
      if (currentUserId) {
        try {
          const userSnap = await getDoc(doc(FIREBASE_DB, 'users', currentUserId));
          const userData = userSnap.data();
          if (userData?.groupName) {
            const groupSnap = await getDoc(doc(FIREBASE_DB, 'groups', userData.groupName[0]));
            const groupData = groupSnap.data();
            const members = groupData?.members ?? [];

            const images = await Promise.all(
              members.map(async (memberId: string) => {
                const memberSnap = await getDoc(doc(FIREBASE_DB, 'users', memberId));
                const memberData = memberSnap.data();
                const photoURL = memberId + '.png';
                const url = await getDownloadURL(ref(FIREBASE_ST, photoURL));
                return { id: memberId, name: memberData?.name, url };
              })
            );

            // Reorder array to move current user's image to the front
            const currentUserIndex = images.findIndex((member) => member.id === currentUserId);
            if (currentUserIndex !== -1) {
              const currentUserImage = images[currentUserIndex];
              images.splice(currentUserIndex, 1);
              images.unshift(currentUserImage);
            }

            setMemberImages(images);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchMemberImages();
    return () => {
      // Clean up function if needed
    };
  }, []);

  return (
    <View>
      {memberImages.length > 0 ? (
        memberImages.map((member, index) => (
          <View key={index}>
            <Text>{member.id === currentUserId ? 'Your Profile' : member.name}</Text>
            <Image source={{ uri: member.url }} style={{ height: 150, width: 150, borderRadius: 100 }} />
          </View>
        ))
      ) : (
        <Text>Loading images...</Text>
      )}
    </View>
  );
}
