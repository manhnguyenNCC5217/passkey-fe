import { FirebaseError, initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
} from "firebase/auth";
import { useState } from "react";
import { useEffectOnce } from "react-use";
import { fetchChallenge, signinRequest, signinRequestChallenge } from "../api";
import base64url from "base64url";
import { string2Buffer } from "@utils";

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

export interface IUserInfo {
  email: string;
  password: string;
}

export function useAuth() {
  const [userInfo, setUserInfo] = useState<IUserInfo>({} as IUserInfo);
  const [canUsePassKey, setCanUsePassKey] = useState(false);

  const registerWithEmailAndPassWord = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userInfo.email,
        userInfo.password
      );
      const user = userCredential.user;
      console.log({ userCredential, user });
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log({ errorCode, errorMessage });
        alert("Register failure!");
      }
    }
  };

  const loginWithEmailAndPassword = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userInfo.email,
        userInfo.password
      );
      const user = userCredential.user;
      console.log({ userCredential, user });
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log({ errorCode, errorMessage });
        alert(`Login failure! ${errorMessage}`);
      }
    }
  };

  const passKeyFeatureDetection = () => {
    // feature detection
    // ref: https://web.dev/passkey-registration/#feature-detection
    if (window.PublicKeyCredential) {
      setCanUsePassKey(true);
    }
  };

  const registerPassKeyRequest = async (user: User) => {
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
          id: process.env.NEXT_PUBLIC_RP_ID,
        },
        user: {
          id: string2Buffer(challengeResponse.userId),
          // 以下 name と displayName はほぼ同じ。なんで別なのかわからん
          // ref: https://zenn.dev/inabajunmr/articles/webauthn-input-table-level3#publickeycredentialuserentity
          name: user.email || "",
          displayName: user.email || "",
        },
        pubKeyCredParams: challengeResponse.publicKeyCredentialParams,
        excludeCredentials: challengeResponse.excludeCredentials,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          requireResidentKey: true,
        },
      },
    });

    // send credentials to backend store
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
        rpId: process.env.NEXT_PUBLIC_RP_ID,
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
    passKeyFeatureDetection();
  });

  return {
    loginWithEmailAndPassword,
    registerWithEmailAndPassWord,
    signinWithPassKey,
    userInfo,
    setUserInfo,
    canUsePassKey,
    registerPassKeyRequest,
  };
}
