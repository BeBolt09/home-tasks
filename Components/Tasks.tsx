import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { doc, getDoc, getDocs, collection, serverTimestamp, addDoc, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from '../FirebaseConfig';
import { getAuth } from 'firebase/auth';
import ModalDropdown from 'react-native-modal-dropdown'; 

const Tasks = () => {
  const currentUserId = getAuth().currentUser?.uid;
  const [groupName, setGroupName] = useState<string | undefined>();
  const [tasks, setTasks] = useState<{ assignee: string, tasks: any[] }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskContent, setTaskContent] = useState("");
  const [assignee, setAssignee] = useState(""); // Assignee UID
  const [time, setTime] = useState("");
  const [groupMembers, setGroupMembers] = useState<{ uuid: string, name: string }[]>([]); // State to store group members with UUIDs and names

  const fetchGroupName = async () => {
    if (currentUserId) {
      const userSnap = await getDoc(doc(FIREBASE_DB, 'users', currentUserId));
      const userData = userSnap.data();
      setGroupName(userData?.groupName[0]);
    }
  };

  const fetchGroupMembers = async () => {
    if (groupName) {
      try {
        const groupRef = doc(FIREBASE_DB, "groups", groupName);
        const groupSnapshot = await getDoc(groupRef);
        if (groupSnapshot.exists()) {
          const groupData = groupSnapshot.data();
          const memberUids = groupData.members || [];
          const membersPromises = memberUids.map(async (uuid: string) => {
            const userSnap = await getDoc(doc(FIREBASE_DB, 'users', uuid));
            const userData = userSnap.data();
            return { uuid, name: userData?.name || 'Unknown User' };
          });
          const members = await Promise.all(membersPromises);
          setGroupMembers(members);
        } else {
          console.error(`Group ${groupName} does not exist`);
        }
      } catch (error) {
        console.error("Error fetching group members:", error);
      }
    }
  };

  useEffect(() => {
    fetchGroupName();
    fetchGroupMembers();

    const fetchTasks = async () => {
      if (groupName) {
        const tasksSnapshot = await getDocs(collection(FIREBASE_DB, "groups", groupName, "tasks"));
        const tasksData = tasksSnapshot.docs.map(doc => doc.data());
        const groupedTasks = tasksData.reduce((acc, task) => {
          if (!acc[task.assignee]) {
            acc[task.assignee] = [];
          }
          acc[task.assignee].push(task);
          return acc;
        }, {});
        if (currentUserId){
          const currentUserTasks = groupedTasks[currentUserId];
          const otherTasks = Object.entries(groupedTasks)
            .filter(([assigneeId]) => assigneeId !== currentUserId)
            .map(([assigneeId, tasks]) => ({ assignee: assigneeId, tasks }));
          const updatedTasksData = currentUserTasks ? [{ assignee: currentUserId, tasks: currentUserTasks }, ...otherTasks] : otherTasks;

        const updatedTasksWithName = await Promise.all(updatedTasksData.map(async ({ assignee, tasks }) => {
          const userSnap = await getDoc(doc(FIREBASE_DB, 'users', assignee));
          const userData = userSnap.data();
          const assigneeName = userData?.name || 'Unknown User';
          return { assignee: assignee === currentUserId ? 'My Tasks' : assigneeName, tasks };
        }));

        setTasks(updatedTasksWithName);
      }
      }
    };
    fetchTasks();

    if (groupName){
        const unsubscribe = onSnapshot(collection(FIREBASE_DB, "groups", groupName, "tasks"), (snapshot) => {
          fetchTasks(); // Update tasks when there are changes
        });
      

      return () => {
        unsubscribe();
      };
    }
  }, [groupName]);

  const addTask = async () => {
    if (groupName && taskContent && assignee) {
      await addDoc(collection(FIREBASE_DB, "groups", groupName, "tasks"), {
        setterId: currentUserId,
        assignee,
        content: taskContent,
        createdAt: serverTimestamp(),
        completed: false,
        setTime: time || null,
      });

      setModalVisible(false);
      setTaskContent("");
      setAssignee("");
      setTime("");
    }
  };
   
  return (
    <View>
      <View style={{ backgroundColor: 'white', borderRadius: 20, width: 200, alignSelf: 'center' }}>
        <Button title='Add a Task' onPress={() => setModalVisible(true)} />
      </View>
      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <View style={{ borderBottomWidth: 1, padding: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.assignee}</Text>
            {item.tasks.map((task, index: number) => (
              <Text key={index}>
                - {task.content} {task.setTime && `at ${task.setTime}`}
              </Text>
            ))}
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput
              style={styles.input}
              placeholder="Task content"
              value={taskContent}
              onChangeText={setTaskContent}
            />
            <View>
            <ModalDropdown
              options={groupMembers.map(member => member.name)} // Use names of group members as options
              defaultValue="Select a member" // Default text shown before selection
              style={styles.dropdown} // Styling for the dropdown
              dropdownStyle={styles.dropdownOptions} // Styling for the dropdown options
              onSelect={(index: string, option: string) => setAssignee(groupMembers[parseInt(index, 10)].uuid)}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Time (Optional)"
              value={time}
              onChangeText={setTime}
            />
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Add Task" onPress={addTask} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  input: {
    height: 40,
    width: 200,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10
  },
  dropdown: {
    width: 200,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10
  },
  dropdownOptions: {
    marginTop: 2,
    width: 200,
    borderRadius: 10
  }
});

export default Tasks;
