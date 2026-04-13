export const APP_NAME = 'EPDE';
export const API_VERSION = 'v1';

export const PAGINATION_DEFAULT_TAKE = 20;
export const PAGINATION_MAX_TAKE = 100;
export const TASKS_MAX_TAKE = 500;

export const BCRYPT_SALT_ROUNDS = 12;

export const JWT_ACCESS_EXPIRATION = '15m';
export const JWT_REFRESH_EXPIRATION = '7d';

/** Initial subscription duration in days after first activation (set-password).
 * 180 days (6 months) gives clients enough time to complete 2 quarterly cycles,
 * accumulate ISV trend data, and build dependency on the platform before renewal. */
export const SUBSCRIPTION_INITIAL_DAYS = 180;
/** Days before expiration to send reminder notifications. */
export const SUBSCRIPTION_REMINDER_DAYS = [7, 3, 1] as const;
/** WhatsApp contact number for subscription renewal and support. */
export const WHATSAPP_CONTACT_NUMBER = '5493435043696';

export const CLIENT_TYPE_HEADER = 'x-client-type' as const;
export const CLIENT_TYPES = { MOBILE: 'mobile', WEB: 'web' } as const;
export type ClientType = (typeof CLIENT_TYPES)[keyof typeof CLIENT_TYPES];
