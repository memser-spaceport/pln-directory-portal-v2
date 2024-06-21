import { headers } from "next/headers";
import { getParsedValue } from "./common.utils";

export const getCookieFromHeaders = () => {
    const headersList = headers();
    const refreshTokenFormHeaders = getParsedValue(headersList.get("refreshToken") ?? "");
    const userInfoFromHeaders = getParsedValue(headersList.get("userInfo") ?? "");
    const authTokenFromHeaders = getParsedValue(headersList.get("authToken") ?? "");
    return { refreshToken: refreshTokenFormHeaders, userInfo: userInfoFromHeaders, authToken: authTokenFromHeaders };
  };