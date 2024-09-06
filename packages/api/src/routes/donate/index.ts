import express from "express";
import { serialize } from "../../utils/error";
import { submitToAirtable } from "../../services/donation/request";
import { verifyToken } from "../../middleware/verifyToken";
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
  donationDate: Date;
  privateNote: string;
  publicTestimony?: string;
}

router.post("/", verifyToken, async (req, res) => {
  try {
    const data = req.body as EveryOrgObject;
    const request = await submitToAirtable(data);

    if (request.ok) {
      res.status(200).send({ success: true, message: "Donation processed successfully." });
    } else {
      const errorData = await request.json();
      res.status(request.status).send({ error: errorData });
    }
  } catch (error: any) {
    const status = "status" in error && typeof error.status === "number" ? error.status : 500;
    res.status(status).send(serialize(error));
  }
});

export default router;
