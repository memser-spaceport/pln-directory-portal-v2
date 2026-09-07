import Profile from '@/components/page/aligement-assets/profile/profile';
import { PlaaProfileAccessGuard } from '@/components/page/aligement-assets/profile/plaa-profile-access-guard';

export default function ProfilePage() {
  return (
    <PlaaProfileAccessGuard>
      <Profile />
    </PlaaProfileAccessGuard>
  );
}
