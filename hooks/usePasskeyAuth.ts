import { signInWithCustomToken } from "firebase/auth";
import { useState } from "react";
import { useEffectOnce } from "react-use";
import { axiosClient } from "@lib/axiosClient";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { auth } from "@context/firebaseContext";

export function usePasskeyAuth() {
  const [canUsePassKey, setCanUsePassKey] = useState(false);

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
    try {
      const resp = await axiosClient.post("api/register/start");
      const opts = await resp.data;

      const attResp = await startRegistration(opts);

      const verificationResp = await axiosClient.post(
        "api/register/finish",
        attResp
      );

      const verificationJSON = await verificationResp.data;

      if (verificationJSON && verificationJSON.verified) {
        return alert(`Create passkey successful`);
      } else {
        return alert("Create passkey failure!");
      }
    } catch (error) {
      throw error;
    }
  };

  const signinWithPassKey = async () => {
    try {
      const resp = await axiosClient.post("api/authentication/start");
      const opts = await resp.data;

      const asseResp = await startAuthentication(opts);

      const verificationResp = await axiosClient.post(
        "api/authentication/finish",
        asseResp
      );

      const verificationJSON = await verificationResp.data;

      if (verificationJSON && verificationJSON.firebaseToken) {
        alert(`Verify successful`);
        return signInWithCustomToken(auth, verificationJSON.firebaseToken);
      } else {
        return alert("Verify failure!");
      }
    } catch (error) {
      throw error;
    }
  };

  useEffectOnce(() => {
    passKeyFeatureDetection();
  });

  return {
    signinWithPassKey,
    canUsePassKey,
    registerPassKeyRequest,
  };
}
