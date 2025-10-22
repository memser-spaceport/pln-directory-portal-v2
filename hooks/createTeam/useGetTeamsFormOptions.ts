import { useEffect, useState } from 'react';
import { getTeamsFormOptions } from '@/services/registration.service';

export function useGetTeamsFormOptions() {
  const [options, setOptions] = useState({
    technologies: [],
    fundingStage: [],
    membershipSources: [],
    industryTags: [],
    isError: false,
  });

  useEffect(() => {
    getTeamsFormOptions()
      .then((data) => {
        if (!data.isError) {
          setOptions(data as any);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  return options;
}
