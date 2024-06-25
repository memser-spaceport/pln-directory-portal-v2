

export const getFocusAreas = async (type: string, queryParams: any) => {
    const includeFriends = queryParams?.includeFriends ?? 'false';
    const officeHoursFilter = queryParams?.officeHoursOnly ?? false;
    const url = `${process.env.WEB_API_BASE_URL}/v1/focus-areas?type=${type}&plnFriend=${includeFriends}&officeHours=${officeHoursFilter}&${new URLSearchParams(queryParams)}`;

    console.log("url is", url);
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response?.ok) {
        return { error: { statusText: response?.statusText } };
    }
    return await {data: await response.json()};
};