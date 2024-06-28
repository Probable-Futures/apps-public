import { sendEmail } from "../ses";

const emailStartOfTheList = `Here are the resources:
  <ol>
    <li>
      <a href="https://probablefutures.org/maps/">Climate maps</a>. Our climate maps are publicly available to everyone. The other resources below are simply other ways
        of accessing or analyzing the data in these same climate maps.
    </li>`;

const customizableMapsPart = `<li>
  Customizable climate maps. If you would like to create custom climate maps, you have a few options. To embed the
  in an article or webpage, use our <a href="https://docs.probablefutures.org/embeddable-maps/embeddable">embeddable climate maps</a>. To create custom maps using our climate map
  layers with Mapbox, begin with the <a href="https://docs.probablefutures.org/mapbox-quick-start/">quick-start guide</a> or visit the <a href="https://docs.probablefutures.org/tilesets/">tilesets page</a> of our docs to learn how to use the map
  layers called tilesets.
</li>`;

const thanksPart = `
  </ol>
  <p>
    Let me know if you have questions. Thanks for joining us in our efforts to help people explore the risks and consequences
    of climate change.
  </p>

  <br />
  <br />
  <span>Peter</span>
  <br />
  ———
  <br />
  <span>Probable Futures</span>
  <br />
  <span>Peter Croce, Product Lead</span>
  <br />
  <span>he/him</span>
`;

export const composeEmail = ({
  firstName,
  authClient,
  authUser,
  note = "Thanks for reaching out.",
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
  const dotAddedToNote = note.endsWith(".") ? note : note + ".";

  const emailIntro = `
    <p>
      ${dotAddedToNote} If you'd like, I would be happy to meet on a call to give you a guided demo and answer any
      questions. You can <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2TEZX3fp1ty-JZr8iIVE5K8tmEE8AAyDLXvAm8Iqn1bo4xEWDtuw1rC_AAt7maw6iiybODG3mH">schedule a time on my calendar here</a>.
    </p>
    <p>
      If you haven't already done so, I would recommend you read (or listen to) the 
      <a href="https://probablefutures.org/stability/">climate handbook</a> on the Probable Futures website. It provides essential context for interpreting the maps and data you will find in the resources below.
    </p>`;

  let finalEmail = greetingPart + emailIntro;

  finalEmail += emailStartOfTheList;
  // request access to api
  if (authClient) {
    finalEmail += `
        <li>
          API. Find below a client ID and client secret for you to use to access the API. Please save these
          credentials somewhere. Instructions for API access are on the <a href="https://docs.probablefutures.org/api-access/">API access</a> and <a href="https://docs.probablefutures.org/calling-the-api/">calling the API</a> pages in the docs.
          <br />
          <br />
          <b>Client ID:</b> ${authClient.client_id}
          <br />
          <b>Client Secret:</b> ${authClient.client_secret}
          <br />
        </li>
      `;
  }
  // request access to pro
  if (authUser) {
    finalEmail += `
      <li>
        <a href="https://pro.probablefutures.org/">Probable Futures Pro</a>. This visualization and analysis tool contains all the same climate maps, but also enables you to
        upload and overlay any geospatial data on top of the climate maps. To get started, please log in using Google, Slack or using your email and password:
        <br />
        <br />
        <b>Email:</b> ${authUser.email}
        <br />
        <b>Password:</b> ${authUser.password}
        <br />
        <span>If you are unable to log in, let me know.</span>
      </li>
      <li>
        Download the data. If you would like to download the data in our climate maps directly, go to the <a href="https://pro.probablefutures.org/dashboard/datasets">datasets tab in
        Probable Futures Pro</a>. The data is available to download in CSV, GeoJSON, and NetCDF formats.
      </li> 
    `;
  }
  finalEmail += customizableMapsPart + thanksPart;
  return finalEmail;
};

const sendAccessEmail = async (userEmail: string, emailBody: string) => {
  return await sendEmail(userEmail, "Access to Probable Futures data resources", emailBody);
};
export default sendAccessEmail;
