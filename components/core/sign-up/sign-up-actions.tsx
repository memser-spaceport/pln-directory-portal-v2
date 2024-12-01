import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';
import { useRouter } from 'next/navigation';

const SignUpActions = () => {
  const router = useRouter();
  const analytics = useSignUpAnalytics();
  return (
    <>
      <div className="cn">
        <button type="button" onClick={() => {
          analytics.recordSignUpCancel();
          router.push('/');
        }} className="cn__cancel">Cancel</button>
        <button type="submit" className="cn__submit">
          Sign Up
        </button>
      </div>
      <style jsx>{`
        .cn {
          display: flex;
          justify-content: flex-end;
          padding: 16px 32px;
          gap:8px;
          border-top: 1px solid #cbd5e1;
        }
        .cn__submit {
          padding: 10px 24px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #156ff7;
          cursor: pointer;
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        .cn__cancel {
          padding: 10px 24px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </>
  );
};

export default SignUpActions;
