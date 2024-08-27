import TextField from '@/components/form/text-field';
import { IProjectResponse } from '@/types/project.types';
import Image from 'next/image';
import { useState } from 'react';

interface IProjectContributorsInfo {
  project: IProjectResponse;
  errors: string[];
}

export default function ProjectKpisInfo(props: IProjectContributorsInfo) {
  const project = props?.project;
  const errors = props?.errors;

  const kpis = project?.kpis?.length > 0 ? formatProjectKpi(project?.kpis) : [{ key: '', value: '', id: 1 }];

  const [projectKpis, setProjectKpis] = useState(kpis);

  const onKpiKeyChange = (index: number, value: string) => {
    setProjectKpis((old: any) => {
      old[index].key = value;
      return [...old];
    });
  };

  function formatProjectKpi(data: any) {
    let formattedData = [];
    if (data?.length > 0) {
      formattedData = data?.map((kpi: any, index: number) => {
        return {
          ...kpi,
          id: index + 1,
        };
      });
    }
    return formattedData;
  }

  const onKpiValueChange = (index: number, value: string) => {
    setProjectKpis((old: any) => {
      old[index].value = value;
      return [...old];
    });
  };

  const onDeleteKpi = (id: number) => {
    setProjectKpis((old: any) => {
      const temp = [...old].filter((item: any) => item.id !== id);
      return temp;
    });
  };

  const onAddProjectLink = () => {
    setProjectKpis((v: any) => {
      let id = 1;
      const ids = v?.map((dt: any, index: any) => {
        return dt.id;
      });

      if (ids.length > 0) {
        id = Math.max(...ids) + 1;
      }
      const nv = structuredClone(v);
      nv.push({ key: '', value: '', id });
      return nv;
    });
  };

  return (
    <>
      {errors.length > 0 && (
        <ul className="kpi__errors">
          {errors.map((error: string, index: number) => (
            <li key={`project-error-${index}`}>{error}</li>
          ))}
        </ul>
      )}
      <div className="kpiContainer">
        {projectKpis.map((kpi: { id: number; key: string; value: string }, index: number) => (
          <div key={`teams-role-${kpi?.id} `} className="kpiContainer__kpi">
            <div className="kpiContainer__kpi__header">
              <h2 className="kpiContainer__kpi__header__title">KPI {index + 1}</h2>
              {index !== 0 && (
                <button className="kpiContainer__kpi__header__delete" onClick={() => onDeleteKpi(kpi?.id)} type="button">
                  <Image src="/icons/delete-brown.svg" alt="delete team role" width="12" height="12" />
                </button>
              )}
            </div>

            <div className="kpiContainer__kpi__keyAndValue">
              <div className="kpiContainer__kpi__keyAndValue__key">
                <div className="kpiContainer__kpi__keyAndValue__key__ttl">Enter KPI Name</div>
                <TextField
                  maxLength={64}
                  id="register-project-kpi-text"
                  defaultValue={kpi.key}
                  isMandatory={kpi?.value ? true : false}
                  name={`projectKpis${index}-key`}
                  placeholder="Enter KPI Name"
                  type="text"
                  onChange={(e) => onKpiKeyChange(index, e.target.value)}
                />
              </div>
              <div className="kpiContainer__kpi__keyAndValue__value">
                <div className="kpiContainer__kpi__keyAndValue__value__ttl">Enter KPI Value</div>
                <TextField
                  maxLength={64}
                  id="register-project-link-value"
                  defaultValue={kpi.value}
                  isMandatory={kpi?.key ? true : false}
                  name={`projectKpis${index}-value`}
                  placeholder="Enter KPI Value"
                  onChange={(e) => onKpiValueChange(index, e.target.value)}
                  type="text"
                />
              </div>
            </div>
          </div>
        ))}

        {projectKpis.length < 5 && (
          <button type="button" onClick={onAddProjectLink} className="kpiContainer__addOptBtn">
            <Image src="/icons/add.svg" width="16" height="16" alt="Add New" />
            <div className="kpiContainer__addOptBtn__addTxt">Add KPI</div>
            <div className="kpiContainer__addOptBtn__remTxt">(Max 5 KPIs)</div>
          </button>
        )}
      </div>

      <style jsx>
        {`
          .kpi__errors {
            color: red;
            font-size: 12px;
            padding: 0 16px 16px 16px;
          }
          .kpiContainer {
            display: flex;
            padding-bottom: 100px;
            flex-direction: column;
            gap: 12px;
          }

          .kpiContainer__kpi {
            background-color: white;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            border-radius: 8px;
          }

          .kpiContainer__kpi__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .kpiContainer__kpi__header__delete {
            height: 24px;
            width: 24px;
            background-color: #dd2c5a1a;
            outline: none;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }

          .kpiContainer__kpi__header__title {
            line-height: 32px;
            font-weight: 700;
            font-size: 12px;
            color: #64748b;
          }

          .kpiContainer__kpi__keyAndValue {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .kpiContainer__kpi__keyAndValue__key {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .kpiContainer__kpi__keyAndValue__value {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .kpiContainer__kpi__keyAndValue__value__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .kpiContainer__kpi__keyAndValue__key__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .kpiContainer__addOptBtn {
            display: flex;
            gap: 4px;
            width: fit-content;
            align-items: center;
            background: none;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
            padding-left: 26px;
          }

          .kpiContainer__addOptBtn__addTxt {
            color: #156ff7;
          }

          .kpiContainer__addOptBtn__remTxt {
            color: #94a3b8;
          }

          @media (min-width: 1024px) {
            .kpiContainer__kpi__keyAndValue {
              flex-direction: row;
              gap: 10px;
            }
            .kpiContainer__kpi__keyAndValue__key {
              width: 50%;
            }

            .kpiContainer__kpi__keyAndValue__value {
              width: 50%;
            }
          }

          @media (min-width: 1024px) {
            .kpiContainer__addOptBtn {
              padding: unset;
            }
          }
        `}
      </style>
    </>
  );
}
