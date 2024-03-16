import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { FIREBASE_AUTH } from "./FirebaseConfig";
import { View,TouchableOpacity ,Text , Button, Image, StyleSheet } from 'react-native'
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./screens/Login";
import Home from "./screens/Home";
import Roommates from "./screens/Roommates";
import Profile from './screens/Profile';
import Group from './screens/Group';
import Messaging from "./screens/Messaging";
const Stack = createNativeStackNavigator();

const InsideStack = createNativeStackNavigator();
function InsideLayout()
{
  return(
    <InsideStack.Navigator>
      <InsideStack.Screen name='Home' component={Home} options={{headerShown:false}}/>
      <InsideStack.Screen name='Roommates' component={Roommates} />
      <InsideStack.Screen name='Profile' component={Profile} options={{headerShown:false}} />
      <InsideStack.Screen name='Messaging' component={Messaging} options={{headerShown:false}}/>
      <InsideStack.Screen name='Group' component={Group} />
    </InsideStack.Navigator>
  );
}
export default function App() {
  const [user,setUser] = useState<User | null>(null);
  onAuthStateChanged(FIREBASE_AUTH,(user)=>{
    console.log('user',user)
    setUser(user);
  })
  useEffect(()=>{

  },[])

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {user ? (
          <Stack.Screen name='inside' component={InsideLayout} options={{headerShown:false}}/>
        ):(
          <Stack.Screen name='Login' component={Login} options={{headerShown:false}}/>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}