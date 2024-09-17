import express from "express";
import { serialize } from "../../utils/error";
import { submitToAirtable } from "../../services/donation/request";
import { verifyToken } from "../../middleware/verifyToken";
import { env } from "../../utils";
import { createContact } from "../../services/mailchimp/mailchimp";
import { MergeField } from "../contact";
import { getSubscriber } from "../../services/mailchimp/member";

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
  amount: string;
  netAmount: string;
  currency: string;
  frequency: "Monthly" | "One-time";
  donationDate: Date;
  privateNote: string;
  publicTestimony?: string;
}

const DonorTag = "Donor";

router.post("/", verifyToken, async (req, res) => {
  try {
    const data = req.body as EveryOrgObject;
    const apiKey = req.query.apiKeyForDonate as string | undefined;

    if (apiKey === env.API_KEY_FOR_DONATE_ENDPOINT) {
      const request = await submitToAirtable(data);

      if (request.ok) {
        res.status(200).send({ success: true, message: "Donation processed successfully." });
        if (data.email) {
          const user = await getSubscriber(data.email);
          const statusToSend = user?.status === "subscribed" ? "subscribed" : "pending";
          const tags = [{ name: DonorTag, status: "active" }];

          await createContact({
            emailAddress: data.email,
            status: statusToSend,
            tags,
            mergeFields: {
              [MergeField.IncludeAnswers]: true,
              [MergeField.FName]: data.firstName,
              [MergeField.LName]: data.lastName,
            },
          });
        }
      } else {
        const errorData = await request.json();
        console.error(errorData);
        res.status(request.status).send({ error: errorData });
      }
    } else {
      res.status(401).send({ error: "Unauthorized access." });
    }
  } catch (error: any) {
    const status = "status" in error && typeof error.status === "number" ? error.status : 500;
    console.error(error);
    res.status(status).send(serialize(error));
  }
});

export default router;
