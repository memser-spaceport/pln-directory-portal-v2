import { getHeader } from "@/utils/common.utils";



export const getAllMemberExperiences = async (memberUid: string) => {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/member-experiences/get-all-by-member-uid/${memberUid}`,
        {
            cache: 'force-cache',
            method: 'GET',
            next: { tags: ['member-detail'] },
            headers: getHeader(''),
        }
    );
    if (!response.ok) {
        throw new Error('Failed to fetch experiences');
    }
    return response.json();
}
