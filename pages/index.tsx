import { NotLoggedIn } from "../components/NotLoggedIn";
import { useAuth } from "../hooks/auth";
import { useFirebaseAuth } from "@context/firebaseContext";

export default function Home() {
  const { user, signOut } = useFirebaseAuth();
  const { canUsePassKey, registerPassKeyRequest } = useAuth();

  if (!user) {
    return <NotLoggedIn />;
  }

  return (
    <div>
      <h1>Hello, {user.email}</h1>
      <button onClick={signOut}>Logout</button>

      {canUsePassKey && (
        <button onClick={() => registerPassKeyRequest(user)}>
          Create my Passkey
        </button>
      )}
    </div>
  );
}
