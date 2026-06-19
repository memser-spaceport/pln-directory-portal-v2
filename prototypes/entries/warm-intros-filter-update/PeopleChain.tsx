'use client';

// People-first route renderer. Each node is a PERSON (or, when the individual is
// unknown, the organization that can route the intro). Icons come from the app's
// own set (@/components/icons):
//   • member   → person in the PL network: avatar + link to /members + ↗.
//   • external → known person NOT in the network: ContributorIcon, no link.
//   • org      → company we can route through but not who: UsersThreeIcon + "?".
//     (PL-network org also shows its logo + links to /teams.)
import pd from '@/components/page/investors/WarmPathDetail/WarmPathDetail.module.scss';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { ArrowUpRightIcon, QuestionCircleStrokeIcon } from '@/components/icons';
import type { RouteNode } from './mocks';
import x from './WarmIntrosImprovements.module.scss';

export function PeopleChain({ nodes, className }: { nodes: RouteNode[]; className?: string }) {
  if (nodes.length === 0) return null;
  return (
    <div className={className ? `${pd.chain} ${className}` : pd.chain}>
      {nodes.map((node, i) => (
        <span key={`${node.label}-${i}`} className={pd.node}>
          {i > 0 && <span className={pd.arrow}>→</span>}
          <RouteNodeView node={node} />
        </span>
      ))}
    </div>
  );
}

// "Person unknown" marker — the app's question-circle icon.
function UnknownBadge() {
  return (
    <span className={x.chainUnknownBadge} aria-hidden>
      <QuestionCircleStrokeIcon width={14} height={14} />
    </span>
  );
}

function RouteNodeView({ node }: { node: RouteNode }) {
  // Network person → clickable chip with avatar + ↗ → /members.
  if (node.variant === 'member' && node.memberUid) {
    return (
      <a
        className={`${pd.nodeLabel} ${x.chainNode} ${x.nodeChip}`}
        href={`/members/${node.memberUid}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <img className={x.chainIcon} src={getDefaultAvatar(node.label)} alt="" width={14} height={14} />
        <span>{node.label}</span>
        <span className={x.chainArrowInline} aria-hidden>
          <ArrowUpRightIcon width={12} height={12} />
        </span>
      </a>
    );
  }

  // Org we can route through, person unknown.
  if (node.variant === 'org') {
    // PL-network org → real logo + link to its profile + "?".
    if (node.teamUid) {
      return (
        <a
          className={`${pd.nodeLabel} ${x.chainNode} ${x.nodeChip}`}
          href={`/teams/${node.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="This team can connect — person unknown"
        >
          <img className={x.chainIcon} src={node.logo ?? getDefaultAvatar(node.label)} alt="" width={14} height={14} />
          <span>{node.label}</span>
          <UnknownBadge />
          <span className={x.chainArrowInline} aria-hidden>
            <ArrowUpRightIcon width={12} height={12} />
          </span>
        </a>
      );
    }
    // External org → dashed chip + building glyph + "?".
    return (
      <span className={`${pd.nodeLabel} ${x.chainNode} ${x.chainNodeOrg}`} title="Someone here can connect — person unknown">
        <span className={x.chainOrgIcon} aria-hidden>
          <OrgGlyph />
        </span>
        <span>{node.label}</span>
        <UnknownBadge />
      </span>
    );
  }

  // Known person, not in the PL network → plain user silhouette, no link.
  return (
    <span className={`${pd.nodeLabel} ${x.chainNode} ${x.chainNodeExternal}`} title="Not in the PL network">
      <span className={x.chainPersonIcon} aria-hidden>
        <PersonGlyph />
      </span>
      <span>{node.label}</span>
    </span>
  );
}

// Plain user silhouette (no frame/chevrons) for non-network connectors.
export function PersonGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z" />
    </svg>
  );
}

// Building / org glyph for org-led (person-unknown) connectors.
export function OrgGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v4h4a1 1 0 0 1 1 1v11H4Zm3-3h2v-2H7v2Zm0-4h2v-2H7v2Zm0-4h2V8H7v2Zm4 8h2v-2h-2v2Zm0-4h2v-2h-2v2Zm0-4h2V8h-2v2Zm4 8h3v-7h-3v2h1v5Z" />
    </svg>
  );
}
