import type { User as AppUser } from '../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}
