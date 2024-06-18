import Cookies from "js-cookie";

export const clearAllAuthCookies = () => {
    Cookies.remove("directory_idToken");
    Cookies.remove("verified", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
    Cookies.remove("directory_isEmailVerification");
    Cookies.remove("authToken", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
    Cookies.remove("refreshToken", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
    Cookies.remove("userInfo", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
    Cookies.remove("page_params", { path: "/", domain: process.env.COOKIE_DOMAIN || "" });
  };