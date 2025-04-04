export interface AccessToken {
  _id: string;
  name: string;
  _member?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  creationDate: number;
  customRoleIds?: string[];
  inlineRole?: Array<{ effect: string }>;
  role?: string;
  serviceToken: boolean;
  defaultApiVersion: number;
  lastUsed: number;
  lastModified?: number;
}

export interface TokensResponse {
  items: AccessToken[];
  totalCount: number;
  _links: {
    self?: { href: string };
    next?: { href: string };
    prev?: { href: string };
  };
}

export interface ResetTokenResponse {
  token: string;
}

export type SortField = 'name' | 'owner' | 'creationDate' | 'role' | 'apiVersion' | 'lastUsed' | 'lastModified';
export type SortDirection = 'asc' | 'desc';

export type TokenType = 'service' | 'personal';

export interface TokenFilters {
  type: TokenType | 'all';
} 