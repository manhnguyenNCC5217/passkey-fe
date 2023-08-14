import { useAuth } from "../hooks/auth";
import { useEffectOnce } from "react-use";

export default function SignIn() {
  const { verifySignInWithEmailLink } = useAuth();

  useEffectOnce(() => {
    verifySignInWithEmailLink();
  });

  return <div>Sign in verifying...</div>;
}
