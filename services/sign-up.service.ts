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
  result['requesterEmailId'] = formData['email'];
  result['uniqueIdentifier'] = formData['email'];
  return result;
};

export const formatSuggestions = (suggestions: any) => {
  return suggestions.map((suggestion: any) => {
    return {
      name: suggestion.name,
      logoURL: suggestion.logo?.url ?? '',
      group: suggestion.category,
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
  ];
};
