import { PrototypeRouteChrome } from '@/prototypes/components/PrototypeRouteChrome/PrototypeRouteChrome';

export default function PrototypesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Hides the production header/bottom bar the root layout wraps every
          prototype in, for as long as a prototype route is mounted. */}
      <PrototypeRouteChrome />
      {children}
    </>
  );
}
