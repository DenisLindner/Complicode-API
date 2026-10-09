import type { User as AppUser } from '../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
      /** True when the request came from the frontend server (BFF). */
      fromFrontendServer?: boolean;
    }
  }
}
