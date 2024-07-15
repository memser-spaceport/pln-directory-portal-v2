/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import FocusArea from './focus-area';

interface IFocusAreas {
  focusAreas: any[];
  onClose: (e?:any) => void;
  selectedItems: any[];
  handleFoucsAreaSave: (items: any[]) => void;
}

const FocusAreas = (props: IFocusAreas) => {
  const focusAreas = props.focusAreas;
  const onClose = props.onClose;
  const handleFoucsAreaSave = props.handleFoucsAreaSave;

  const [selectedItems, setSelectedItems] = useState(props?.selectedItems ?? []);
  const [parents, setParents] = useState(getAllParents(props?.selectedItems ?? []));

  function getAllParents(items: any[]) {
    try {
      let initialParents: any = [];
      items?.map((item) => {
        const parents = findParents(focusAreas, item.uid);
        if (parents?.length > 0) {
          initialParents = [...initialParents, ...parents];
        }
      });
      const uniqueItems = new Set();
      return initialParents.filter((obj: any) => {
        const value = obj['uid'];
        return uniqueItems.has(value) ? false : uniqueItems.add(value);
      });
    } catch (error) {
      console.error(error);
    }
  }

  function findChildrens(node: any) {
    const children: any = [];
    function findChildrenRecursive(currentNode: any) {
      if (currentNode.children && currentNode.children.length > 0) {
        currentNode.children.forEach((child: any) => {
          children.push(child);
          findChildrenRecursive(child);
        });
      }
    }
    findChildrenRecursive(node);
    return children;
  }

  function findParents(data: any[], childUid: string) {
    const parents: any = [];
    const findParentsRecursive = (item: any, childUid: string, currentParents = []) => {
      if (!item || !item.children) return;
      if (item.uid === childUid) {
        parents.push(...currentParents);
        return;
      }
      const updatedParents: any = [...currentParents, item];
      if (item.children) {
        item.children.forEach((child: any) => {
          findParentsRecursive(child, childUid, updatedParents);
        });
      }
    };
    data.forEach((item) => {
      findParentsRecursive(item, childUid);
    });
    return parents;
  }

  const onItemClickHandler = (item: any) => {
    try {
      const hasItem = selectedItems.some((selectedItem) => selectedItem.uid === item.uid);
      if (hasItem) {
        const updatedSelectedItems = selectedItems.filter((selectedItem) => selectedItem.uid !== item.uid);
        setSelectedItems(updatedSelectedItems);
        const parents = getAllParents(updatedSelectedItems);
        setParents(parents);
      } else {
        const childrens = findChildrens(item);
        const parents = findParents(focusAreas, item.uid);
        const idsToRemove = [...parents, ...childrens].map((data) => data.uid);
        const updatedSelectedItems = [...selectedItems].filter((item) => !idsToRemove.includes(item.uid));
        updatedSelectedItems.push(item);
        const uniqueParents = getAllParents(updatedSelectedItems);
        setSelectedItems([...updatedSelectedItems]);
        setParents([...uniqueParents]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getDesc = (item: any) => {
    try {
      const childrens = findChildrens(item);
      const matchedChildren = childrens.filter((child: any) => selectedItems.some((selectedItem) => selectedItem.uid === child.uid));
      const formattedText = matchedChildren
        .map((child: any) => {
          return child?.title;
        })
        .join(', ');
      return formattedText;
    } catch (error) {
      console.error(error);
    }
  };

  const onSaveClickHandler = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    handleFoucsAreaSave(selectedItems);
    onClose(e);
  };

  return (
    <>
      <div className="fas">
        <div className="fas__cn">
          <div className="fas__cn__head">
            <h2 className="fas__cn__head__title">Select Focus Area(s)</h2>
          </div>
          <div className="fas__cn__list">
            {focusAreas?.map((val: any, index: number) => (
              <div key={`${val} + ${index}`} className="fas__cn__list__item">
                <FocusArea
                  key={index}
                  parents={parents}
                  focusAreas={focusAreas}
                  focusArea={val}
                  description={getDesc(val)}
                  selectedItems={selectedItems}
                  isGrandParent={true}
                  onItemClickHandler={onItemClickHandler}
                />
              </div>
            ))}
          </div>

          <div className="fas__cn__action">
            <div className="fas__cn__action__items">
              <button onClick={onClose} className="fas__cn__action__items__close">
                Close
              </button>
              <button onClick={onSaveClickHandler} className="fas__cn__action__items__save save-btn ">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>
        {`
          .fas {
            display: flex;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 20px;
            padding: 20px;
          }
          .fas__cn {
            display: flex;
            height: 100%;
            width: 100%;
            flex-direction: column;
            gap: 20px;
          }
            .fas__cn__action {
            display: flex;
            height: 40px;
            align-items: center;
            justify-content: flex-end;
           
            }
            .fas__cn__action__items {
             display: flex;
             gap: 8px;
           
            }
             .fas__cn__action__items__close {
             display: flex;
             height: 40px;
             align-items: center;
             border-radius: 60px;
             border: 1px solid #CBD5E1;
             padding: 10px 24px;
             font-size: 14px;
             font-weight: 500;
             color: #0F172A;
             background:transparent;
             }
              .fas__cn__action__items__save {
             display: flex;
             height: 40px;
             align-items: center;
             border-radius: 60px;
             border: 1px solid #CBD5E1;
             padding: 10px 24px;
             font-size: 14px;
             font-weight: 500;
             color: #fff;
             }
          .fas__cn__list {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 10px;
            overflow: auto;
            padding-right: 5px;
            padding-bottom: 10px;
          }

          .fas__cn__list__item {
           border-radius: 4px;
           border: 1px solid #CBD5E1;
          }

          .fas__cn__head {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .fas__cn__head__title {
            font-size: 16px;
            margin-top: 5px;
            font-weight: 600;
          }
          ::-webkit-scrollbar {
            width: 6px;
            background: #f7f7f7;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 10px;
          }

          .save-btn {
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
          }
        `}
      </style>
    </>
  );
};

export default FocusAreas;
