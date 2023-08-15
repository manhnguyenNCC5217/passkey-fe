import admin, { auth } from "firebase-admin";
import { cert, ServiceAccount } from "firebase-admin/app";
import firebaseCredential from "../credentials/webauthn-passkey-firebase-adminsdk-jmnl3-573728325a.json";

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: cert(firebaseCredential as ServiceAccount),
  });
}

export const decodeToken = async (token: string) => {
  try {
    const decodedToken = await auth().verifyIdToken(token);
    return decodedToken;
  } catch (err) {
    return null;
  }
};
