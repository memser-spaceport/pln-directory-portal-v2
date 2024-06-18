import { IUserInfo } from "@/types/shared.types";
import { EVENTS } from "./constants";

export const triggerLoader = (status: boolean) => {
  document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_LOADER, { detail: status }));
};

export const getParsedValue = (value: string) => {
  try {
    if (value) {
      return JSON.parse(value);
    }
    return "";
  } catch (error) {
    return "";
  }
};

export const getAnalyticsUserInfo = (userInfo: IUserInfo | null) => {
  if (userInfo?.name && userInfo?.email && userInfo?.roles) {
    return { name: userInfo?.name, email: userInfo?.email, roles: userInfo?.roles };
  }
  return null;
}
