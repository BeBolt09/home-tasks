import React, { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, collection, serverTimestamp, addDoc, onSnapshot, updateDoc, doc as firestoreDoc, deleteDoc } from "firebase/firestore";
import { FIREBASE_DB } from '../FirebaseConfig';
import { getAuth } from 'firebase/auth';
import ModalDropdown from 'react-native-modal-dropdown';
import { CheckBox } from 'react-native-elements'; // Import CheckBox from react-native-elements
import { View, Text, TextInput, Button, FlatList, Modal,Image, TouchableOpacity, StyleSheet } from 'react-native';

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

  const fetchTasks = async () => {
    if (groupName) {
      const tasksSnapshot = await getDocs(collection(FIREBASE_DB, "groups", groupName, "tasks"));
      const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Include task ID
      const groupedTasks = tasksData.reduce((acc, task) => {
        if (!acc[task.assignee]) {
          acc[task.assignee] = [];
        }
        acc[task.assignee].push(task);
        return acc;
      }, {});
      if (currentUserId) {
        const currentUserTasks = groupedTasks[currentUserId];
        const otherTasks = Object.entries(groupedTasks)
          .filter(([assigneeId]) => assigneeId !== currentUserId)
          .map(([assigneeId, tasks]) => ({ assignee: assigneeId, tasks }));
        const updatedTasksData = currentUserTasks ? [{ assignee: currentUserId, tasks: currentUserTasks }, ...otherTasks] : otherTasks;

        const updatedTasksWithName = await Promise.all(updatedTasksData.map(async ({ assignee, tasks }) => {
          const userSnap = await getDoc(doc(FIREBASE_DB, 'users', assignee));
          const userData = userSnap.data();
          const assigneeName = userData?.name || 'Unknown User';
          return { assignee: assignee === currentUserId ? 'Me' : assigneeName, tasks };
        }));

        setTasks(updatedTasksWithName);
      }
    }
  };

  const addTask = async () => {
    if (groupName && taskContent && assignee) {
      const docRef = await addDoc(collection(FIREBASE_DB, "groups", groupName, "tasks"), {
        setterId: currentUserId,
        assignee,
        content: taskContent,
        createdAt: serverTimestamp(),
        completed: false,
        setTime: time || null,
      });
      const taskId = docRef.id; // Retrieve the task ID
      setModalVisible(false);
      setTaskContent("");
      setAssignee("");
      setTime("");
    }
  };

  const deleteTask = async (taskIdToDelete: string) => {
    try {
      if (groupName && taskIdToDelete) {
        await deleteDoc(firestoreDoc(FIREBASE_DB, "groups", groupName, "tasks", taskIdToDelete));
        fetchTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskContent, setEditingTaskContent] = useState("");
  const [editingTaskTime, setEditingTaskTime] = useState("");
  const [modalEditVisible, setModalEditVisible] = useState(false);

  

  // Function to set the task being edited
  const startEditingTask = (taskId: string, taskContent: string, taskTime: string) => {
    setEditingTaskId(taskId);
    setEditingTaskContent(taskContent);
    setEditingTaskTime(taskTime);
    setModalEditVisible(true); // Open the modal for editing
  };

  const confirmEditTask = async () => {
    try {
      if (groupName && editingTaskId) {
        await updateDoc(firestoreDoc(FIREBASE_DB, "groups", groupName, "tasks", editingTaskId), {
          content: editingTaskContent,
          setTime: editingTaskTime || null,
        });
        setModalEditVisible(false);
        setEditingTaskId(null); // Reset editing state after edit is confirmed
        setEditingTaskContent("");
        setEditingTaskTime("");
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      if(groupName && taskId){
        await updateDoc(firestoreDoc(FIREBASE_DB, "groups", groupName, "tasks", taskId), {
          completed: !completed,
        });
      }
    } catch (error) {
      console.error("Error updating task completion status:", error);
    }
  };

  useEffect(() => {
    fetchGroupName();
    fetchGroupMembers();
    if (groupName) {
      const unsubscribe = onSnapshot(collection(FIREBASE_DB, "groups", groupName, "tasks"), (snapshot) => {
        fetchTasks(); // Update tasks when there are changes
      });
      return () => {
        unsubscribe();
      };
    }
  }, [groupName]);

  return (
    <View>
      <View style={{flexDirection:'row',alignSelf:'center',marginBottom:30}}>
        <View style={{backgroundColor: 'white',borderRadius: 10, width: 150,height:40,marginTop:'3%',marginRight:'5%',borderWidth:2}}>
          <Button title='+ Add Task' onPress={() => setModalVisible(true)} />
        </View>
        <View style={{marginLeft:'5%',backgroundColor:'white',borderRadius:10,padding:10,borderWidth:2}}>
          <TouchableOpacity>
            <Image
              source={require('../assets/icons8-calendar-50.png')}
              style={{height:40,width:40}}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <View style={styles.taskContainer}>
            <Text style={{ fontWeight: 'bold',marginBottom:10,fontSize:20 }}>{item.assignee}</Text>
            <View style={{borderWidth:2,borderRadius:10,padding:10}}>
            {item.tasks.map((task, index: number) => (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} key={index}>
                <Text style={{ textDecorationLine: task.completed ? 'line-through' : 'none' }}>
                  {task.content} {task.setTime && `at ${task.setTime}`}
                </Text>
                <View style={{flexDirection:'row',alignSelf:"flex-end"}}>
                  <CheckBox
                      checked={task.completed}
                      onPress={() => toggleTaskCompletion(task.id, task.completed)}
                      size={20}
                      containerStyle={{ padding: 0 ,margin:2}} // Remove padding
                  />
                  <ModalDropdown
                    options={['Edit', 'Delete']}
                    defaultValue="..."
                    style={{ marginLeft: 0 }} 
                    dropdownStyle={{ width: 60,height:70 }} 
                    onSelect={(index, option) => {
                      if (option === 'Edit') {
                        startEditingTask(task.id, task.content, task.setTime);
                      } else if (option === 'Delete') {
                        deleteTask(task.id);
                      }
                    }}
                    >
                    <Image source={require("../assets/OptionsIcon.png")} style={{height:17,width:17,paddingTop:20}}/>
                  </ModalDropdown>
                </View>
              </View>
            ))}
            </View>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Add Task" onPress={addTask} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalEditVisible}
        onRequestClose={() => {
          setModalEditVisible(false);
          setEditingTaskId(null);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput
              style={styles.input}
              placeholder="Task content"
              value={editingTaskContent}
              onChangeText={setEditingTaskContent}
            />
            <TextInput
              style={styles.input}
              placeholder="Time (Optional)"
              value={editingTaskTime}
              onChangeText={setEditingTaskTime}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button title="Cancel" onPress={() => setModalEditVisible(false)} />
              <Button title="Confirm Edit" onPress={confirmEditTask} />
            </View>
          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  taskContainer: {
    backgroundColor: 'white', // Set background color to white
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 40, // Add margin between task items
    marginTop:25,
    elevation: 3, // Add shadow for a card-like look
    borderWidth:2
  },
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
