import { formatNumber, getFormattedEvents, getformattedMembers, getFormattedProjects, getFormattedTeams } from '@/utils/home.utils';

export const getFeaturedData = async () => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/home/featured/all`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  const formattedMembers = getformattedMembers(result?.members || []);
  const formattedTeams = getFormattedTeams(result?.teams || []);
  const formattedEvents = getFormattedEvents(result?.events || []);
  const formattedProjects = getFormattedProjects(result.projects || []);

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
  const url = `${process.env.DIRECTORY_API_URL}/v1/home/question-answers?isActive=true`;

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
