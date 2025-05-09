export interface AccountMember {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    creationDate: number;
    lastSeen?: number;
  }
  
  export interface MembersResponse {
    items: AccountMember[];
    totalCount: number;
    _links: {
      self?: { href: string };
      next?: { href: string };
      prev?: { href: string };
    };
  }