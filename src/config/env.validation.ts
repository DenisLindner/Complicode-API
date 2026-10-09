import Joi from 'joi';

/** A string that is required only when `field` equals `value`. */
function requiredWhen(field: string, value: string) {
  return Joi.string().when(field, {
    is: value,
    // oxlint-disable-next-line unicorn/no-thenable -- Joi's conditional API
    then: Joi.required(),
    otherwise: Joi.allow(''),
  });
}

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3001'),
  DATABASE_URL: Joi.string().uri().required(),
  KEYCLOAK_URL: Joi.string().uri().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_CLIENT_SECRET: Joi.string().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().port().required(),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().required(),
  WHATSAPP_PROVIDER: Joi.string().valid('console', 'meta').default('console'),
  WHATSAPP_META_API_VERSION: Joi.string().default('v23.0'),
  WHATSAPP_META_PHONE_NUMBER_ID: requiredWhen('WHATSAPP_PROVIDER', 'meta'),
  WHATSAPP_META_ACCESS_TOKEN: requiredWhen('WHATSAPP_PROVIDER', 'meta'),
  WHATSAPP_META_TEMPLATE_NAME: Joi.string().default('verification_code'),
  WHATSAPP_META_TEMPLATE_LANGUAGE: Joi.string().default('pt_BR'),
  GEMINI_API_KEY: Joi.string().required(),
  GEMINI_MODEL: Joi.string().default('gemini-flash-latest'),
});
