import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAIIKQxj4z5LI0jQGLuqq8Vt6ay_87hRlg',
  authDomain: 'crisissense-ai.firebaseapp.com',
  projectId: 'crisissense-ai',
  storageBucket: 'crisissense-ai.firebasestorage.app',
  messagingSenderId: '96511393073',
  appId: '1:96511393073:web:1d2bb6ddd4052e89270410',
  measurementId: 'G-B5MLMYSVGQ',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore — used for alerts + witness_reports
export const db = getFirestore(app);

// Auth — with AsyncStorage persistence so sessions survive app restarts
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;