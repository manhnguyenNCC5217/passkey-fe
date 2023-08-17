import { NotLoggedIn } from "../components/NotLoggedIn";
import { usePasskeyAuth } from "../hooks/usePasskeyAuth";
import { useFirebaseAuth } from "@context/firebaseContext";

export default function Home() {
  const { user, signOut } = useFirebaseAuth();
  const { canUsePassKey, registerPassKeyRequest } = usePasskeyAuth();

  if (!user) {
    return <NotLoggedIn />;
  }

  return (
    <div>
      <h1>Hello, {user.email}</h1>
      <button onClick={signOut}>Logout</button>

      {canUsePassKey && (
        <button onClick={() => registerPassKeyRequest()}>
          Create my Passkey
        </button>
      )}
    </div>
  );
}
