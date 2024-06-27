import AWS from "aws-sdk";

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
): Promise<AWS.SES.SendEmailResponse | AWS.AWSError> => {
  return new Promise(async (resolve, reject) => {
    const params = {
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: { Data: text },
        },
        Subject: { Data: subject },
      },
      Source: "pcroce@probablefutures.org",
    };

    try {
      const data = await ses.sendEmail(params).promise();
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};

export { sendEmail };
