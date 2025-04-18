export type UserRole = {
  owner: boolean;
  host: boolean;
};

export type Location = {
  lat: number;
  lng: number;
};

export type Services = {
  walk: boolean;
  daycare: boolean;
  boarding: boolean;
};

export type User = {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  location: Location;
  services: Services;
  breedsPreferred: string[];
  createdAt: Date;
};

export type Dog = {
  id: string;
  ownerUid: string;
  name: string;
  breed: string;
  size: 'S' | 'M' | 'L' | 'XL';
  age: number;
  temperament: string[];
  vaccinated: boolean;
};

export type JobStatus = 'open' | 'matched' | 'closed';

export type Job = {
  id: string;
  ownerUid: string;
  dogIds: string[];
  serviceType: 'walk' | 'daycare' | 'boarding';
  startDate: Date;
  endDate: Date;
  recurring: boolean;
  location: Location;
  description: string;
  status: JobStatus;
};

export type Message = {
  senderUid: string;
  text: string;
  createdAt: Date;
};

export type MessageThread = {
  threadId: string;
  participantUids: string[];
  jobId?: string;
  messages: Message[];
};

export type Report = {
  id: string;
  reporterUid: string;
  targetUserUid?: string;
  targetJobId?: string;
  reason: string;
  createdAt: Date;
}; 