import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Pressable, Button, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useState, useEffect } from 'react';

//Import To-Do List Dependencies
import React from 'react';
import {
  FlatList, TouchableOpacity, Modal,
  TouchableWithoutFeedback
} from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';
import Ionicons from '@expo/vector-icons/Ionicons';

//initialize the database
const initializeDatabase = async (db) => {
  try {
      await db.execAsync(`PRAGMA journal_mode = WAL;`); // Run separately
      await db.execAsync(`
          CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              date_of_birth TEXT NOT NULL,
              username TEXT UNIQUE NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS tasks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              task_name TEXT NOT NULL,
              completed INTEGER DEFAULT 0,
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );
      `);
      console.log('Database initialized!');
  } catch (error) {
      console.log('Error while initializing the database: ', error);
  }
};

//create a stack navigator that manages the navigation between 3 screens
const Stack = createStackNavigator();

//We'll have 3 screens : Login, Register, Home, and Todo

export default function App() {
  return (
    <SQLiteProvider databaseName='auth1.db' onInit={initializeDatabase}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Checklist" component={ChecklistScreen} />
          </Stack.Navigator>
        </NavigationContainer>
    </SQLiteProvider>
  );
}

//LoginScreen component
const LoginScreen = ({ navigation }) => {
  const db = useSQLiteContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true); // Start loading
    try {
      const user = await db.getFirstAsync('SELECT * FROM users WHERE username = ?', [username]);
      if (!user) {
        Alert.alert('Error', 'Username does not exist!');
        return;
      }

      const validUser = await db.getFirstAsync('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
      if (validUser) {
        Alert.alert('Success', 'Login successful');
        navigation.navigate('Checklist', { userId: validUser.id }); // Navigate to the next screen after login
        setUsername('');
        setPassword('');
      } else {
        Alert.alert('Error', 'Incorrect password');
      }
    } catch (error) {
      console.log('Error during login:', error);
      Alert.alert('Error', 'Login failed');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.containerLogin}
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
    >
      <View style={styles.loginBox}>
        <Text style={styles.title}>User Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="blue" />
        ) : (
          <Button title="Login" onPress={handleLogin} />
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>No account yet? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

//RegisterScreenComponent
const SignupScreen = ({ navigation }) => {
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const handleRegister = async () => {
    if (!name || !dob || !username || !email || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setIsLoading(true); // Start loading
    try {
      // Check if the username already exists
      const existingUser = await db.getFirstAsync('SELECT * FROM users WHERE username = ?', [username]);
      if (existingUser) {
        Alert.alert('Error', 'Username already exists.');
        return;
      }

      // Insert the new user into the database
      await db.runAsync(
        'INSERT INTO users (name, date_of_birth, username, email, password) VALUES (?, ?, ?, ?, ?)',
        [name, dob, username, email, password]
      );

      Alert.alert('Success', 'User registered successfully');
      navigation.navigate('Login'); // Navigate to login screen after successful registration
    } catch (error) {
      console.log('Error during registration:', error);
      Alert.alert('Error', 'Registration failed');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.containerSignup}
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
    >
      <View style={styles.signupBox}>
        <Text style={styles.title}>User Registration</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth"
          value={dob}
          onChangeText={setDob}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="blue" />
        ) : (
          <Button title="Register" onPress={handleRegister} />
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

//ProfileScreen component
const ProfileScreen = ({ navigation, route }) => {
  const db = useSQLiteContext(); // Access the database
  const [menuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState({
    name: '',
    date_of_birth: '',
    username: '',
    email: ''
  });

  const userId = route.params?.userId; // Use dynamic userId from route params

  // Fetch user profile data from the database
  const getUserProfile = async (userId) => {
    try {
      const result = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [userId]);
      return result;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (userId) {
      const fetchUserProfile = async () => {
        try {
          const userData = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [userId]);
          if (userData) {
            setUser(userData);
          } else {
            Alert.alert('Error', 'User profile not found');
          }
        } catch (error) {
          console.error('❌ Fetch user profile error:', error);
        }
      };
      fetchUserProfile();
    }
  }, [userId]);

  return (
    <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
      <View style={styles.containerCentered}> 
        {menuVisible && <Sidebar navigation={navigation} closeMenu={() => setMenuVisible(false)} userId={route.params?.userId} />}
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.menuButton}>
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>
        <View style={styles.profileBox}> 
          <Text style={styles.title}>Profile</Text>
          
          <TextInput style={styles.input} value={user.name} editable={false} />
          <TextInput style={styles.input} value={user.date_of_birth} editable={false} />
          <TextInput style={styles.input} value={user.username} editable={false} />
          <TextInput style={styles.input} value={user.email} editable={false} />

          <Button title="Back to Checklist" onPress={() => navigation.navigate('Checklist', { userId })}/>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

//ChecklistScreen Component
const getTasks = async (userId) => {
  try {
    const result = await db.getAllAsync('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    return result;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

const addTask = async (userId, task) => {
  try {
    const result = await db.runAsync('INSERT INTO tasks (user_id, task) VALUES (?, ?)', [userId, task]);
    return result.lastInsertRowId; // Return the ID of the newly inserted task
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

const updateTask = async (taskId, updates) => {
  try {
    if (updates.task !== undefined) {
      await db.runAsync('UPDATE tasks SET task = ? WHERE id = ?', [updates.task, taskId]);
    }
    if (updates.completed !== undefined) {
      await db.runAsync('UPDATE tasks SET completed = ? WHERE id = ?', [updates.completed, taskId]);
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

const deleteTask = async (taskId) => {
  try {
    await db.runAsync('DELETE FROM tasks WHERE id = ?', [taskId]);
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

const ChecklistScreen = ({ navigation, route }) => {
  const db = useSQLiteContext(); // Access the database
  const [menuVisible, setMenuVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const userId = route.params?.userId;

  // Fetch tasks when the component loads
  useEffect(() => {
    if (userId) {
      const fetchTasks = async () => {
        try {
          const userTasks = await db.getAllAsync('SELECT * FROM tasks WHERE user_id = ?', [userId]);
          setTasks(userTasks);
        } catch (error) {
          console.error('❌ Fetch tasks error:', error);
        }
      };
      fetchTasks();
    }
  }, [userId]);

  // Add a new task to the database
  const handleAddTask = async () => {
    if (newTask.trim()) {
      try {
        await db.runAsync('INSERT INTO tasks (user_id, task_name) VALUES (?, ?)', [userId, newTask]);
        const updatedTasks = await db.getAllAsync('SELECT * FROM tasks WHERE user_id = ?', [userId]);
        setTasks(updatedTasks);
        setNewTask('');
      } catch (error) {
        console.error('❌ Add task error:', error);
      }
    }
  };

  // Toggle task completion
  const toggleCompletion = async (id, completed) => {
    try {
      await db.runAsync('UPDATE tasks SET completed = ? WHERE id = ?', [!completed, id]);
      const updatedTasks = await db.getAllAsync('SELECT * FROM tasks WHERE user_id = ?', [userId]);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('❌ Toggle task error:', error);
    }
  };

  // Start editing a task
  const startEditing = (id, text) => {
    setEditingTaskId(id);
    setEditingText(text);
  };

  // Save edited task
  const saveEditing = async () => {
    if (!editingTaskId || !editingText.trim()) return; // Prevent unnecessary calls

    try {
      await db.runAsync('UPDATE tasks SET task_name = ? WHERE id = ?', [editingText, editingTaskId]);
      setTasks(tasks.map(task => (task.id === editingTaskId ? { ...task, task_name: editingText } : task)));
      setEditingTaskId(null);
    } catch (error) {
      console.error('❌ Save editing error:', error);
    }
  };

  // Delete a task from the database
  const handleDeleteTask = async (id) => {
    try {
      await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
      const updatedTasks = await db.getAllAsync('SELECT * FROM tasks WHERE user_id = ?', [userId]);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('❌ Delete task error:', error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => { setMenuVisible(false); }}>
      <View style={styles.container}>
        {menuVisible && <Sidebar navigation={navigation} closeMenu={() => setMenuVisible(false)} userId={userId} />}
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.menuButton}>
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.title, styles.checklistTitle]}>To-Do List</Text>
        <FlatList
          data={tasks ?? []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View>
              <TouchableOpacity
                onLongPress={() => startEditing(item.id, item.task_name)} // Use task_name instead of task
                delayLongPress={1000}
                activeOpacity={0.7}
              >
                <View style={styles.taskItem}>
                  <TouchableOpacity onPress={() => toggleCompletion(item.id, item.completed)}>
                    <Text style={styles.checkbox}>{item.completed ? '✔' : '○'}</Text>
                  </TouchableOpacity>
                  {editingTaskId === item.id ? (
                    <TextInput
                      style={styles.input}
                      value={editingText}
                      onChangeText={setEditingText}
                      autoFocus
                      onBlur={saveEditing} // Save changes when the input loses focus
                    />
                  ) : (
                    <Text style={[styles.task, item.completed && styles.completedTask]}>{item.task_name}</Text>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
                    <Text style={styles.deleteButton}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )}
        />
        <TextInput
          style={styles.input}
          placeholder="New Task"
          value={newTask}
          onChangeText={setNewTask}
        />
        <Button title="Add Task" onPress={handleAddTask} />
      </View>
    </TouchableWithoutFeedback>
  );
};

const Sidebar = ({ navigation, closeMenu, userId }) => {
  return (
    <View style={styles.sidebar}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity onPress={() => { closeMenu(); navigation.navigate('Checklist', { userId }); }}>
          <Text style={styles.menuItem}>Checklist</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { closeMenu(); navigation.navigate('Profile', { userId }); }}>
          <Text style={styles.menuItem}>Profile</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  checklistTitle: {
    marginLeft: 50,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  link: {
    color: 'blue',
    marginTop: 10,
  },
  menuButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
  },
  menuText: {
    color: 'white',
    fontSize: 18,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 200,
    backgroundColor: '#444',
    padding: 20,
    justifyContent: 'center', // Fixed alignment
    zIndex: 1000,
    elevation: 5, // Android shadow fix
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
    zIndex: 999,
  },
  menuItem: {
    color: 'white',
    fontSize: 18,
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },  
  task: {
    fontSize: 18,
    marginBottom: 5,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  checklistTitle: {
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
  },
  task: {
    fontSize: 18,
    flex: 1,
    marginLeft: 10,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  checkbox: {
    fontSize: 18,
  },
  deleteButton: {
    fontSize: 18,
    color: 'red',
  },
  menuButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
  },
  menuText: {
    color: 'white',
    fontSize: 18,
  },
  containerLogin: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa', // Light background color
  },
  loginBox: {
    width: '80%', // Adjust width to ensure it's centered properly
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  link: {
    color: 'blue',
    marginTop: 10,
  },
  containerSignup: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5', // Optional: Set a background color
  },
  signupBox: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // For Android shadow effect
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  link: {
    color: 'blue',
    marginTop: 10,
    textAlign: 'center',
  },
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileBox: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
});