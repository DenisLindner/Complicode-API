import { SetMetadata } from '@nestjs/common';

export const IS_EXTERNAL_KEY = 'isExternal';

/**
 * Marks routes called by third parties (webhooks), which do not send the
 * internal key and authenticate the request themselves.
 */
export const External = () => SetMetadata(IS_EXTERNAL_KEY, true);
