import type { GenerateAuthenticationOptionsOpts } from "@simplewebauthn/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import { ironOptions } from "../config";

const rpID = process.env.RP_ID as string;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case "POST":
      const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        // allowCredentials: user.devices.map(dev => ({
        //   id: dev.credentialID,
        //   type: 'public-key',
        //   transports: dev.transports,
        // })),
        userVerification: "required",
        rpID,
      };

      const options = generateAuthenticationOptions(opts);

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
