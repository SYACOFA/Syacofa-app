"use client";

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "../../firebase";
import { useRouter } from 'next/navigation';
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

export default function DashboardPage() {
  const auth = getAuth(app);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  // Initialize Firestore
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // --- MANDATORY PHONE VERIFICATION CHECK ---
        if (!currentUser.phoneNumber) {
          // If the user does not have a verified phone number, force them to the verification page.
          router.push('/verify-phone');
          return; // Stop rendering the dashboard
        }
        // ----------------------------------------

        // If they are verified, proceed to load the dashboard
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setName(userDoc.data().name || '');
        }
        setLoading(false); // Only stop loading if the user is verified and can see the page
      } else {
        // Redirect to login page if no user is logged in
        router.push('/auth');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, router, db]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!user) {
      setMessage('You must be logged in to save your name.');
      return;
    }
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { name: name }, { merge: true });
      setMessage('Name saved successfully!');
    } catch (err) {
      if (err instanceof Error) {
        setMessage(`Error: ${err.message}`);
      } else {
        setMessage('An unknown error occurred.');
      }
    }
  };

  const handleLogOut = async () => {
    try {
      await auth.signOut();
      router.push('/auth');
    } catch (err) {
      console.error(err);
    }
  };

  // While checking for verification, show a loading screen
  if (loading) {
    return <p>Loading & Verifying Account...</p>;
  }

  // Only render the dashboard if the user is fully loaded and verified
  return (
    <div style={{ padding: '2rem' }}>
      {user && (
        <div>
          <h1>Welcome to your Dashboard</h1>
          <p>Hello, {name || user.email}</p>
          
          <form onSubmit={handleSaveName} style={{ marginTop: '2rem' }}>
            <h2>Your Profile</h2>
            <div>
              <label htmlFor="name">Name:</label>
              <input 
                type="text" 
                id="name"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter your name"
                required 
                style={{ marginLeft: '0.5rem' }}
              />
            </div>
            <button type="submit" style={{ marginTop: '1rem' }}>Save Name</button>
          </form>
          {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}

          <button onClick={handleLogOut} style={{ marginTop: '2rem' }}>Log Out</button>
        </div>
      )}
    </div>
  );
}
