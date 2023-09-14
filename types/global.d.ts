import { Profile } from '../src/entities/request-profile/types';

export declare global {
  interface Window {
    CLOUDHOOD_BROWSER_EXTENSION: Profile;
  }
}
