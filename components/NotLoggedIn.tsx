import { useFirebaseAuth } from "@context/firebaseContext";
import { usePasskeyAuth } from "../hooks/usePasskeyAuth";

export const NotLoggedIn = () => {
  const {
    userInfo,
    setUserInfo,
    registerWithEmailAndPassWord,
    loginWithEmailAndPassword,
  } = useFirebaseAuth();
  const { signinWithPassKey, canUsePassKey } = usePasskeyAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div>
      <h1>Please Sign in</h1>
      <ul>
        <li style={{ listStyle: "none" }}>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="hoge@example.com"
            autoComplete="email webauthn"
            value={userInfo.email}
            onChange={handleInputChange}
          />
          <br />
          <br />
          <input
            type="password"
            name="password"
            id="password"
            placeholder="password"
            value={userInfo.password}
            onChange={handleInputChange}
          />
          <br />
          <br />
          <button onClick={registerWithEmailAndPassWord}>Register</button>
          <button onClick={loginWithEmailAndPassword}>Login with Email</button>
        </li>
        {canUsePassKey && (
          <button onClick={signinWithPassKey}>Login with Passkey</button>
        )}
      </ul>
    </div>
  );
};
