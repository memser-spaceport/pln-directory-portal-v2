import { IMemberListOptions } from "@/types/members.types";
import { getHeader } from "@/utils/common.utils";
import { parseMemberDetails } from "@/utils/member.utils";

export const getMembers = async (options: IMemberListOptions, teamId: string, currentPage: number, limit: number, isLoggedIn: boolean) => {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members?page=${currentPage}&limit=${limit}&${new URLSearchParams(options as any)}`, {
      cache: "no-store",
      method: "GET",
      headers: getHeader(""),
    });
    if (!response?.ok) {
      return { error: { status: response?.status, statusText: response?.statusText } };
    }
    const result = await response?.json();
    const formattedData: any = parseMemberDetails(result, teamId, isLoggedIn);
    return { data: { formattedData, status: response?.status} };
  };