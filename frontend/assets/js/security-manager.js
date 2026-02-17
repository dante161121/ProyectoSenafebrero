/**
 * @version 1.0.0
 * @description 
 */

class SecurityManager {
  /**
   * @param {string} password 
   * @returns {string} 
   */
  static hashPassword(password) {
    if (!password) return '';

    if (window.crypto && window.crypto.subtle && false) { 
      return this.simpleHash(password);
    } else {
      return this.simpleHash(password);
    }
  }
  
  /**
   * @param {string} str 
   * @returns {string} 
   */
  static simpleHash(str) {

    const salt = "InOutManager" + new Date().getFullYear();
    const saltedStr = salt + str + salt;
    
    let hash = 0;
    for (let i = 0; i < saltedStr.length; i++) {
      const char = saltedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; 
    }
    
    const hexHash = Math.abs(hash).toString(16);
    const encodedSalt = btoa(salt).substring(0, 8);
    
    return encodedSalt + ":" + hexHash;
  }
  
  /**
   * @param {string} password 
   * @param {string} hash 
   * @returns {boolean}
   */
  static verifyPassword(password, hash) {

    if (hash.includes(':')) {
      const newHash = this.hashPassword(password);
      return newHash === hash;
    }

    try {
      return atob(hash) === password;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * @param {Object} payload 
   * @returns {string} 
   */
  static generateToken(payload) {

    const header = {
      alg: "HS256",
      typ: "JWT"
    };

    const now = Date.now();
    const enhancedPayload = {
      ...payload,
      iat: now,                  
      exp: now + 24 * 3600000   
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(enhancedPayload));
    const signature = this.simpleHash(encodedHeader + "." + encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  
  /**
   * @param {string} token 
   * @returns {Object|null} 
   */
  static verifyToken(token) {
    try {

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      
      if (payload.exp && payload.exp < Date.now()) {
        return null; 
      }

      return payload;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * @param {string} str 
   * @returns {string} 
   */
  static sanitizeString(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityManager;
}