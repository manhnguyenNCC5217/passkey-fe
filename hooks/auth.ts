import { initializeApp } from "firebase/app";
import {
  User,
  getAuth,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/router";
import { useState } from "react";
import { useEffectOnce } from "react-use";
import { fetchChallenge, signinRequest, signinRequestChallenge } from "../api";
import base64url from "base64url";
import { string2Buffer } from "@utils";

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
});

export function useAuth() {
  const auth = getAuth(app);
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [canUsePassKey, setCanUsePassKey] = useState(false);
  const router = useRouter();

  const updateUserState = () => {
    onAuthStateChanged(getAuth(app), setUser);
  };

  const signinWithEmailLink = async () => {
    await sendSignInLinkToEmail(auth, email, {
      url: "http://localhost:3001/signin",
      handleCodeInApp: true,
    });

    window.localStorage.setItem("emailForSignIn", email);

    alert(`Email sent to ${email}. Click the link to sign in.`);
  };

  const verifySignInWithEmailLink = async () => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      return;
    }

    let email = window.localStorage.getItem("emailForSignIn");
    if (!email) {
      email = window.prompt("Please provide your email for confirmation");
    }

    await signInWithEmailLink(auth, email!, window.location.href);

    window.localStorage.removeItem("emailForSignIn");
    updateUserState();

    router.push("/");
  };

  const signout = () => {
    signOut(auth);
    updateUserState();
  };

  const passKeyFeatureDetection = () => {
    // feature detection
    // ref: https://web.dev/passkey-registration/#feature-detection
    if (
      window.PublicKeyCredential &&
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
      PublicKeyCredential.isConditionalMediationAvailable
    ) {
      // Check if user verifying platform authenticator is available.
      Promise.all([
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
        PublicKeyCredential.isConditionalMediationAvailable(),
      ]).then((results) => {
        if (results.every((r) => r === true)) {
          setCanUsePassKey(true);
        }
      });
    }
  };

  const registerPassKeyRequest = async () => {
    const options = {
      attestation: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        requireResidentKey: false,
      },
    };

    const challengeResponse = await fetchChallenge(options);

    // https://web.dev/passkey-registration/#call-webauthn-api-to-create-a-passkey
    const credentials = await navigator.credentials.create({
      publicKey: {
        challenge: string2Buffer(base64url.decode(challengeResponse.challenge)),
        rp: {
          name: "SimpleWebAuthn Example",
          id: "localhost",
        },
        user: {
          id: string2Buffer(challengeResponse.userId),
          // 以下 name と displayName はほぼ同じ。なんで別なのかわからん
          // ref: https://zenn.dev/inabajunmr/articles/webauthn-input-table-level3#publickeycredentialuserentity
          name: "JJ",
          displayName: "JJ Display Name",
        },
        pubKeyCredParams: challengeResponse.publicKeyCredentialParams,
        excludeCredentials: challengeResponse.excludeCredentials,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          requireResidentKey: true,
        },
      },
    });

    console.log(credentials);
  };

  const signinWithPassKey = async () => {
    const challengeResponse = await signinRequestChallenge({
      userVerification: "required",
    });
    if (challengeResponse == null) {
      return;
    }

    const challenge = base64url.decode(challengeResponse.challenge);

    // ref: https://web.dev/passkey-form-autofill/#call-webauthn-api-with-the-conditional-flag-to-authenticate-the-user
    const cred = await navigator.credentials.get({
      publicKey: {
        challenge: string2Buffer(base64url.decode(challenge)),
        rpId: "localhost",
      },
      mediation: "required",
    });

    console.log(cred);

    // custom token を返してもらう
    await signinRequest(challenge);
    // signInWithCustomToken する
    // 認証完了
  };

  useEffectOnce(() => {
    updateUserState();
    passKeyFeatureDetection();
  });

  return {
    signinWithEmailLink,
    verifySignInWithEmailLink,
    signinWithPassKey,
    signout,
    email,
    setEmail,
    auth,
    user,
    canUsePassKey,
    registerPassKeyRequest,
  };
}
