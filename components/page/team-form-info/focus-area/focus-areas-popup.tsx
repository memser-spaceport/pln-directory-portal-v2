import FocusAreas from './focus-areas';

interface IFocusAreasPopup {
  focusAreas: any[];
  onClose: (e?:any) => void;
  selectedItems: any[];
  handleFoucsAreaSave: (items: any) => void;
}

const FocusAreasPopup = (props: IFocusAreasPopup) => {
  const focusAreas = props.focusAreas;
  const onClose = props.onClose;
  const selectedItems = props.selectedItems;
  const handleFoucsAreaSave = props.handleFoucsAreaSave;

  return (
    <>
    <div className="fp">
      <FocusAreas handleFoucsAreaSave={handleFoucsAreaSave} onClose={onClose} focusAreas={focusAreas} selectedItems={selectedItems} />
    </div>
    <style jsx>
      {
        `
        .fp {
         height: 70vh;
         width: 90vw;
         border-radius: 8px;
         background: white;
        }

        @media(min-width:1024px) {
        .fp {
         width: 640px;
      }

        }
        
        
        `
      }
    </style>
    </>
  );
};

export default FocusAreasPopup;
