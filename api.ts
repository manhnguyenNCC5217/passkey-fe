import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { AttestationConveyancePreference } from "@simplewebauthn/typescript-types";
import base64url from "base64url";

// dummy response
export interface ChallengeRequestOptions {
  attestation?: string;
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    userVerification?: string;
    requireResidentKey?: boolean;
  };
}

export interface ChallengeRequestOptionsResponse
  extends ChallengeRequestOptions {
  pubKeyCredParams?: { type: string; alg: number }[];
}
export async function fetchChallenge(options: ChallengeRequestOptions = {}) {
  // DBからユーザーがいるかどうかを検証
  const user = {
    uid: "0",
    email: "jj@example.com",
    credentials: [{ uid: "0", passwordHash: "hash" }],
  };

  // 存在するユーザーのクレデンシャルを excludeCredentials にいれる（再登録防止のため）
  const excludeCredentials: PublicKeyCredentialDescriptor[] = [];
  for (const credendial of user.credentials) {
    // 以下 object は w3c の webauthn の形に準拠
    // ref: https://w3c.github.io/webauthn/#dictdef-publickeycredentialdescriptor
    excludeCredentials.push({
      // credentials の id を base64 encode して Buffer にする
      id: base64url.toBuffer(credendial.uid),
      // id: Buffer.from(Buffer.from(credendial.uid).toString("base64url")),
      type: "public-key",
      transports: ["internal"],
    });
  }
  // ref: https://zenn.dev/inabajunmr/articles/webauthn-input-table-level3#publickeycredentialparameters
  const publicKeyCredentialParams: PublicKeyCredentialParameters[] = [];
  // アルゴリズムの選択
  // https://www.iana.org/assignments/cose/cose.xhtml#algorithms
  // ES256(-7) は ECDSA with SHA-256
  // RS256(-257) は RSASSA-PKCS1-v1_5 with SHA-256
  const algorithms = [-7, -257];
  for (const alg of algorithms) {
    publicKeyCredentialParams.push({ type: "public-key", alg });
  }
  const as: Record<string, any> = {};
  const authenticatorAttachment =
    options.authenticatorSelection?.authenticatorAttachment;
  const requireResidentKey = options.authenticatorSelection?.requireResidentKey;
  const userVerification = options.authenticatorSelection?.userVerification;
  const conveyancePreference = options.attestation;

  let attestation: AttestationConveyancePreference = "none";
  let authenticatorSelectionFlag = false;
  let authenticatorSelection: Record<string, any> | undefined;

  // check authenticatorAttachment
  if (
    authenticatorAttachment != null &&
    (authenticatorAttachment === "platform" ||
      authenticatorAttachment === "cross-platform")
  ) {
    authenticatorSelectionFlag = true;
    as["authenticatorAttachment"] = authenticatorAttachment;
  }

  // check requireResidentKey
  if (requireResidentKey != null && typeof requireResidentKey === "boolean") {
    authenticatorSelectionFlag = true;
    as["requireResidentKey"] = requireResidentKey;
  }

  // check userVerification
  if (
    (userVerification != null && userVerification === "required") ||
    userVerification === "preferred" ||
    userVerification === "discouraged"
  ) {
    authenticatorSelectionFlag = true;
    as["userVerification"] = userVerification;
  }

  if (authenticatorSelectionFlag) {
    authenticatorSelection = as;
  }

  // check attestation
  if (
    conveyancePreference != null &&
    (conveyancePreference === "direct" ||
      conveyancePreference === "indirect" ||
      conveyancePreference === "none")
  ) {
    attestation = conveyancePreference;
  }

  const rp = {
    name: "SimpleWebAuthn Example", // service name
    id: "localhost", // domain
  };

  // ref: https://simplewebauthn.dev/docs/packages/server#1-generate-registration-options
  const challengeOptions = generateRegistrationOptions({
    rpName: rp.name,
    rpID: rp.id,
    userID: user.uid,
    userName: user.email,
    timeout: 60000,
    attestationType: attestation,
    excludeCredentials,
    authenticatorSelection,
  });

  const challenge = challengeOptions.challenge;

  const opts: ChallengeRequestOptionsResponse = { ...options };
  opts.pubKeyCredParams = [];
  for (const alg of algorithms) {
    opts.pubKeyCredParams.push({ type: "public-key", alg });
  }

  return {
    userId: user.uid,
    options: opts,
    excludeCredentials,
    publicKeyCredentialParams,
    challenge,
  };
}

interface SigninRequestOptions {
  userVerification: UserVerificationRequirement;
}

export function signinRequestChallenge({
  userVerification = "required",
}: SigninRequestOptions) {
  // DBからユーザーがいるかどうかを検証
  const user = {
    uid: "0",
    email: "jj@example.com",
    credentials: [{ uid: "0", passwordHash: "hash" }],
  };

  if (user == null) {
    // 本来はサーバーサイドからエラーを返す 404 とか
    return null;
  }

  return generateAuthenticationOptions({
    rpID: "localhost",
    allowCredentials: [],
    userVerification,
  });
}

export function signinRequest(challenge: string) {
  // DBからユーザーがいるかどうかを検証
  const user = {
    uid: "0",
    email: "jj@example.com",
    credentials: [{ uid: "0", passwordHash: "hash" }],
  };

  // ref: https://simplewebauthn.dev/docs/packages/server#2-verify-authentication-response
  const verification = verifyAuthenticationResponse({
    response: {} as any,
    expectedChallenge: challenge,
    expectedOrigin: "http://localhost:3000",
    expectedRPID: "localhost",
    authenticator: {} as any,
  });
}
