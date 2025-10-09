import s from './Footer.module.scss';

const PRIVACY_POLICY_URL = 'https://drive.google.com/file/d/1RIAyMlyuLYnipa6W_YBzcJ6hDzfH7yW3/view';
const TERMS_AND_CONDITIONS_URL = 'https://drive.google.com/file/d/1MjOF66asddB_hsg7Jc-7Oxk6L1EvYHxk/view';

export function Footer() {
  return (
    <div className={s.root}>
      <div className={s.legal}>© 2025 Protocol Labs</div>
      <div className={s.links}>
        <a className={s.link} href={PRIVACY_POLICY_URL} target="_blank">
          Privacy Policy
        </a>
        <a className={s.link} href={TERMS_AND_CONDITIONS_URL} target="_blank">
          Terms & Conditions
        </a>
      </div>
    </div>
  );
}
