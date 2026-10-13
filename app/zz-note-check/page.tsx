'use client';
import { GiveAiAppFeedbackDialog } from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog';
import { FeedbackBody } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackBody/FeedbackBody';
export default function Page() {
  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <div id="body-check">
        <FeedbackBody
          text={'## Bug\n\nHarbor Deli shows as **late** while a < b & c\n\n- the Late tile\n- the table\n\n<p><img src="https://placehold.co/600x400.png" alt="Screenshot"></p>'}
          onImageClick={() => {}}
        />
        <FeedbackBody text={'<p>Old <strong>rich</strong> note</p>'} onImageClick={() => {}} />
      </div>
      <GiveAiAppFeedbackDialog isOpen onClose={() => {}} appUid="app-1" appName="My App" />
    </div>
  );
}
