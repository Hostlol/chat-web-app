import React, {useEffect, useRef, useState} from 'react';
import './App.css';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { getAnalytics } from 'firebase/analytics';

import { useAuthState } from 'react-firebase-hooks/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDGnuNBibQ3G85Kaofv1PoVyGbFz0GA7qg",
  authDomain: "chat-app-2b806.firebaseapp.com",
  projectId: "chat-app-2b806",
  storageBucket: "chat-app-2b806.appspot.com",
  messagingSenderId: "299410863649",
  appId: "1:299410863649:web:b0f2f68492fb8ddd519560",
  measurementId: "G-V36ZZ89BQD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const analytics = getAnalytics(app);




function App() {

  const [user] = useAuthState(auth);

  return (
      <div className="App">
        <header>
          <h1><span role="img" aria-label="Fire">🔥</span> Group Chat</h1>
          <SignOut />
        </header>

        <section>
          {user ? <ChatRoom /> : <SignIn />}
        </section>

      </div>
  );
}

function SignIn() {

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }

  return (
      <>
        <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
        <p>Do not violate the community guidelines or you will be banned for life!</p>
      </>
  )

}

function SignOut() {
  return auth.currentUser && (
      <button className="sign-out" onClick={() => signOut(auth)}>Sign Out</button>
  )
}


function ChatRoom() {
  const dummy = useRef();
  const messagesRef = collection(firestore, 'messages');
  const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState('');

  useEffect(() => {
    const q = query(messagesRef, orderBy('createdAt'), limit(25));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messages);
    }, (error) => {
      console.error("Failed to fetch messages: ", error);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!formValue.trim()) return; // Prevent sending empty messages

    const { uid, photoURL } = auth.currentUser;

    try {
      await addDoc(collection(firestore, "messages"), {
        text: formValue.trim(),
        createdAt: serverTimestamp(),
        uid,
        photoURL
      });

      setFormValue('');
      dummy.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (<>
    <main>

      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}

      <span ref={dummy}></span>

    </main>

    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Type a message" />
      <button type="submit" disabled={!formValue}></button>
    </form>
  </>)
}


function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (<>
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
      <p>{text}</p>
    </div>
  </>)
}


export default App;