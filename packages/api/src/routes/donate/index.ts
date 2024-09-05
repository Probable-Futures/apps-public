import express from "express";
import * as env from "../../utils/env";
import { serialize } from "../../utils/error";
import { submitToAirtable } from "../../services/donation/request";

const router = express.Router();

export interface EveryOrgObject {
  chargeId: string;
  partnerDonationId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  toNonprofit: {
    slug: string;
    ein?: string;
    name: string;
  };
  amount: number;
  netAmount: string;
  currency: string;
  frequency: "Monthly" | "One-time";
  donationDate: string;
  privateNote: string;
  publicTestimony?: string;
}

router.post("/", async (req, res) => {
  try {
    const data = req.body as EveryOrgObject;
    const apiKey = req.query.apiKeyForDonate as string | undefined;

    if (apiKey === env.API_KEY_FOR_DONATE_ENDPOINT) {
      const request = await submitToAirtable(data);

      if (request.ok) {
        res.status(200).send({ success: true, message: "Donation processed successfully." });
      } else {
        const errorData = await request.json();
        res.status(request.status).send({ error: errorData });
      }
    } else {
      res.status(401).send({ error: "Unauthorized access." });
    }
  } catch (error: any) {
    const status = "status" in error && typeof error.status === "number" ? error.status : 500;
    res.status(status).send(serialize(error));
  }
});

export default router;
