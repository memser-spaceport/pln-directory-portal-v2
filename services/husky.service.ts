export const saveFeedback = async (authToken: string,payload: any) => {
  const saveResponse = await fetch(`${process.env.HUSKY_API_URL}/feedback`, {
    cache: 'no-store',
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!saveResponse.ok) {
    return {
      isError: true,
      status: saveResponse.status
    };
  }

  return {
    isSaved: true,
  };
};

export const getHuskyAugmentedInfo = async (authToken: string, query: string, answer: string, references: any[], source: string) => {
  try {
    const augementResponse = await fetch(`${process.env.HUSKY_API_URL}/augumented_info`, {
      cache: 'no-store',
      method: 'POST',
      body: JSON.stringify({
        query,
        answer,
        references,
        source,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!augementResponse.ok) {
      return [];
    }

    const augmentedResult = await augementResponse.json();
    const actions = {
      teams: augmentedResult?.augumented_info?.company ?? [],
      members: augmentedResult?.augumented_info?.members ?? [],
      projects: augmentedResult?.augumented_info?.project ?? [],
    };
    const formattedActions = {
      teams: actions.teams
        .map((v: any) => {
          return {
            name: v.name,
            link: v.directory_link,
            type: 'team',
            desc: v.about,
            icon: '/icons/users-black.svg'
          };
        })
        .slice(0, 2),
      members: actions.members
        .map((v: any) => {
          return {
            name: v.name,
            link: v.directory_link,
            type: 'member',
            desc: `Part of ${v.organization}`,
            icon: '/icons/member-black.svg'
          };
        })
        .slice(0, 2),
      projects: actions.projects
        .map((v: any) => {
          return {
            name: v.name,
            link: v.directory_link,
            type: 'project',
            desc: v.tagline,
            icon: '/icons/projects-black.svg'
          };
        })
        .slice(0, 2),
    };

    return fetchItemsFromArrays(formattedActions.teams, formattedActions.members, formattedActions.projects);
  } catch (error: any) {
    return [];
  }
};

export const getHuskyResponse = async (userInfo: any,authToken: string, query: string, source: string, chatUid: string, previousQues?: string | null, previousAns?: string | null, isBlog = false) => {
  const payload = {
    query,
    UID: chatUid,
    source,
    ...(previousQues && { promptHistory: previousQues }),
    ...(previousAns && { answerHistory: previousAns }),
    ...(userInfo?.name && { name: userInfo?.name }),
    ...(userInfo?.email && { email: userInfo?.email }), 
    ...(userInfo?.uid && { directoryId: userInfo?.uid }),
  };
  const queryResponse = await fetch(`${process.env.HUSKY_API_URL}/retrieve`, {
    cache: 'no-store',
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!queryResponse.ok) {
    return {
      isError: true,
      status: queryResponse.status
    };
  }

  const huskyResponse = await queryResponse.json();
  let augementedActions: any[] = [];
  if (!isBlog) {
    augementedActions = await getHuskyAugmentedInfo(authToken, query, huskyResponse?.Response?.answer, huskyResponse?.references, source);
  }

  const answerSourceLinks = huskyResponse.Source_list.filter((item: any) => {
    if (item.link !== 'None' && item.title !== 'None' && item.description !== 'None') {
      return true;
    }
    return false;
  });

  return {
    data: {
      question: huskyResponse.Query,
      answer: huskyResponse.Response.answer,
      answerSourceLinks,
      answerSourcedFrom: source,
      followupQuestions: huskyResponse.Followup_Questions,
      actions: !isBlog ? [...augementedActions] : [],
    },
  };
};
type Item = { name: string; link: string; type: string };
function fetchItemsFromArrays(arr1: Item[], arr2: Item[], arr3: Item[]): Item[] {
  const items: Item[] = [];
  const arrays: Item[][] = [arr1, arr2, arr3];

  // Try to take one item from each array
  for (const array of arrays) {
    if (array.length > 0) {
      items.push(array.shift()!); // Non-null assertion since we check length
    }
  }

  // If less than 3 items were collected, fill in from the remaining items
  for (const array of arrays) {
    while (items.length < 3 && array.length > 0) {
      items.push(array.shift()!);
    }
  }

  return items;
}



