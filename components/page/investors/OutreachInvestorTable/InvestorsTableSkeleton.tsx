import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import s from './InvestorsTableSkeleton.module.scss';

const ROWS = Array.from({ length: 8 });

export function InvestorsTableSkeleton() {
  return (
    <div className={s.wrap}>
      {/* toolbar */}
      <div className={s.toolbar}>
        <Skeleton width={120} height={14} borderRadius={4} />
        <div className={s.toolbarRight}>
          <Skeleton width={90} height={28} borderRadius={6} />
          <Skeleton width={100} height={28} borderRadius={6} />
        </div>
      </div>

      {/* table */}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr className={s.headerRow}>
              <th className={s.thCheck}><Skeleton width={14} height={14} borderRadius={3} /></th>
              <th className={s.thName}><Skeleton width={40} height={10} borderRadius={4} /></th>
              <th className={s.thFirm}><Skeleton width={36} height={10} borderRadius={4} /></th>
              <th className={s.thWide}><Skeleton width={90} height={10} borderRadius={4} /></th>
              <th className={s.thNarrow}><Skeleton width={44} height={10} borderRadius={4} /></th>
              <th className={s.thNarrow}><Skeleton width={36} height={10} borderRadius={4} /></th>
              <th className={s.thWide}><Skeleton width={80} height={10} borderRadius={4} /></th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((_, i) => (
              <tr key={i} className={s.row}>
                <td className={s.tdCheck}>
                  <Skeleton width={14} height={14} borderRadius={3} />
                </td>
                <td className={s.tdName}>
                  <Skeleton width={`${55 + (i % 3) * 15}%`} height={13} borderRadius={4} />
                  <Skeleton width={`${40 + (i % 4) * 10}%`} height={11} borderRadius={4} style={{ marginTop: 4 }} />
                </td>
                <td className={s.tdFirm}>
                  <Skeleton width={`${50 + (i % 3) * 12}%`} height={13} borderRadius={4} />
                  <Skeleton width={`${35 + (i % 2) * 15}%`} height={11} borderRadius={4} style={{ marginTop: 4 }} />
                </td>
                <td className={s.tdWide}>
                  <div className={s.pills}>
                    <Skeleton width={64} height={20} borderRadius={999} />
                    {i % 3 !== 0 && <Skeleton width={80} height={20} borderRadius={999} />}
                  </div>
                </td>
                <td className={s.tdNarrow}>
                  <Skeleton width={48} height={13} borderRadius={4} />
                </td>
                <td className={s.tdNarrow}>
                  <Skeleton width={56} height={13} borderRadius={4} />
                </td>
                <td className={s.tdWide}>
                  {i % 4 !== 0 && (
                    <div className={s.pills}>
                      <Skeleton width={90} height={20} borderRadius={999} />
                      {i % 2 === 0 && <Skeleton width={72} height={20} borderRadius={999} />}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
