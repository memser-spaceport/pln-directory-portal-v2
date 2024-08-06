import Cookies from "js-cookie";
import { getParsedValue } from "./common.utils";

export const clearAllAuthCookies = () => {
    Cookies.remove("directory_idToken");
    Cookies.remove("verified", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
    Cookies.remove("directory_isEmailVerification");
    Cookies.remove("authToken", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
    Cookies.remove("refreshToken", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
    Cookies.remove("userInfo", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
    Cookies.remove("page_params", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
    Cookies.remove('privy-token');
    Cookies.remove('privy-session');
    Cookies.remove('authLinkedAccounts');
    Cookies.remove('lastRatingCall')
    Cookies.remove('privy-refresh-token');
    localStorage.clear();
  };


  export const getUserInfo = () => {
    const userInfo = getParsedValue(Cookies.get('userInfo') ||  "");
  
    if (userInfo) {
      return {
        name: userInfo?.name,
        email: userInfo?.email,
        roles: userInfo?.roles,
      };
    } else {
      return null;
    }
  };