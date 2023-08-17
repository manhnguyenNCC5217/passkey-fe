import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getExistOrCreateUserId } from "@services/user";
import { initializeApp } from "firebase/app";
import { FirebaseError } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MESUREMENT_ID,
};

export const firebase = initializeApp(firebaseConfig);
export const auth = getAuth(firebase);

interface IUserInfo {
  email: string;
  password: string;
}

export interface IFirebaseContextValue {
  user?: User | null;
  reinitialize: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  signOut: () => Promise<void>;
  userInfo: IUserInfo;
  setUserInfo: React.Dispatch<React.SetStateAction<IUserInfo>>;
  registerWithEmailAndPassWord: () => Promise<void>;
  loginWithEmailAndPassword: () => Promise<void>;
}

const FirebaseContext = React.createContext<IFirebaseContextValue>(
  {} as IFirebaseContextValue
);

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [userInfo, setUserInfo] = useState<IUserInfo>({} as IUserInfo);
  const [user, setUser] = React.useState<User | null>(null);

  const registerWithEmailAndPassWord = useCallback(async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userInfo.email,
        userInfo.password
      );
      const user = userCredential.user;
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert("Register failure!");
      }
    }
  }, [userInfo]);

  const loginWithEmailAndPassword = useCallback(async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userInfo.email,
        userInfo.password
      );
      const user = userCredential.user;
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        const errorMessage = error.message;
        alert(`Login failure! ${errorMessage}`);
      }
    }
  }, [userInfo]);

  const signOut = useMemo(() => {
    return auth.signOut.bind(auth);
  }, []);

  const initialize = useCallback(async (user: User | null) => {
    try {
      setIsLoading(true);
      let id;
      if (user) {
        id = await getExistOrCreateUserId();
      }
      setUser(user && user.uid && id ? user : null);
      setIsError(false);
      setIsLoading(false);
    } catch (err) {
      setIsError(true);
      setIsLoading(false);
    }
  }, []);

  const reinitialize = useCallback(async () => {
    return await initialize(auth.currentUser);
  }, []);

  useEffect(() => {
    auth.onAuthStateChanged(initialize);
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        reinitialize,
        signOut,
        isLoading,
        isError,
        userInfo,
        setUserInfo,
        loginWithEmailAndPassword,
        registerWithEmailAndPassWord,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  return useContext(FirebaseContext);
};
