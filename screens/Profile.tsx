import { View,TouchableOpacity ,Text , Button, Image, StyleSheet, TextInput } from 'react-native'
import React,{ useState } from 'react'
import { NavigationProp } from '@react-navigation/native'
import { FIREBASE_DB } from '../FirebaseConfig';
import { getAuth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import { ref, uploadBytes } from "firebase/storage";
import { FIREBASE_ST } from '../FirebaseConfig';
import * as ImagePicker from 'expo-image-picker';
interface RouterProps{
  navigation:NavigationProp<any,any>;
}
export default function Home({navigation}:RouterProps){

    const roomatesLogo = require("../assets/RoommatesLogo.png")
    const profileIcon = require('../assets/ProfileIcon.png')

    const [image, setImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const currentUser = getAuth();
    const currentUserId = currentUser.currentUser?.uid;
    const [pickedName,setName] = useState('');
    const pickImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    };
    const uploadImage = async () => {
      if (!image) return;
      setUploading(true);
      const storageRef = ref(FIREBASE_ST, currentUserId+'.png');
        const response = await fetch(image);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
      setUploading(false);
      setImage("")
    };
  if (pickedName && currentUserId) {
    setDoc(doc(FIREBASE_DB, "users", currentUserId), {
      name: pickedName,
      profileimg: currentUserId + '.png',
    });
  }
    
  return (
  <View style={{height:'100%', backgroundColor:'#2E86C1'}}> 
    <TouchableOpacity onPress={()=> navigation.navigate('Home')}><Image source={require("../assets/BackIcon.png")} style={{height:40, width:40,top:85,left:25}}/></TouchableOpacity>
    <Image source={roomatesLogo} style={{height:100, width:250, top:20, alignSelf:'center'}}/>
    <TouchableOpacity onPress={()=> navigation.navigate('Home')}><Image source={profileIcon} style={{height:100, width:100,alignSelf:'center',top:50}}/></TouchableOpacity>

    <Text style={{height:30,width:150,alignSelf:'center',top:120}}>Name</Text>
    <TextInput value={pickedName} onChangeText={(text)=>setName(text)} style={{height:30,width:150, borderWidth:1,borderColor:'black',borderRadius:5,alignSelf:'center',top:110}}></TextInput>
    <Button title="Pick an Image" onPress={pickImage} />
      {uploading && <Text>Uploading...</Text>}
      {image && <Button title="Save Info" onPress={uploadImage} />}
  </View>
  )
}