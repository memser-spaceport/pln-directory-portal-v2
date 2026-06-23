export const AUTH_RETURN_HASH_KEY = 'auth_return_hash';

export function consumeAuthReturnHash(): string | null {
  const returnHash = sessionStorage.getItem(AUTH_RETURN_HASH_KEY);
  if (returnHash) {
    sessionStorage.removeItem(AUTH_RETURN_HASH_KEY);
  }
  return returnHash;
}
