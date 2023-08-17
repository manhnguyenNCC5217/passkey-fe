import { decodeToken } from "@services/firebaseAuthService";
import { findOneByAuthUid } from "@services/prisma";
import type { GenerateRegistrationOptionsOpts } from "@simplewebauthn/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import { ironOptions } from "../config";

const rpID = process.env.RP_ID as string;

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

      let user = await findOneByAuthUid(authUId);

      if (!user) {
        return res.status(404).json({ message: "User Not Found!" });
      }

      // const {
      //   /**
      //    * The username can be a human-readable name, email, etc... as it is intended only for display.
      //    */
      //   username,
      //   devices,
      // } = user;

      const opts: GenerateRegistrationOptionsOpts = {
        rpName: "SimpleWebAuthn Example",
        rpID,
        userID: user.authId,
        userName: user.email,
        timeout: 60000,
        attestationType: "none",
        /**
         * Passing in a user's list of already-registered authenticator IDs here prevents users from
         * registering the same device multiple times. The authenticator will simply throw an error in
         * the browser if it's asked to perform registration when one of these ID's already resides
         * on it.
         */
        // excludeCredentials: devices.map((dev: any) => ({
        //   id: dev.credentialID,
        //   type: "public-key",
        //   transports: dev.transports,
        // })),
        authenticatorSelection: {
          residentKey: "required",
        },
        /**
         * Support the two most common algorithms: ES256, and RS256
         */
        supportedAlgorithmIDs: [-7, -257],
      };

      const options = generateRegistrationOptions(opts);

      /**
       * The server needs to temporarily remember this value for verification, so don't lose it until
       * after you verify an authenticator response.
       */
      req.session.currentChallenge = options.challenge;
      await req.session.save();

      return res.send(options);
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
