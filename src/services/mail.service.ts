import MailerLite from "@mailerlite/mailerlite-nodejs";
const mailerlite = new MailerLite({
  api_key: process.env.MAILERLITE_API_KEY as string,
});

export const sendEmail = (to: string, subject: string, html: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`📧 Dummy email sent to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML:\n${html}`);
      resolve(true);
    }, 1000);
  });
};
