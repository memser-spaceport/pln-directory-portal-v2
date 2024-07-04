import styles from './page.module.css'
import SettingsMenu from '@/components/page/settings/menu'
export default function Settings() {
  return <>
    <div className={styles.settings}>
        <div className={styles.settings__title}>
            <h2 className={styles.settings__title__text}>Account Settings</h2>
        </div>
        <div>
            <SettingsMenu />
        </div>
    </div>
  </>
}
