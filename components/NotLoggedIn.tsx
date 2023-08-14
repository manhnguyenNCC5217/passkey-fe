import { useAuth } from "../hooks/auth";

export const NotLoggedIn = () => {
  const {
    signinWithEmailLink,
    signinWithPassKey,
    email,
    setEmail,
    canUsePassKey,
  } = useAuth();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div>
      <h1>Vui lòng đăng nhập bên dưới</h1>
      <ul>
        <li style={{ display: "flex", gap: "16px" }}>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="hoge@example.com"
            autoComplete="email webauthn"
            value={email}
            onChange={handleEmailChange}
          />
          <button onClick={signinWithEmailLink}>Login with Email</button>
        </li>
        {canUsePassKey && (
          <button onClick={signinWithPassKey}>Login with Passkey</button>
        )}
      </ul>
    </div>
  );
};
