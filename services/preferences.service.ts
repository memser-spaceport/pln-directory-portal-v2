
export const getMemberPreferences = async (uid: string, authToken: string) => {
    const result = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${uid}/preferences`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    
    if(!result.ok) {
        return {isError: true}
    }

    const rawPreferences = await result.json();
    const preferenceSettings = {
        email: rawPreferences?.email ?? false,
        github: rawPreferences?.github ?? false,
        telegram: rawPreferences?.telegram ?? false,
        discord: rawPreferences?.discord ?? false,
        linkedin: rawPreferences?.linkedin ?? false,
        twitter: rawPreferences?.twitter ?? false,
        githubProjects: rawPreferences?.githubProjects ?? false
    }
    let memberDefaultPreferences = {
        email: rawPreferences?.showEmail ?? false,
        github: rawPreferences?.showGithubHandle ?? false,
        githubProjects: rawPreferences?.showGithubProjects ?? false,
        telegram: rawPreferences?.showTelegram ?? false,
        discord: rawPreferences?.showDiscord ?? false,
        linkedin: rawPreferences?.showLinkedin ?? false,
        twitter: rawPreferences?.showTwitter ?? false,
    }

    const memberPreferences = {
        email: preferenceSettings.email === true ? memberDefaultPreferences.email : true,
        github: preferenceSettings.github === true ? memberDefaultPreferences.github : true,
        githubProjects: preferenceSettings.githubProjects === true ? memberDefaultPreferences.githubProjects : true,
        telegram: preferenceSettings.telegram === true ? memberDefaultPreferences?.telegram : true,
        discord: preferenceSettings.discord === true ? memberDefaultPreferences?.discord : true,
        linkedin: preferenceSettings.linkedin === true ? memberDefaultPreferences?.linkedin : true,
        twitter: preferenceSettings.twitter  === true ? memberDefaultPreferences?.twitter : true
    }

    return {
        preferenceSettings,
        memberPreferences,
        isPreferenceAvailable: rawPreferences.isnull
    }
}