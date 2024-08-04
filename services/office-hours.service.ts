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

    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${logInMemberUid}/interactions/follow-ups`,
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

export const createFeedBack = async (logInMemberUid: string, followupUid: string, authToken: string, data: any) => {
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

    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${logInMemberUid}/follow-ups/${followupUid}/feedbacks`,
        requestOptions,
    )
    if (!response?.ok) {
        return {
            error: {
                status: response.status, statusText: response.statusText,
            }
        }
    }
    const result = await response.json();
    return { data: result };
}