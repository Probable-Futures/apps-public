import express, { Request, Response } from "express";

import { createContact } from "../../services/mailchimp/mailchimp";
import { validateFormData } from "./parameters";
import { serialize } from "../../utils/error";
import { NewContact, Status } from "../../services/mailchimp/mailchimp.types";
import { getGroups } from "../../services/mailchimp/groups";
import { getTags } from "../../services/mailchimp/tags";
import { getSubscriber } from "../../services/mailchimp/member";

const router = express.Router();

export const enum MergeField {
  IncludeAnswers = "INCLUDE",
  FName = "FNAME",
  LName = "LNAME",
}

const handleCreateContact = async (req: Request, res: Response) => {
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

    let interests = undefined,
      tags = undefined;

    if (formData.interests?.length) {
      interests = Object.fromEntries(formData.interests?.map((interestId) => [interestId, true]));
    }

    if (formData.tags?.length) {
      tags = formData.tags.map((tag) => ({ name: tag, status: "active" }));
    }

    const newContact: NewContact = {
      emailAddress: formData.emailAddress,
      mergeFields: {
        [MergeField.IncludeAnswers]: +formData.includeAnswers,
        [MergeField.FName]: formData.firstName,
        [MergeField.LName]: formData.lastName,
      },
      status: statusToSend,
      tags,
      interests,
    };

    const { contactId, status, emailAddress } = await createContact(newContact);
    res.status(201).send({ data: { contactId, status, emailAddress } });
  } catch (error: any) {
    const status = "status" in error && typeof error.status === "number" ? error.status : 500;
    res.status(status).send(serialize(error));
  }
};

router.post("/create", handleCreateContact);

router.post("/", handleCreateContact);

router.get("/tags", async (_, res) => {
  try {
    const tags = await getTags();
    res.status(201).send({ data: { tags } });
  } catch (error: any) {
    const status = "status" in error && typeof error.status === "number" ? error.status : 500;
    res.status(status).send(serialize(error));
  }
});

router.get("/groups", async (_, res) => {
  try {
    const groups = await getGroups();
    res.status(201).send({ data: { groups } });
  } catch (error: any) {
    const status = "status" in error && typeof error.status === "number" ? error.status : 500;
    res.status(status).send(serialize(error));
  }
});

export default router;
