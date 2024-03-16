import { View,Image, Text, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView } from 'react-native'
import React,{useState} from 'react'
import { FIREBASE_AUTH } from '../FirebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

const Login = () => {

  const [login,setLogin] = useState(true);
  const [seeSignup,setSignup] = useState(false);
  const showSignup = () =>{
    setLogin(false);
    setSignup(true);
  }
  const showLogin = () =>{
    setLogin(true);
    setSignup(false);
  }

  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loading,setLoading] = useState(false);
  const auth = FIREBASE_AUTH;

  const signIn = async () => {
    setLoading(true);
    try{
      const response = await signInWithEmailAndPassword(auth,email,password);
      console.log(response);
    }catch(error:any){
      console.log(error);
      alert('sign in failed:'+error.message);
    }finally{
      setLoading(false);
    }
  }

  const signUp = async () => {
    setLoading(true);
    try{
      const response = await createUserWithEmailAndPassword(auth,email,password);
      console.log(response);
      alert('check your emails');
    }catch(error:any){
      console.log(error);
      alert('sign in failed:'+error.message);
    }finally{
      setLoading(false);
    }
  }
  return (
    <View style={styles.container}>
      <Image source={require("../assets/RoommatesLogo.png")} style={{height:150, width:350, top:50, alignSelf:'center'}}/>
      {login && <Image source={require("../assets/Login.png")} style={{height:350, width:395, alignSelf:'center',left:16.4,top:50}}/>}
      {seeSignup && <Image source={require("../assets/SignUp.png")} style={{height:350, width:395, alignSelf:'center',left:16.4,top:50}}/>}
      <TouchableOpacity style={{height:90,top:-280,width:160,left:160}} onPress={showSignup}></TouchableOpacity>
      <TouchableOpacity style={{height:90,top:-370,width:160,right:20}} onPress={showLogin}></TouchableOpacity>
      <KeyboardAvoidingView behavior='padding'>
      <TextInput style={styles.input} value={email} autoCapitalize='none' placeholder='Email' onChangeText={(text)=>setEmail(text)}></TextInput>
      <TextInput secureTextEntry={true} style={styles.input} value={password} autoCapitalize='none' placeholder='Password' onChangeText={(text)=>setPassword(text)}></TextInput>
      </KeyboardAvoidingView>

      {loading ? 
      (<ActivityIndicator size="large" color="#0000ff"/> 
      ):(
        <View style={{bottom:190}}>
          {login && <TouchableOpacity onPress={signIn}>
            <Text style={{alignSelf:'center', borderWidth:1,padding:10,borderRadius:5}}>Login</Text>
          </TouchableOpacity>}

          {seeSignup && <TouchableOpacity onPress={signUp}>
            <Text style={{alignSelf:'center', borderWidth:1,padding:10,borderRadius:5}}>Create account</Text>
          </TouchableOpacity> }
        </View>
      )}
    </View>
  )
}


const styles = StyleSheet.create({
  container:{
    backgroundColor:"#2E86C1",
    padding:45,
    flex:1,
    justifyContent:'center'
  },
  input:{
    marginVertical:4,
    height:50,
    borderRadius:4,
    borderWidth:1,
    padding:10,
    backgroundColor:'white',
    bottom:300
  }
})

export default Login;