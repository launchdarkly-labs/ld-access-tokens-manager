import { format } from 'date-fns';
import { AccessToken } from '../types/AccessToken';

export const determineRole = (token: AccessToken): string => {
  if (token.customRoleIds?.length) {
    return 'Custom Roles';
  }
  if (token.inlineRole?.length) {
    return 'Inline Role';
  }
  return token.role || 'Unknown';
};

export const formatDate = (timestamp: number): string => {
  try {
    if (!timestamp) return 'Never';
    // Convert timestamp to milliseconds if it's in seconds
    const timestampInMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    const date = new Date(timestampInMs);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    return format(date, 'PPP');
  } catch (err) {
    return 'Invalid date';
  }
}; 