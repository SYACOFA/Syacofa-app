"use client";

import { useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  linkWithPhoneNumber, 
  ConfirmationResult 
} from "firebase/auth";
import { app } from "../../firebase";
import { useRouter } from 'next/navigation';

export default function VerifyPhonePage() {
  const auth = getAuth(app);
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for phone verification
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Set up reCAPTCHA for phone auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
    }
  }, [auth]);

  // Check for logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // If no user is logged in, they can't verify a phone, so send them to login
        router.push('/auth');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!window.recaptchaVerifier || !user) {
      setError("User not logged in or reCAPTCHA not initialized.");
      return;
    }
    try {
      const confirmation = await linkWithPhoneNumber(user, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setError('Verification code sent!');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError('An unknown error occurred while sending the code.');
      }
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!confirmationResult) {
      setError("Please send a verification code first.");
      return;
    }
    try {
      await confirmationResult.confirm(verificationCode);
      setError("Phone number verified successfully! Redirecting...");
      // On successful verification, redirect to the dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError('An unknown error occurred while verifying the code.');
      }
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Verify Your Phone Number</h1>
      <p>Before you can access your dashboard, please complete this one-time verification.</p>
      {/* This div is required for the invisible reCAPTCHA */}
      <div id="recaptcha-container"></div>

      {!confirmationResult ? (
        <form onSubmit={handleSendCode} style={{ marginTop: '2rem' }}>
          <div>
            <label htmlFor="phone">Phone Number:</label>
            <input 
              type="tel" 
              id="phone"
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)} 
              placeholder="+1 650 555 3434"
              required 
            />
          </div>
          <button type="submit" style={{ marginTop: '1rem' }}>Send Verification Code</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} style={{ marginTop: '2rem' }}>
          <h2>Enter Code</h2>
          <div>
            <label htmlFor="code">Verification Code:</label>
            <input 
              type="text" 
              id="code"
              value={verificationCode} 
              onChange={(e) => setVerificationCode(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" style={{ marginTop: '1rem' }}>Verify Code</button>
        </form>
      )}
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}

// Extend the Window interface to include the recaptchaVerifier
declare global {
  interface Window { 
    recaptchaVerifier?: RecaptchaVerifier;
  } 
}
