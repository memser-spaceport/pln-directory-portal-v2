import { API_URLS } from '@/utils/constants';
import { getHeader } from "@/utils/common.utils";

export interface IntroRule {
  id: string;
  name: string;
  tags: string[];
  leadCount: number;
}

export interface IntroTopic {
  id: string;
  name: string;
}

export interface IntroTag {
  id: string;
  name: string;
}

export const getIntroRules = async (authToken: string) => {
  try {
    const response = await fetch(API_URLS.INTRO_RULES, {
      headers: getHeader(authToken),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch intro rules');
    }

    const data = await response.json();
    return {
      isError: false,
      data: data as IntroRule[]
    };
  } catch (error) {
    console.error('Error fetching intro rules:', error);
    return {
      isError: true,
      data: null
    };
  }
};

export const getIntroTags = async (authToken: string) => {
  try {
    const response = await fetch(API_URLS.INTRO_TAGS, {
      headers: getHeader(authToken),
    });

    if (!response.ok) { 
      throw new Error('Failed to fetch intro tags');
    }

    const data = await response.json();
    return {
      isError: false,
      data: data as IntroTag[]
    };
  } catch (error) {
    console.error('Error fetching intro tags:', error);
    return {
      isError: true,
      data: null
    };
  }
};
export const getIntroTopics = async (authToken: string) => {
  try {
    const response = await fetch(API_URLS.INTRO_TOPICS, {
      headers: getHeader(authToken),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch intro topics');
    }

    const data = await response.json();
    return {
      isError: false,
      data: data as IntroTopic[]
    };
  } catch (error) {
    console.error('Error fetching intro topics:', error);
    return {
      isError: true,
      data: null
    };
  }
};

export const createIntroRule = async (authToken: string, rule: Partial<IntroRule>) => {
  try {
    const response = await fetch(API_URLS.INTRO_RULES, {
      method: 'POST',
      headers: getHeader(authToken),
      body: JSON.stringify(rule)
    });

    if (!response.ok) {
      throw new Error('Failed to create intro rule');
    }

    const data = await response.json();
    return {
      isError: false,
      data: data as IntroRule
    };
  } catch (error) {
    console.error('Error creating intro rule:', error);
    return {
      isError: true,
      data: null
    };
  }
};

export const updateIntroRule = async (authToken: string, rule: IntroRule) => {
  try {
    const response = await fetch(`${API_URLS.INTRO_RULES}/${rule.id}`, {
      method: 'PUT',
      headers: getHeader(authToken),
      body: JSON.stringify(rule)
    });

    if (!response.ok) {
      throw new Error('Failed to update intro rule');
    }

    const data = await response.json();
    return {
      isError: false,
      data: data as IntroRule
    };
  } catch (error) {
    console.error('Error updating intro rule:', error);
    return {
      isError: true,
      data: null
    };
  }
};

export const deleteIntroRule = async (authToken: string, ruleId: string) => {
  try {
    const response = await fetch(`${API_URLS.INTRO_RULES}/${ruleId}`, {
      method: 'DELETE',
      headers: getHeader(authToken)
    });

    if (!response.ok) {
      throw new Error('Failed to delete intro rule');
    }

    return {
      isError: false
    };
  } catch (error) {
    console.error('Error deleting intro rule:', error);
    return {
      isError: true
    };
  }
}; 