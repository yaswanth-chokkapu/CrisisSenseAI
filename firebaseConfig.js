import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your verified Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAIIKQxj4z5LI0jQGLuqq8Vt6ay_87hRlg",
    authDomain: "crisissense-ai.firebaseapp.com",
    projectId: "crisissense-ai",
    storageBucket: "crisissense-ai.firebasestorage.app",
    messagingSenderId: "96511393073",
    appId: "1:96511393073:web:1d2bb6ddd4052e89270410",
    measurementId: "G-B5MLMYSVGQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export these so we can use them in our Emergency Button code
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;