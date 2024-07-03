import { sendEmail } from "../ses";

const emailStartOfTheList = `Here are the resources:
  <ol>`;

const customizableMapsPart = `<li>
  Customizable climate maps. If you would like to create custom climate maps, you have a few options. Learn more in the <a href="https://docs.probablefutures.org/use-the-maps/">Use the maps</a> section of our docs.
</li>`;

const thanksPart = `
  </ol>
  <p>
    Let me know if you have questions. Thanks for joining us in our efforts to help people explore the risks and consequences
    of climate change.
  </p>
  <br />
  <div style="margin:0in;line-height:19.2px;font-size:12pt;font-family:Calibri,sans-serif;color:rgb(0,0,0)">
    <span style="font-family:Helvetica;color:rgb(42,23,45)">—</span>
    <span style="font-family:Helvetica;color:rgb(133,31,255)">—</span>
    <span style="font-family:Helvetica;color:rgb(241,128,60)">—</span>
  </div>
  <div style="margin:0in;line-height:19.2px;font-size:12pt;font-family:Calibri,sans-serif;color:rgb(0,0,0)">
    <b style="font-family:Calibri,sans-serif">
      <span style="font-size:7.5pt;line-height:12px;font-family:Helvetica;color:rgb(42,23,45)">
        <a href="https://probablefutures.org/" style="font-family:Helvetica;color:rgb(17,85,204)" target="_blank">
          Probable Futures
        </a>
      </span>
    </b>
  </div>
  <div style="margin:0in;line-height:19.2px;font-size:12pt;font-family:Calibri,sans-serif;color:rgb(0,0,0)">
    <span style="font-size:x-small;font-family:Calibri,sans-serif">Peter Croce, Product Lead</span>
  </div>
  <div style="margin:0in;line-height:19.2px;font-family:Calibri,sans-serif;color:rgb(0,0,0)">
    <span style="font-size:x-small;font-family:Calibri,sans-serif">he/him</span>
    <font size="1" style="font-family:Calibri,sans-serif;color:rgb(0,0,0)"><br></font>
  </div>
`;

const defaultNoteValue = `Thanks for reaching out. If you'd like, I would be happy to meet on a call to give you a guided demo and answer any
      questions. You can <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2TEZX3fp1ty-JZr8iIVE5K8tmEE8AAyDLXvAm8Iqn1bo4xEWDtuw1rC_AAt7maw6iiybODG3mH">schedule a time on my calendar here</a>`;

export const composeEmail = ({
  firstName,
  authClient,
  authUser,
  note = defaultNoteValue,
}: {
  firstName: string;
  authClient?: any;
  authUser?: {
    userId: string;
    password: string;
    email: string;
  };
  note?: string;
}) => {
  const greetingPart = `Hi ${firstName},`;

  const emailIntro = `
    <p>
      ${note}.
    </p>
    <p>
      If you haven't already done so, I would recommend you read (or listen to) the 
      <a href="https://probablefutures.org/stability/">climate handbook</a> on the Probable Futures website. It provides essential context for interpreting the maps and data you will find in the resources below. 
      You may also be aware of our <a href="https://probablefutures.org/maps">climate maps</a>, which are publicly available. The resources below are simply other ways of accessing or analyzing the data in these same climate maps.
    </p>`;

  let finalEmail = greetingPart + emailIntro + emailStartOfTheList;

  // request access to pro
  if (authUser) {
    finalEmail += `
      <li>
        <a href="https://pro.probablefutures.org/">Probable Futures Pro</a>. This visualization and analysis tool enables anyone to
        upload and overlay any geospatial data on top of the climate maps. To get started, please log in using Google, Slack or using your email and password below. If you are unable to log in, let me know.
        <br />
        <br />
        <b>Email:</b> ${authUser.email}
        <br />
        <b>Password:</b> ${authUser.password}
        <br />
      </li>
      <li>
        Download the data. If you would like to download the data in our climate maps directly, go to the <a href="https://pro.probablefutures.org/dashboard/datasets">"Datasets" tab in
        Probable Futures Pro</a>. The data is available to download in CSV, GeoJSON, and NetCDF formats.
      </li> 
    `;
  }
  finalEmail += customizableMapsPart;
  // request access to api
  if (authClient) {
    finalEmail += `
        <li>
          API. Your client ID and client secret to access the API are below. Instructions for API access are on the <a href="https://docs.probablefutures.org/api-access/">API access</a> and <a href="https://docs.probablefutures.org/calling-the-api/">calling the API</a> pages in the docs.
          <br />
          <br />
          <b>Client ID:</b> ${authClient.client_id}
          <br />
          <b>Client Secret:</b> ${authClient.client_secret}
          <br />
        </li>
      `;
  }
  finalEmail += thanksPart;
  return finalEmail;
};

const sendAccessEmail = async (userEmail: string, emailBody: string) => {
  return await sendEmail(userEmail, "Access to Probable Futures data resources", emailBody);
};
export default sendAccessEmail;
