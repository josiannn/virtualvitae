
export interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
}

export interface Vent {
  id: string;
  content: string;
  timestamp: number;
  aiResponse?: string;
  userDetails: UserDetails;
}

export type AppView = 'onboarding' | 'venting' | 'history';
