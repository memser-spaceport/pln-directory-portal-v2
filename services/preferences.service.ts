
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
        email: rawPreferences.email,
        github: rawPreferences.github,
        telegram: rawPreferences.telegram,
        discord: rawPreferences.discord,
        linkedin: rawPreferences.linkedin,
        twitter: rawPreferences.twitter
    }
    const memberPreferences = {
        email: rawPreferences.showEmail,
        github: rawPreferences.showGithubHandle,
        githubProjects: rawPreferences.showGithubProjects,
        telegram: rawPreferences.showTelegram,
        discord: rawPreferences.showDiscord,
        linkedin: rawPreferences.showLinkedin
    }

    return {
        preferenceSettings,
        memberPreferences,
        isPreferenceAvailable: rawPreferences.isnull
    }
}