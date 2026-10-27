import type { User } from '../modules/users/model.js';
declare global {
  namespace Express {
    interface Request { user?: User & { _id: import('mongoose').Types.ObjectId }; }
  }
}
export {};
