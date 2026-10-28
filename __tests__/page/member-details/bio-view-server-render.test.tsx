/**
 * @jest-environment node
 */
import { renderToString } from 'react-dom/server';

import { BioView } from '@/components/page/member-details/BioDetails/components/BioView/BioView';
import type { IMember } from '@/types/members.types';
import type { IUserInfo } from '@/types/shared.types';

it('puts the sanitized bio in the server HTML, with no DOM', () => {
  const html = renderToString(
    <BioView
      member={{ bio: '<p><strong>Founder</strong> of Acme</p><script>alert(1)</script>' } as IMember}
      isLoggedIn={false}
      userInfo={{} as IUserInfo}
      isEditable={false}
      showIncomplete={false}
      onEdit={() => {}}
      onGenerateBio={() => {}}
    />,
  );

  expect(html).toContain('<strong>Founder</strong> of Acme');
  expect(html).not.toContain('<script');
});
