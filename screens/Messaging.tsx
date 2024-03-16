import { View, Text, TextInput, Button, FlatList, KeyboardAvoidingView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { doc, setDoc, addDoc, getDoc, updateDoc, collection, serverTimestamp, query, getDocs, DocumentData, orderBy, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from '../FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { NavigationProp } from '@react-navigation/native';

interface RouterProps{
    navigation:NavigationProp<any,any>;
  }
interface Message {
    id: string;
    senderId: string;
    content: string;
}

const Messaging = ({navigation}:RouterProps) => {
    
    const currentUserId = getAuth().currentUser?.uid;
    const [groupName, setGroupName] = useState<string | undefined>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
    const [messageInput, setMessageInput] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const fetchGroupName = async () => {
            if (currentUserId) {
                const userSnap = await getDoc(doc(FIREBASE_DB, 'users', currentUserId));
                const userData = userSnap.data();
                setGroupName(userData?.groupName[0]);
            }
        };
        fetchGroupName();
    }, []);

    useEffect(() => {
        const fetchUserNames = async () => {
            const usersCollection = collection(FIREBASE_DB, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const names: { [key: string]: string } = {};
            usersSnapshot.forEach((userDoc) => {
                const userData = userDoc.data();
                names[userDoc.id] = userData.name;
            });
            setUserNames(names);
        };
        fetchUserNames();
    }, []);

    useEffect(() => {
        if (groupName && Object.keys(userNames).length > 0) {
            fetchMessages(); // Fetch messages when groupName and userNames are set
        }
    }, [groupName, userNames]); // Only run when groupName or userNames change

    const addMessage = async () => {
        if (!messageInput.trim()) {
            // Don't send empty messages
            return;
        }
        if (groupName) {
            const docRef = await addDoc(collection(FIREBASE_DB, "groups", groupName, "messages"), {
                senderId: currentUserId,
                content: messageInput.trim(),
                createdAt: serverTimestamp(),
            });
            console.log("Document written with ID: ", docRef.id);
            setMessageInput(''); // Clear the input field after sending the message
            fetchMessages();
        }
    };

    const fetchMessages = () => {
        if (groupName && Object.keys(userNames).length > 0) {
            const queryRef = query(collection(FIREBASE_DB, "groups", groupName, "messages"), orderBy("createdAt"));
    
            const unsubscribe = onSnapshot(queryRef, (querySnapshot) => {
                const messageList: Message[] = [];
                querySnapshot.forEach((doc) => {
                    const senderId = doc.data().senderId;
                    const senderName = userNames[senderId] || 'Unknown User';
                    messageList.push({
                        id: doc.id,
                        senderId,
                        content: doc.data().content
                    });
                });
                setMessages(messageList);
            });
    
            return unsubscribe; // Return unsubscribe function to detach listener when component unmounts
        }
    };

    const scrollToBottom = () => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd();
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
                    <Image source={require("../assets/BackIcon.png")} style={styles.backIcon} />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Image source={require("../assets/RoommatesLogo.png")} style={styles.logo} />
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.messageBubble, item.senderId === currentUserId ? styles.myMessageBubble : styles.otherMessageBubble]}>
                        {item.senderId !== currentUserId && (
                            <Text style={styles.senderName}>{userNames[item.senderId]}</Text>
                        )}
                        <Text style={styles.messageText}>{item.content}</Text>
                    </View>
                )}
                contentContainerStyle={styles.flatListContentContainer}
                onContentSizeChange={() => scrollToBottom()}
            />
            <KeyboardAvoidingView style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type your message here"
                    value={messageInput}
                    onChangeText={setMessageInput}
                />
                <TouchableOpacity style={styles.sendButton} onPress={addMessage}>
                    <Image source={require('../assets/sendMessage.png')} style={styles.sendIcon} />
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop:60,
        padding: 10,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    logo: {
        height: 100,
        width: 250,
        right:20
    },
    backButton: {
        height: 100,
        width: 40,
        justifyContent: 'center',
        top:-8
    },
    backIcon: {
        height: 40,
        width: 40,
    },
    flatListContentContainer: {
        flexGrow: 1,
        paddingTop: 20,
    },
    messageBubble: {
        maxWidth: '70%',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'flex-start',
        backgroundColor: '#E5E5EA',
    },
    myMessageBubble: {
        alignSelf: 'flex-end',
        // backgroundColor: '#DCF8C6',
        borderWidth:1,
        right: 10
    },
    otherMessageBubble: {
        alignSelf: 'flex-start',
        left: 10
    },
    senderName: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    messageText: {
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        paddingRight:10,
        paddingLeft: 10,
        paddingBottom: 25,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    sendButton: {
        height: 40,
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#007AFF',
    },
    sendIcon: {
        height: 20,
        width: 20,
        tintColor: '#fff',
    },
});

export default Messaging;