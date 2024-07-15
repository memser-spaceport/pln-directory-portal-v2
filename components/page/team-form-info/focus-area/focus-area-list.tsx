'use client';
interface IFocusAreasList {
  selectedItems: any[];
  onOpen: (mode: string) => void;
  rawData: any[];
}

interface ISelectedAreas {
  title: string;
  index: number;
  path: string;
  firstParent: string;
}

const FocusAreasList = (props: IFocusAreasList) => {
  const selectedItems = props.selectedItems ?? [];
  const onOpen = props.onOpen;
  const rawData = props.rawData ?? [];
  // const analytics = useAppAnalytics();
  const formattedRawData = getFormattedFocusArea(rawData);
  const selectedFocusAreas = getSelectedItems(formattedRawData, selectedItems)?.sort((firstItem: ISelectedAreas, secondItem: ISelectedAreas) => firstItem.index - secondItem.index);

  function findParents(data: any[], childUid: string) {
    const parents:any = [];
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
    data.forEach((item: any) => {
      findParentsRecursive(item, childUid);
    });
    return parents;
  }

  function getSelectedItems(rawData: any[], selectedValues: any[]): ISelectedAreas[] {
    const selectedParents:any = {};
    try {
      selectedValues.forEach((selectedValue) => {
        const parents = findParents(rawData, selectedValue.uid);
        const newParents = parents.length > 0 ? parents : [selectedValue];
        const path = newParents
          .map((parent: any) => parent.title)
          .reverse()
          .join(' > ');
        if (!selectedParents[path]) {
          selectedParents[path] = {
            title: selectedValue.title,
            path: path || selectedValue.title,
            index: findItemIndex(formattedRawData, selectedValue),
          };
        } else {
          selectedParents[path].title += `, ${selectedValue.title}`;
        }
      });
      return Object.values(selectedParents);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function findItemIndex(nodes: any, item: any) {
    for (const node of nodes) {
      if (node.uid === item.uid) {
        return node.index;
      }
      if (node.children && node.children.length > 0) {
        const found: any = findItemIndex(node.children, item);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  function getFormattedFocusArea(focusArea: any[]) {
    let index = 1;
    function traverse(node: any) {
      node.index = index++;
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => {
          traverse(child);
        });
      }
    }
    focusArea.forEach((node) => {
      traverse(node);
    });
    return focusArea;
  }

  function onEditClicked() {
   
    /*  analytics.captureEvent(APP_ANALYTICS_EVENTS.FOCUS_AREA_EDIT_BTN_CLICKED, {
      from,
      user,
      team: teamDetails,
    }); */
    onOpen('Edit');
  }

  return (
    <>
      <div className="fl">
        <div className="fl__head">
          <div className="fl__head__title">
            <span className="fl__head__title__text">Focus Area(s)</span>
            <span className="fl__head__title__count">{selectedItems.length}</span>
          </div>
          {selectedItems.length > 0 && (
            <div onClick={onEditClicked} className="fl__head__btn">
              Edit
            </div>
          )}
        </div>
        {selectedItems?.length === 0 && (
          <button onClick={(e) => {
            e.stopPropagation();
            e.preventDefault()
            onOpen('Select')
          }} className="fl__selectbtn">
            Select Focus Area(s)
          </button>
        )}
        {selectedItems?.length > 0 && (
          <div className="fl__list">
            {selectedFocusAreas.map((path: ISelectedAreas, index: number) => {
              return (
                <div key={`${path} + ${index}`} className="fl__list__item">
                  {path?.title !== path?.path && (
                    <div className="fl__list__item__head">
                      <div className={`fl__list__item__head__title`}>{path?.path ? path.path : ''}</div>
                      <div className="fl__list__item__head__img">
                        <img alt="right_arrow" src="/icons/arrow-down.svg" />
                      </div>
                    </div>
                  )}

                  <div className={`fl__list__path ${path.title !== path.path ? 'fl__list__path--unique' : ''}`}>
                    {path?.title?.split(',')?.map((path, index) => (
                      <div key={`${path} + ${index}`} className="fl__list__path__text">
                        {path}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style jsx>
        {`
          .fl {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding-top: 10px;
          }

          .fl__selectbtn {
            display: flex;
            height: 40px;
            width: 100%;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            border: 1px solid #156ff7;
            padding: 8px;
            font-size: 12px;
            font-weight: 500;
            color: #156ff7;
          }
          .fl__list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .fl__list__path {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
          }

          .fl__list__path--unique {
            margin-left: 12px;
          }
          .fl__list__path__text {
            border-radius: 24px;
            background: #f3f4f6;
            padding: 6px 8px;
            font-size: 14px;
            font-weight: 500;
            color: #4b5563;
            //word-break
          }

          .fl__list__item {
            display: flex;
            flex-direction: column;
            gap: 8px;
            border: 1px solid #cbd5e1;
            padding: 13px 14px;
            border-radius: 8px;
          }

          .fl__list__item__head {
            display: flex;
            align-items: center;
            gap: 4px;
            border-radius: 2px;
            border: #cbd5e1;
          }
          .fl__list__item__head__title {
            font-size: 14px;
            font-weight: 400;
            color: #0f172a;
            // word-break break-words
          }
          .fl__list__item__head__img {
            display: flex;
            height: 16px;
            width: 14px;
            align-items: center;
            justify-content: center;
          }

          .fl__head {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .fl__head__title__text {
            margin-right: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
          }
          .fl__head__title__count {
            height: 18px;
            width: 24px;
            border-radius: 8px;
            background: #f1f5f9;
            padding: 2px;
            font-size: 12px;
            font-weight: 500;
            color: #475569;
          }
          .fl__head__btn {
            font-size: 14px;
            font-weight: 600;
            color: #156ff7;
            cursor:pointer;
          }
        `}
      </style>
    </>
  );
};

export default FocusAreasList;
