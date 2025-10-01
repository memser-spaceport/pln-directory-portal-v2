import React from 'react';
import Link from 'next/link';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { CheckIcon, ExternalLinkIcon } from '../icons';
import { SEC_RULES_URL } from '../constants';
import s from '../EditInvestorProfileForm.module.scss';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onTrigger: () => void;
}

export const SecRulesCheckbox: React.FC<Props> = ({ checked, onChange, onTrigger }) => {
  return (
    <div className={s.row}>
      <label className={s.Label}>
        <Checkbox.Root
          className={s.Checkbox}
          checked={checked}
          onCheckedChange={(v: boolean) => {
            onChange(v);
            onTrigger();
          }}
        >
          <Checkbox.Indicator className={s.Indicator}>
            <CheckIcon className={s.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <div className={s.col}>
          <div className={s.primary}>
            I&apos;m an accredited investor under{' '}
            <Link
              target="_blank"
              href={SEC_RULES_URL}
              className={s.link}
            >
              SEC rules <ExternalLinkIcon />
            </Link>
          </div>
        </div>
      </label>
    </div>
  );
};
