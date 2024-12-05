import { getHeader} from "@/utils/common.utils"


export const getProject = async (id: string, options: any) => {
    const requestOPtions: RequestInit = { method: "GET", headers: getHeader(""), cache: "no-store" };
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/projects/${id}?${new URLSearchParams(options)}`, requestOPtions);
    if (!response?.ok) {
        return { error: { statusText: response?.statusText } }
    }

    const result = await response?.json();
    const formattedData = getFormattedProject(result);
    return { data: { formattedData } }
}

export const deleteProject = async (uid: string, authToken: string) => {
    const requestOptions = { method: "DELETE", headers: getHeader(authToken) };
    const response = await fetch(
        `${process.env.DIRECTORY_API_URL}/v1/projects/${uid}`,
        requestOptions,
    );
    if (!response?.ok) {
        return { error: { statusText: response?.statusText } };
    }
    const result = await response.json();

    return { data: result, ok: response?.ok, status: response?.status };
};


export const updateProject = async (
    uid: string,
    payload: any,
    authToken: string,
) => {
    const requestOptions: RequestInit = {
        method: "PUT",
        headers: getHeader(authToken),
         cache: "no-store",
        body: JSON.stringify(formatToSave(payload)),
    };
    const response = await fetch(
        `${process.env.DIRECTORY_API_URL}/v1/projects/${uid}`,
        requestOptions,
    );
    if (!response?.ok) {
        return { error: { statusText: response?.statusText } };
    }
    const result = await response.json();

    return { data: result, ok: response?.ok, status: response?.status };
};


const getFormattedProject = (project: any) => {
    try {
        const formattedProject: any = {};
        if (project) {
            formattedProject['id'] = project.uid ?? '';
            formattedProject['name'] = project.name ?? '';
            formattedProject['tagline'] = project.tagline ?? '';
            formattedProject['description'] = project.description ?? '';
            formattedProject['contactEmail'] = project.contactEmail ?? '';
            formattedProject['logo'] = project.logo?.url ?? null;
            formattedProject['logoUid'] = project?.logo?.uid ?? null;
            formattedProject['fundingNeeded'] = project.lookingForFunding ?? false;
            formattedProject['kpis'] = project.kpis ?? [];
            formattedProject['readMe'] = project.readMe ?? '';
            formattedProject['teamUid'] = project.maintainingTeamUid;
            formattedProject['maintainingTeam'] = project.maintainingTeam;
            formattedProject['isDeleted'] = project.isDeleted ?? false;
            formattedProject['lookingForFunding'] = project.lookingForFunding ?? false;
            formattedProject['createdBy'] = project.createdBy ?? null;
            formattedProject['score'] = project.score ?? null;
            formattedProject['projectFocusAreas']= project.projectFocusAreas ?? [];

            const tempContributors: any = [];
            project?.contributions?.map((mem: any) => {
                const memberObj: any = {};
                memberObj['logo'] = mem?.member?.image ? mem?.member?.image?.url : null;
                const mainTeam = mem?.member?.teamMemberRoles?.filter((teamRoles: any) => {
                    return teamRoles?.mainTeam === true;
                });
                memberObj['mainTeam'] = mainTeam && mainTeam?.length > 0 ? mainTeam[0] : null;
                memberObj['name'] = mem?.member?.name;
                const teamLead = mem?.member?.teamMemberRoles?.some((team: any) => team.teamLead);
                memberObj['teamLead'] = teamLead,
                    memberObj['teamMemberRoles'] = mem?.member?.teamMemberRoles;
                memberObj['uid'] = mem?.member?.uid,
                    memberObj['cuid'] = mem?.uid;
                tempContributors.push(memberObj);
            });
            formattedProject['contributors'] = tempContributors;

            const tempCTeams: any = [];
            project.contributingTeams.map((team: any) => {
                const teamObj: any = {};
                teamObj['uid'] = team?.uid;
                teamObj['name'] = team?.name;
                teamObj['logo'] = team?.logo ? team?.logo?.url : null;
                tempCTeams.push(teamObj);
            });
            formattedProject['contributingTeams'] = tempCTeams;

            const tempProjectlinks: any = [];
            project.projectLinks?.map((link: any, index: any) => {
                const urlObj: any = {};
                urlObj['name'] = link?.name;
                urlObj['url'] = link?.url;
                urlObj['id'] = index;
                tempProjectlinks.push(urlObj);
            });
            formattedProject['projectLinks'] = tempProjectlinks;

            const tempKpi: any = [];
            project.kpis.forEach((kpi: any, index: any) => {
                const kpiObj: any = {};
                kpiObj['name'] = kpi?.key;
                kpiObj['value'] = kpi?.value;
                kpiObj['id'] = index;
                tempKpi.push(kpiObj);
            });
            formattedProject['KPIs'] = tempKpi;
        }
        return formattedProject;
    } catch (err) {
        console.error(err)
        return null;
    }
}





export const addProject = async (data: any, authToken: string | undefined) => {
    const requestOptions: RequestInit = {
        method: "POST", cache: "no-store",
        headers: getHeader(authToken),

        body: JSON.stringify(formatToSave(data))
    };
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/projects`, requestOptions);
    if (!response.ok) {
        return { error: { status: response.status } }
    }
    return await response.json();
}


const formatToSave = (payload: any) => {

    const objectToSave: any = {
        "name": payload?.name.trim(),
        "tagline": payload?.tagline.trim(),
        "description": payload?.description.trim(),
        "lookingForFunding": payload?.lookingForFunding,
        "readMe": payload?.readMe,
        "maintainingTeamUid": payload?.maintainingTeamUid,
    }

    if (payload?.contactEmail) {
        objectToSave['contactEmail'] = payload.contactEmail.trim();
    } else {
        objectToSave['contactEmail'] = null;
    }
    objectToSave['kpis'] = payload?.kpis;
    objectToSave['logoUid'] = payload?.logoUid;


    objectToSave['projectLinks'] = payload.projectLinks;


    objectToSave['contributingTeams'] = payload?.contributingTeams;
    objectToSave['contributions'] = payload?.contributions;
    objectToSave['focusAreas'] = [];
    return objectToSave;
}