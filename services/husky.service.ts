export const getHuskyReponse = async (query: string, source: string, chatUid: string, previousQues?: string, previousAns?: string) => {
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

    const augementResponse =  await fetch(`${process.env.HUSKY_API_URL}/augumented_info`, {
    cache: 'no-store',
    method: 'POST',
    body: JSON.stringify({
      query,
      answer: huskyResponse.Response.answer,
      references: huskyResponse.references,
      source
    }),
    headers: {
      'Content-Type': 'application/json',
    },
   })

   if(!augementResponse.ok) {
      return {
        isError: true,
      }
   }

  const augmentedResult = await augementResponse.json();
  const actions = {
    teams: augmentedResult?.augumented_info?.company ?? [],
    members:  augmentedResult?.augumented_info?.members ?? [],
    projects: augmentedResult?.augumented_info?.project ?? [],
  }
  const formattedActions = {
    teams: actions.teams.map((v:any) => {
      return {
        name: v.name,
        link: v.directory_link,
        type: 'team',
        desc: v.about
        
      }
    }).slice(0,2),
    members: actions.members.map((v:any) => {
      return {
        name: v.name,
        link: v.directory_link,
        type: 'member',
        desc: `Part of ${v.organization}`
      }
    }).slice(0,2),
    projects: actions.projects.map((v:any) => {
      return {
        name: v.name,
        link: v.directory_link,
        type: 'project',
        desc: v.tagline
      }
    }).slice(0,2)
  }
  const answerSourceLinks = huskyResponse.Source_list.filter((item: any) => {
    if(item.link !== 'None' && item.title !== 'None' && item.description !== 'None') {
      return true;
    }
    return false
  });

  return {
    data: {
      question: huskyResponse.Query,
      answer: huskyResponse.Response.answer,
      answerSourceLinks,
      answerSourcedFrom: source,
      followupQuestions: huskyResponse.Followup_Questions,
      augmentedResult,
      actions: fetchItemsFromArrays(formattedActions.teams, formattedActions.members, formattedActions.projects)
    },
  };
};



export const incrementHuskyViewCount = async (slug: string) => {
  try {
    await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/question-answers/${slug}/view-count`, {
      cache: 'no-store',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {}
};

export const incrementHuskyShareCount = async (slug: string) => {
  try {
    await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/question-answers/${slug}/share-count`, {
      cache: 'no-store',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {}
};

export const getHuskyResponseBySlug = async (slug: string, increaseView = false) => {
  //home/question-answers/4yfzhh
  const result = await fetch(`${process.env.DIRECTORY_API_URL}/v1/home/question-answers/${slug}`, {
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
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const output = await response.json();
  return output.map((o: any) => {
    return {
      name: o.name,
      uid: o.uid,
      relatedQuestions: [`Tell me about ${o.name} team`, 'What is Labweek', 'What is protocol labs'],
    };
  });
};

export const getProjectsPrompts = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/projects`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const output = await response.json();
  return output.map((o: any) => {
    return {
      name: o.name,
      uid: o.uid,
      relatedQuestions: [`Tell me about ${o.name} project`, 'What is Labweek', 'What is protocol labs'],
    };
  });
};

export const getIrlPrompts = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const output = await response.json();
  return output.map((o: any) => {
    return {
      name: o.name,
      uid: o.uid,
      relatedQuestions: [`Tell me about ${o.name} irl`, 'What is Labweek', 'What is protocol labs'],
    };
  });
};
type Item = { name: string; link: string, type: string };
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
