import { createCustomToken } from "@services/firebaseAuthService";
import {
  findUserWithDevicesByAuthUid,
  updateUserDevice,
} from "@services/prisma";
import type {
  VerifiedAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import type { AuthenticationResponseJSON } from "@simplewebauthn/typescript-types";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import { ironOptions } from "../config";

const rpID = process.env.RP_ID as string;
const expectedOrigin = process.env.ORIGIN_URL as string;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case "POST":
      const body: AuthenticationResponseJSON = req.body;

      const user = await findUserWithDevicesByAuthUid(
        body.response.userHandle as string
      );

      if (!user?.devices) {
        return res
          .status(400)
          .send({ error: "Authenticator is not registered with this site" });
      }

      const expectedChallenge = req.session.currentChallenge;

      let dbAuthenticator;
      const bodyCredIDBuffer = isoBase64URL.toBuffer(body.rawId);

      // "Query the DB" here for an authenticator matching `credentialID`
      for (const dev of user?.devices) {
        const crDecode = isoBase64URL.toBuffer(dev.credentialID);
        if (isoUint8Array.areEqual(crDecode, bodyCredIDBuffer)) {
          dbAuthenticator = dev;
          break;
        }
      }

      if (!dbAuthenticator) {
        return res
          .status(400)
          .send({ error: "Authenticator is not registered with this site" });
      }

      let verification: VerifiedAuthenticationResponse;
      try {
        const opts: VerifyAuthenticationResponseOpts = {
          response: body,
          expectedChallenge: `${expectedChallenge}`,
          expectedOrigin,
          expectedRPID: rpID,
          authenticator: {
            counter: dbAuthenticator.counter,
            credentialID: isoBase64URL.toBuffer(dbAuthenticator.credentialID),
            credentialPublicKey: isoBase64URL.toBuffer(
              dbAuthenticator.credentialPublicKey
            ),
            transports: JSON.parse(dbAuthenticator.transports),
          },
          requireUserVerification: true,
        };
        verification = await verifyAuthenticationResponse(opts);
      } catch (error) {
        const _error = error as Error;
        console.error(_error);
        return res.status(400).send({ error: _error.message });
      }

      const { verified, authenticationInfo } = verification;

      let firebaseToken;
      if (verified) {
        // Update the authenticator's counter in the DB to the newest count in the authentication
        await updateUserDevice(dbAuthenticator.id, {
          counter: authenticationInfo.newCounter,
        });

        firebaseToken = await createCustomToken(dbAuthenticator.userAuthId);
      }

      req.session.currentChallenge = undefined;
      await req.session.save();

      return res.send({ firebaseToken });
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
