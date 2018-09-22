import { isEmail as foreignIsEmail } from 'validator';

/**
 * My arbitrary rule is that Names should be 3 chars and above.
 * We'll most likely remove this.
 * @param name
 */
export const isName = (name:string='') => {
  return name.length >= 3;
};

/**
 * Validates emails without blowing up on non-strings
 * @param email 
 */
export const isEmail = (email:string='') => {
  return foreignIsEmail(email);
}