import Joi from 'joi';
import { ABACATEPAY_WEBHOOK_PUBLIC_KEY } from '../payment/payment.constants';

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
  TELEGRAM_BOT_TOKEN: Joi.string().required(),
  TELEGRAM_BOT_USERNAME: Joi.string().required(),
  TELEGRAM_UPDATES_MODE: Joi.string()
    .valid('polling', 'webhook', 'disabled')
    .default('polling'),
  TELEGRAM_WEBHOOK_URL: requiredWhen('TELEGRAM_UPDATES_MODE', 'webhook'),
  TELEGRAM_WEBHOOK_SECRET: requiredWhen('TELEGRAM_UPDATES_MODE', 'webhook'),
  GEMINI_API_KEY: Joi.string().required(),
  GEMINI_MODEL: Joi.string().default('gemini-flash-latest'),
  GEMINI_FALLBACK_MODELS: Joi.string()
    .allow('')
    .default('gemini-3.5-flash,gemini-flash-lite-latest'),
  ABACATEPAY_API_URL: Joi.string()
    .uri()
    .default('https://api.abacatepay.com/v2'),
  ABACATEPAY_API_KEY: Joi.string().required(),
  ABACATEPAY_WEBHOOK_SECRET: Joi.string().min(16).required(),
  ABACATEPAY_WEBHOOK_PUBLIC_KEY: Joi.string().default(
    ABACATEPAY_WEBHOOK_PUBLIC_KEY,
  ),
  ABACATEPAY_CREDITS_PRODUCT_ID: Joi.string().required(),
});
