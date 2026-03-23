import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Resolved at build time by Vite.
// We only need the keys (file paths) — the served URL is derived by stripping "/public".
// Using { eager: true } with no import avoids any SVG transform plugins intercepting the imports.
const iconGlobKeys = Object.keys(
  // @ts-ignore
  import.meta.glob('/public/icons/**/*.svg'),
);

type IconGroup = { label: string; icons: { name: string; url: string }[] };

const grouped = iconGlobKeys.reduce<Record<string, { name: string; url: string }[]>>((acc, globPath) => {
  // globPath: /public/icons/badge/maintainer.svg
  // served URL: /icons/badge/maintainer.svg
  const url = globPath.replace('/public', '');
  const relative = globPath.replace('/public/icons/', '');
  const parts = relative.split('/');
  const name = parts.pop()!.replace('.svg', '');
  const folder = parts.length > 0 ? parts.join('/') : 'Root';

  if (!acc[folder]) acc[folder] = [];
  acc[folder].push({ name, url });
  return acc;
}, {});

const ICON_GROUPS: IconGroup[] = Object.entries(grouped)
  .sort(([a], [b]) => {
    if (a === 'Root') return -1;
    if (b === 'Root') return 1;
    return a.localeCompare(b);
  })
  .map(([label, icons]) => ({
    label,
    icons: icons.sort((a, b) => a.name.localeCompare(b.name)),
  }));

function IconGrid() {
  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '32px', color: '#0f172a' }}>
        Icons ({ICON_GROUPS.reduce((sum, g) => sum + g.icons.length, 0)})
      </h1>
      {ICON_GROUPS.map(({ label, icons }) => (
        <div key={label} style={{ marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            {label} <span style={{ fontWeight: 400, color: '#94a3b8' }}>({icons.length})</span>
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '8px',
            }}
          >
            {icons.map(({ name, url }) => (
              <div
                key={url}
                title={url}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 8px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  cursor: 'default',
                }}
              >
                <img
                  src={url}
                  alt={name}
                  width={24}
                  height={24}
                  style={{ objectFit: 'contain', flexShrink: 0 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '0.2';
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    color: '#475569',
                    textAlign: 'center',
                    wordBreak: 'break-all',
                    lineHeight: '14px',
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: 'assets/Icons',
  component: IconGrid,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof IconGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {};
