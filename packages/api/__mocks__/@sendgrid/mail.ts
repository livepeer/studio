import { MailDataRequired } from "@sendgrid/helpers/classes/mail";

export default {
  setApiKey(apiKey: string) {
    if (!apiKey) {
      throw new Error("missing sendgrid api key");
    }
  },

  send(email: MailDataRequired) {
    const personalizations = email.personalizations[0];
    if (!personalizations.to[0].email) {
      throw new Error("missing send to email");
    }

    if (!personalizations.dynamicTemplateData.buttonUrl) {
      throw new Error("missing confirmation email buttonUrl");
    }

    if (!email.templateId) {
      throw new Error("missing template id");
    }

    if (!email.from["email"] || !email.from["name"]) {
      throw new Error("missing send from email or name");
    }
  },
};
