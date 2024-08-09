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

    const result = await response?.json()
    if (!response.ok) {
        return {
            error: { status: response?.status, statusText: response?.statusText, data: result },
        }
    }
    return { data: result };
}

export const getFollowUps = async (logInMemberUid: string, authToken: string, status: string) => {
    const requestOptions: any = {
        method: "GET",
        headers: getHeader(authToken),
        redirect: "follow",
        cache: 'no-store',
    }

    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${logInMemberUid}/interactions/follow-ups?status=${status}&orderBy=-createdAt`,
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
    const result = await response.json();
    if (!response?.ok) {
        return {
            error: {
                status: response.status, statusText: response.statusText,
                data: result
            }
        }
    }
    return { data: result };
}


export const patchFollowup = async (authToken: string, logInMemberUid: string, interactionUid: string, followUpId: string) => {
    const requestOptions: any = {
        method: "PATCH",
        headers: getHeader(authToken),
        body: JSON.stringify({}),
        redirect: "follow",
        cache: 'no-store',
    };

    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${logInMemberUid}/interactions/${interactionUid}/follow-ups/${followUpId}`,
        requestOptions,
    )

    const result = await response.json();
    if (!response?.ok) {
        return {
            error: { status: response?.status, statusText: response?.statusText },
        }
    }
    return { data: result };

}