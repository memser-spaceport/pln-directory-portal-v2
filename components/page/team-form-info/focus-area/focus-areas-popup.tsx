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
         width: 640px;
         border-radius: 8px;
         background: white;
        }
        
        
        `
      }
    </style>
    </>
  );
};

export default FocusAreasPopup;
