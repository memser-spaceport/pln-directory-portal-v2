import { GROUP_TYPES } from "@/utils/constants";
// import { validateEmail } from '../utils/common.utils';
import { validatePariticipantsEmail } from "./participants-request.service";

export const getSkillsData = async () => {
  const [skillsInfo] = await Promise.all([fetch(`${process.env.DIRECTORY_API_URL}/v1/skills?pagination=false`, { method: 'GET' })]);
  if (!skillsInfo.ok) {
    return { isError: true };
  }
  const skillsData = await skillsInfo.json();
  return {
    skills: skillsData
      .map((skill: any) => {
        return {
          id: skill.uid,
          name: skill.title,
        };
      })
      .sort((a: any, b: any) => a.name - b.name),
  };
};

export const formatFormDataToApi = (formData: any) => {
  const result: any = {};
  const skills: any = [];

  for (const key in formData) {
    if (key.startsWith('skillsInfo')) {
      const [skillInfo, subKey] = key.split('-');
      const skillIndexMatch = skillInfo.match(/\d+$/);
      if (skillIndexMatch) {
        const skillIndex = skillIndexMatch[0];
        if (!skills[skillIndex]) {
          skills[skillIndex] = {};
        }
        skills[skillIndex][subKey] = formData[key];
      }
      result['skills'] = skills;
    }
  }
  result['name'] = formData['name'];
  result['email'] = formData['email'];
  if (formData['consent']) {
    result['isUserConsent'] = formData['consent'];
  }
  if (formData['subscribe']) {
    result['isSubscribedToNewsletter'] = formData['subscribe'];
  }
  if (formData['selected-team-or-project']) {
    try {
      const teamOrProject = JSON.parse(formData['selected-team-or-project']);
      if (teamOrProject.group === GROUP_TYPES.PROJECT) {
        result['projectContributions'] = [{ projectUid: teamOrProject.uid }];
      } else if (teamOrProject.group === GROUP_TYPES.TEAM) {
        result['teamAndRoles'] = [{ teamUid: teamOrProject.uid, teamTitle: teamOrProject.name }];
      }
    } catch (e) {
      result['teamOrProjectURL'] = formData['selected-team-or-project'];
    }
  }
  result['memberProfile'] = formData['memberProfile'];
  result['imageFile'] = formData['memberProfile'];
  return result;
};

export const checkEmailDuplicate = async (email: string) => {
 // Validate email
 const emailLowercase = email.toLowerCase().trim();
 const emailVerification = await validatePariticipantsEmail(emailLowercase, 'MEMBER');
 if (!emailVerification.isValid) {
   return {
    'email': 'Email already exists',
   }
 }
 return {};

};

export const validateSignUpForm = (formData: any) => {
  const errors: any = {};
  if (!formData['name']) {
    errors['name'] = 'Please enter your name.';
  }
  if (!formData['email']) {
    errors['email'] = 'Please enter your email.';
  }
  if (formData['email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData['email'])) {
    errors['email'] = 'Please enter a valid email';
  }
  const imageFile = formData?.memberProfile;
  if (imageFile && imageFile.name && imageFile.size > 0) {
    if (!['image/jpeg', 'image/png'].includes(imageFile.type)) {
      errors['profile'] = 'Please upload image in jpeg or png format';
    } else {
      if (imageFile.size > 4 * 1024 * 1024) {
        errors['profile'] = 'Please upload a file less than 4MB';
      }
    }
  }

  return errors;
};


export const formatSuggestions = (suggestions: any) => {
  return suggestions.map((suggestion: any) => {
    return {
      name: suggestion.name,
      logoURL: suggestion.logo ? suggestion.logo.url ?? '': '',
      group: suggestion.category === 'TEAM' ? GROUP_TYPES.TEAM : GROUP_TYPES.PROJECT,
      uid: suggestion.uid,
    };
  });
};

export const getSuggestions = async (searchTerm: string) => {
  //   const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/skills?search=${searchTerm}&pagination=false`, { method: 'GET' });
  //   if (!response.ok) {
  //     return [];
  //   }
  //   const data = await response.json();
  return [
    {
      uid: 'clgqr8lzh000002ym5k82a00h',
      name: 'IPFS Backup',
      logo: {
        url: 'https://files.plnetwork.io/bafybeidn6uujxroylnocqmvfejncwvcvkmop6cl5mamuqmd6ueh2dxwjui/2d8214d54c14717a.webp',
      },
      category: 'TEAM',
    },
    {
      uid: 'clttovr93000s0802190cqrrw',
      name: 'IPFS Garden',
      logo: null,
      category: 'TEAM',
    },
    {
      uid: 'cldvnzcns024tu21kr2210plc',
      name: 'IPFS Search',
      logo: {
        url: 'https://files.plnetwork.io/bafybeibxnpwqnuvgdufdhsu2xytv6schvw75rtzwnkl33uauky2r4wrxl4/1073d05017447141.webp',
      },
      category: 'TEAM',
    },
    {
      uid: 'closv895m000mwi02rwetl8b5',
      name: 'IPFS',
      logo: {
        url: 'https://files.plnetwork.io/bafybeifxbfjiq4he3czykxgk5ywonnro4bp3ptivkepxy2dhnyduyxknwy/36e8bf98f2fdd20f.webp',
      },
      category: 'PROJECT',
    },
    {
      uid: 'cltwb0a01000ase02t38ju3hb',
      name: 'IPFS Pump',
      logo: null,
      category: 'PROJECT',
    },
  ].filter((suggestion) => suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()));
};
