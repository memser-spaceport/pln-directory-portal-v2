
export const getMemberPreferences = async (uid: string, authToken: string) => {
    const result = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${uid}/preferences`, {
        cache: 'no-store',
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
        githubProjects: rawPreferences?.github ?? false
    }
    const memberPreferences = {
        email: rawPreferences?.showEmail,
        github: rawPreferences?.showGithubHandle,
        githubProjects: rawPreferences?.showGithubProjects,
        telegram: rawPreferences?.showTelegram,
        discord: rawPreferences?.showDiscord,
        linkedin: rawPreferences?.showLinkedin,
        twitter: rawPreferences?.showTwitter,
    }

    return {
        preferenceSettings,
        memberPreferences,
        isPreferenceAvailable: rawPreferences.isnull
    }
}