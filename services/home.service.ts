import { formatNumber, getFormattedEvents, getformattedMembers, getFormattedProjects, getFormattedTeams } from '@/utils/home.utils';

export const getFeaturedData = async () => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/home/featured`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  const formattedMembers = getformattedMembers(result?.members?.members || []);
  const formattedTeams = getFormattedTeams(result?.teams?.teams || []);
  const formattedEvents = getFormattedEvents(result?.events || []);
  const formattedProjects = getFormattedProjects(result.projects?.projects || []);

  const maxLength = Math.max(formattedMembers.length, formattedTeams.length, formattedEvents.length, formattedProjects.length);

  const combinedData = [];
  for (let i = 0; i < maxLength; i++) {
    if (formattedEvents[i] !== undefined) combinedData.push(formattedEvents[i]);
    if (formattedMembers[i] !== undefined) combinedData.push(formattedMembers[i]);
    if (formattedTeams[i] !== undefined) combinedData.push(formattedTeams[i]);
    if (formattedProjects[i] !== undefined) combinedData.push(formattedProjects[i]);
  }

  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  return { data: combinedData };
};

export const getDiscoverData = async () => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions?isActive=true&teamName=null&projectName=null&eventName=null`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  const formattedResult = result?.map((res: any) => {
    return {
      uid: res.uid,
      question: res.content,
      subText: res.title,
      answer: res.answer,
      answerSourceLinks: res.answerSources,
      answerSourcedFrom: 'none',
      followupQuestions: res.relatedQuestions.map((v: any) => v.content),
      viewCount: formatNumber(res.viewCount),
      shareCount: formatNumber(res.shareCount),
      slug: res.slug
    };
  });

  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  return { data: formattedResult };
};

export const incrementHuskyViewCount = async (slug: string) => {
  try {
    await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions/${slug}`, {
      cache: 'no-store',
      method: 'PATCH',
      body: JSON.stringify({ attribute: 'viewCount' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {}
};

export const incrementHuskyShareCount = async (slug: string) => {
  try {
    await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions/${slug}`, {
      cache: 'no-store',
      method: 'PATCH',
      body: JSON.stringify({ attribute: 'shareCount' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {}
};

export const getHuskyResponseBySlug = async (slug: string, increaseView = false) => {
  //home/question-answers/4yfzhh
  const result = await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions/${slug}`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const output: any = await result.json();
  if (increaseView) {
    await incrementHuskyViewCount(slug);
  }
  if (!result.ok) {
    return {
      isError: true,
      status: result.status,
      message: output,
    };
  }

  return {
    data: {
      question: output.content,
      answer: output.answer,
      answerSourceLinks: output.answerSources,
      answerSourcedFrom: 'none',
      followupQuestions: output.relatedQuestions.map((v: any) => v.content),
      viewCount: output.viewCount,
      shareCount: output.shareCount,
    },
  };
};

export const getTeamPrompts = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions?teamName__not=null`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const output = await response.json();
  return output.map((o: any) => {
    return {
      name: o?.team?.name || o.teamName,
      logo: o?.team?.logo?.url ?? '/icons/team-light-blue.svg',
      relatedQuestions: o.relatedQuestions.map((v: any) => v.content),
    };
  });
};

export const getProjectsPrompts = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions?projectName__not=null`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const output = await response.json();
  return output.map((o: any) => {
    return {
      name: o?.project?.name || o?.projectName,
      logo: o?.project?.logo?.url ?? '/icons/project-light-blue.svg',
      relatedQuestions: o.relatedQuestions.map((v: any) => v.content),
    };
  });
};

export const getIrlPrompts = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions?eventName__not=null`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const output = await response.json();
  return output.map((o: any) => {
    return {
      name: o?.plevent?.name || o?.eventName,
      logo: '/icons/irl-light-blue.svg',
      relatedQuestions: o.relatedQuestions.map((v: any) => v.content),
    };
  });
};


