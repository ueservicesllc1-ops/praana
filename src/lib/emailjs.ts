import emailjs from "@emailjs/browser";

export class EmailJsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailJsConfigurationError";
  }
}

type SendParams = Record<string, unknown>;

type EmailJsConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
};

const resolveConfig = (): EmailJsConfig => {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  if (!serviceId) {
    throw new EmailJsConfigurationError(
      "NEXT_PUBLIC_EMAILJS_SERVICE_ID is not defined. Set it in your environment variables."
    );
  }

  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  if (!templateId) {
    throw new EmailJsConfigurationError(
      "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID is not defined. Set it in your environment variables."
    );
  }

  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  if (!publicKey) {
    throw new EmailJsConfigurationError(
      "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY is not defined. Set it in your environment variables."
    );
  }

  return { serviceId, templateId, publicKey };
};

export const sendEmailJsTemplate = async (params: SendParams) => {
  const config = resolveConfig();
  await emailjs.send(config.serviceId, config.templateId, params, {
    publicKey: config.publicKey,
  });

  return { ok: true as const };
};

export const sendReservationConfirmation = async (params: SendParams) => {
  return sendEmailJsTemplate(params);
};


