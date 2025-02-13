'use server'
export const getAllProjects = async (queryParams: any, currentPage: number, limit = 0) => {
    const requestOptions: RequestInit = { method: "GET",  cache: 'force-cache', next: { tags: ['project-list']}};
    const response = await fetch(
        `${process.env.DIRECTORY_API_URL}/v1/projects?page=${currentPage}&limit=${limit}&${new URLSearchParams(queryParams)}`,
        requestOptions
    );
    const result = await response.json();
    if (!response?.ok) {
        return { error: { statusText: response?.statusText } };
    }
    const formattedData = result?.projects?.map((project: any) => {
        return {
            id: project?.uid,
            name: project?.name,
            logo: project?.logo?.url,
            description: project?.description,
            maintainingTeam: project?.maintainingTeam,
            lookingForFunding: project?.lookingForFunding,
            tagline: project?.tagline,
        };
    });
    return { data: { formattedData, totalProjects: result?.count } };
};