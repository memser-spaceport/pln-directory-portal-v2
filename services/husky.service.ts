export const saveFeedback = async (payload: any) => {
  const saveResponse = await fetch(`${process.env.HUSKY_API_URL}/feedback`, {
    cache: 'no-store',
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!saveResponse.ok) {
    return {
      isError: true,
    };
  }

  return {
    isSaved: true,
  };
};

export const getHuskyReponse = async (query: string, source: string, chatUid: string, previousQues?: string | null, previousAns?: string | null, isBlog = false) => {
  const payload = {
    query,
    UID: chatUid,
    source,
    ...(previousQues && { promptHistory: previousQues }),
    ...(previousAns && { answerHistory: previousAns }),
  };
  const queryResponse = await fetch(`${process.env.HUSKY_API_URL}/retrieve`, {
    cache: 'no-store',
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!queryResponse.ok) {
    return {
      isError: true,
    };
  }

  const huskyResponse = await queryResponse.json();
  let formattedActions: any;
  if (isBlog) {
    const augementResponse = await fetch(`${process.env.HUSKY_API_URL}/augumented_info`, {
      cache: 'no-store',
      method: 'POST',
      body: JSON.stringify({
        query,
        answer: huskyResponse.Response.answer,
        references: huskyResponse.references,
        source,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!augementResponse.ok) {
      return {
        isError: true,
      };
    }

    const augmentedResult = await augementResponse.json();
    const actions = {
      teams: augmentedResult?.augumented_info?.company ?? [],
      members: augmentedResult?.augumented_info?.members ?? [],
      projects: augmentedResult?.augumented_info?.project ?? [],
    };
    formattedActions = {
      teams: actions.teams
        .map((v: any) => {
          return {
            name: v.name,
            link: v.directory_link,
            type: 'team',
            desc: v.about,
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
          };
        })
        .slice(0, 2),
    };
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
      actions: isBlog ? fetchItemsFromArrays(formattedActions.teams, formattedActions.members, formattedActions.projects) : [],
    },
  };
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
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions?teamUid__not=null`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const output = await response.json();
  return output.map((o: any) => {
    return {
      name: o?.team?.name,
      uid: o?.team?.uid,
      logo: o?.team?.logo?.url,
      relatedQuestions: o.relatedQuestions.map((v: any) => v.content),
    };
  });
};

export const getProjectsPrompts = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions?projectUid__not=null`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const output = await response.json();
  return output.map((o: any) => {
    return {
      name: o?.project?.name,
      uid: o?.project?.uid,
      logo: o?.project?.logo?.url,
      relatedQuestions: o.relatedQuestions.map((v: any) => v.content),
    };
  });
};

export const getIrlPrompts = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions?eventUid__not=null`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const output = await response.json();
  return output.map((o: any) => {
    return {
      name: o?.plevent?.name,
      uid: o?.plevent?.uid,
      logo: o?.plevent?.logo?.url,
      relatedQuestions: o.relatedQuestions.map((v: any) => v.content),
    };
  });
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
