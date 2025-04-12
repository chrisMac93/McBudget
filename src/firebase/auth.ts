import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from './config';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Set session cookie helper function
export const setSessionCookie = async (user: User) => {
  try {
    // Get the Firebase ID token
    const token = await user.getIdToken();
    
    // Store token in localStorage as a fallback for middleware
    localStorage.setItem('firebaseToken', token);
    
    // Manually set a session cookie that middleware can read
    // This simulates what would happen in a real backend with proper session cookies
    document.cookie = `__session=${token}; path=/; max-age=86400; SameSite=Strict`;
    
    console.log("Session cookie set successfully");
    return token;
  } catch (error) {
    console.error("Error setting session cookie:", error);
    throw error;
  }
};

// Clear session cookie on logout
export const clearSessionCookie = () => {
  localStorage.removeItem('firebaseToken');
  document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  console.log("Session cookie cleared");
};

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set the display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      // Set session cookie
      await setSessionCookie(userCredential.user);
    }
    
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    // Set persistence to local to ensure user stays signed in
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Set session cookie
    await setSessionCookie(userCredential.user);
    
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign in with Google - Use popup for simplicity
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    // Set persistence to LOCAL
    await setPersistence(auth, browserLocalPersistence);
    
    // Use popup method - more reliable in complex environments
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign-in successful:", result.user.email);
    
    // Set session cookie
    await setSessionCookie(result.user);
    
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Check for redirect result (in case we switch back to redirect method)
export const getGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      // Set session cookie
      await setSessionCookie(result.user);
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Error processing Google sign-in result:', error);
    return null;
  }
};

// Sign out
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    // Clear session cookie
    clearSessionCookie();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Update password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }
    
    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}; 