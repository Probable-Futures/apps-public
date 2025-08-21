import { sendEmail } from "../ses";
import { AuthClient } from "./client";
import {
  customizableMapsPart,
  defaultClosingValue,
  defaultNoteValue,
  emailSignature,
  emailStartOfTheList,
  joinSlackMessage,
} from "../../utils/emailConsts";

export const composeEmail = ({
  firstName,
  authClient,
  authUser,
  includeCustomizableMaps,
  note = defaultNoteValue,
  closing = defaultClosingValue,
}: {
  firstName: string;
  authClient?: AuthClient;
  authUser?: {
    userId: string;
    email: string;
  };
  note?: string;
  closing?: string;
  includeCustomizableMaps: boolean;
}) => {
  const greetingPart = `Hi ${firstName},`;

  const emailIntro = note;

  let resourcesList = "";
  let finalEmail = greetingPart + emailIntro;

  // request access to pro
  if (authUser) {
    resourcesList += `
      <li>
        <a href="https://pro.probablefutures.org/">Probable Futures Pro</a> enables anyone to overlay any location data on the climate maps or download the climate data directly. To log in for the first time, please use the "Forgot Password" option to set a password, or log in with Google. If you are unable to log in, just reply to this email and let me know.
      </li>
      <li>
        Download the data. If you would like to download the data in our climate maps directly, go to the <a href="https://pro.probablefutures.org/dashboard/datasets">"Datasets" tab in
        Probable Futures Pro</a>. The data is available to download in CSV, GeoJSON, and NetCDF formats.
      </li>
    `;
  }
  if (includeCustomizableMaps) {
    resourcesList += customizableMapsPart;
  }
  // request access to api
  if (authClient) {
    resourcesList += `
        <li>
          Data API for getting numeric climate dat about specific locations. Your client ID and client secret to access the API are below. Instructions for API access are on the <a href="https://docs.probablefutures.org/data-api-access/">API access</a> and <a href="https://docs.probablefutures.org/data-api-calls/">calling the API</a> pages in the docs.
          <br />
          <br />
          <b>Client ID:</b> ${authClient.client_id}
          <br />
          <b>Client Secret:</b> ${authClient.client_secret}
          <br />
        </li>
      `;
  }
  if (resourcesList !== "") {
    finalEmail += emailStartOfTheList + resourcesList + "</ol>";
  }
  finalEmail += joinSlackMessage + closing + emailSignature;
  return finalEmail;
};

const sendAccessEmail = async (userEmail: string, emailBody: string) => {
  return await sendEmail(userEmail, "Access to Probable Futures data resources", emailBody);
};

export default sendAccessEmail;
