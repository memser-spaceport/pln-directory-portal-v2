import { getHeader } from "@/utils/common.utils";

export const createFollowUp = async (logInMemberUid: string, authToken: string, data: any) => {
    const raw = JSON.stringify(data)
    const requestOptions: any = {
        method: "POST",
        headers: getHeader(authToken),
        body: raw,
        redirect: "follow",
        cache: 'no-store',
    };

    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${logInMemberUid}/interactions`,
        requestOptions,
    )

    if (!response.ok) {
        return {
            error: { status: response?.status, statusText: response?.statusText },
        }
    }
    const result = await response.json();
    return { data: result };
}

export const getFollowUps = async (logInMemberUid: string, authToken: string) => {
    const requestOptions: any = {
        method: "GET",
        headers: getHeader(authToken),
        redirect: "follow",
        cache: 'no-store',
    }

    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${logInMemberUid}/interactions/${logInMemberUid}/follow-ups`,
        requestOptions,
    )
    if (!response.ok) {
        return {
            error: { status: response?.status, statusText: response?.statusText },
        }
    }

    const result = await response.json();
    return { data: result };
}

export const createFeedBack = async (logInMemberUid: string, interactionUid: string, authToken: string, data: any) => {
    const raw = JSON.stringify(
        data
    )
    const requestOptions: any = {
        method: "POST",
        headers: getHeader(authToken),
        body: raw,
        redirect: "follow",
        cache: 'no-store'
      };

      const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${logInMemberUid}/interactions/${interactionUid}/feedbacks`,
        requestOptions,
      )

fetch("http://localhost:3000/v1/members/cly5oxx6z000k4602rzey4f6h/follow-ups/clyy9vkoq0002f5wzk29f6vav/feedbacks", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
}