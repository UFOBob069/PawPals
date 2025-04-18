'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            // Fetch user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              // Use the data from Firestore
              const userData = userDoc.data() as User;
              setUser(userData);
            } else {
              // If no Firestore document exists (shouldn't happen in normal flow)
              const userData: User = {
                uid: firebaseUser.uid,
                role: { owner: false, host: false },
                name: firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                photoUrl: firebaseUser.photoURL || undefined,
                location: { lat: 0, lng: 0 },
                services: { walk: false, daycare: false, boarding: false },
                breedsPreferred: [],
                createdAt: new Date(),
              };
              setUser(userData);
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError(err as Error);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 