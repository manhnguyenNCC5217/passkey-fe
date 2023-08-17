import { decodeToken } from "@services/firebaseAuthService";
import {
  createUserDevice,
  findUserWithDevicesByAuthUid,
} from "@services/prisma";
import type {
  VerifiedRegistrationResponse,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type { RegistrationResponseJSON } from "@simplewebauthn/typescript-types";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import { ironOptions } from "../config";

const rpID = process.env.RP_ID as string;
const expectedOrigin = process.env.ORIGIN_URL as string;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, headers } = req;

  switch (method) {
    case "POST":
      const token = headers["authorization"];

      const decodedToken = await decodeToken(token || "");
      const authUId = decodedToken?.uid;
      const email = decodedToken?.email;

      if (!authUId || !email) {
        return res.status(404).json({ message: "User Not Found!" });
      }

      let user = await findUserWithDevicesByAuthUid(authUId);

      if (!user) {
        return res.status(404).json({ message: "User Not Found!" });
      }

      const body: RegistrationResponseJSON = req.body;

      const expectedChallenge = req.session.currentChallenge;

      let verification: VerifiedRegistrationResponse;
      try {
        const opts: VerifyRegistrationResponseOpts = {
          response: body,
          expectedChallenge: `${expectedChallenge}`,
          expectedOrigin,
          expectedRPID: rpID,
          requireUserVerification: true,
        };
        verification = await verifyRegistrationResponse(opts);
      } catch (error) {
        const _error = error as Error;
        console.error(_error);
        return res.status(400).send({ error: _error.message });
      }

      const { verified, registrationInfo } = verification;

      if (verified && registrationInfo) {
        const { credentialPublicKey, credentialID, counter } = registrationInfo;

        const credentialIDStr = isoBase64URL.fromBuffer(credentialID);
        const existingDevice = user.devices.find(
          (device) => device.credentialID == credentialIDStr
        );

        if (!existingDevice) {
          /**
           * Add the returned device to the user's list of devices
           */
          await createUserDevice({
            data: JSON.stringify(registrationInfo),
            userAuthId: authUId,
            credentialID: isoBase64URL.fromBuffer(credentialID),
            credentialPublicKey: isoBase64URL.fromBuffer(credentialPublicKey),
            transports: JSON.stringify(body.response.transports),
            counter: counter,
          });
        }
      }

      req.session.currentChallenge = undefined;
      await req.session.save();

      return res.send({ verified });
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
