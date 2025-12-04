import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    }
    
    return userCredential;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create account');
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign in with GitHub
export const signInWithGitHub = async (): Promise<UserCredential> => {
  try {
    const provider = new GithubAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with GitHub');
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Get ID token for API calls
export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }
  return null;
};

// Auth state observer
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};


export function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}