import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User } from "firebase/auth";
import { auth } from "@hooks/auth";
import { getExistOrCreateUserId } from "@helpers/user";

export interface IFirebaseContextValue {
  user?: User | null;
  reinitialize: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  signOut: () => Promise<void>;
}

export const FirebaseContext = React.createContext<IFirebaseContextValue>(
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
  const [user, setUser] = React.useState<User | null>(null);

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
    console.log("runnnnnn onAuthStateChanged");
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
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  return useContext(FirebaseContext);
};
