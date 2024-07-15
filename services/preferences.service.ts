
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
        twitter: rawPreferences?.twitter ?? false
    }
    const memberPreferences = {
        email: rawPreferences?.showEmail ?? false,
        github: rawPreferences?.showGithubHandle ?? false,
        githubProjects: rawPreferences?.showGithubProjects ?? false,
        telegram: rawPreferences?.showTelegram ?? false,
        discord: rawPreferences?.showDiscord ?? false,
        linkedin: rawPreferences?.showLinkedin ?? false,
        twitter: rawPreferences?.showTwitter ?? false,
    }

    return {
        preferenceSettings,
        memberPreferences,
        isPreferenceAvailable: rawPreferences.isnull
    }
}