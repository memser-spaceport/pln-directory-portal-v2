

const API_URL = `${process.env.DIRECTORY_API_URL}/v1/home/discovery/questions`;
export const getChatQuestions = async () => {
    const url = `${API_URL}/?type=CHAT`;
  
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
        answer: res.answer,
        answerSourceLinks: res.answerSources,
        followupQuestions: res.relatedQuestions.map((v: any) => v.content),
        icon: '/icons/send-black.svg'
      };
    });
  
    if (!response?.ok) {
      return { error: { statusText: response?.statusText, status: response?.status } };
    }
    return { data: formattedResult };
  };
  
  