import express from "express";

import {
  createContact,
  NewContact,
  getSubscriber,
  Status,
} from "../../services/mailchimp/mailchimp";
import { validateFormData } from "./parameters";
import { serialize } from "../../utils/error";

const router = express.Router();

const enum MergeField {
  IncludeAnswers = "INCLUDE",
  FName = "FNAME",
  LName = "LNAME",
}

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const formData = await validateFormData(data);
    let statusToSend: Status = "subscribed";

    if (!formData.subscribeToEmails) {
      statusToSend = "unsubscribed";
    } else {
      const user = await getSubscriber(formData.emailAddress);
      statusToSend = user?.status === "subscribed" ? "subscribed" : "pending";
    }

    const newContact: NewContact = {
      emailAddress: formData.emailAddress,
      mergeFields: {
        [MergeField.IncludeAnswers]: +formData.includeAnswers,
        [MergeField.FName]: formData.firstName,
        [MergeField.LName]: formData.lastName,
      },
      status: statusToSend,
    };

    const { contactId, status, emailAddress } = await createContact(newContact);
    res.status(201).send({ data: { contactId, status, emailAddress } });
  } catch (error: any) {
    const status = "status" in error && typeof error.status === "number" ? error.status : 500;
    res.status(status).send(serialize(error));
  }
});

export default router;
