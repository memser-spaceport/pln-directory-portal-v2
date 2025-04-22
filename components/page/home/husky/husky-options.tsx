import { PAGE_ROUTES } from "@/utils/constants";
import { useRouter } from "next/navigation";
import { triggerLoader } from "@/utils/common.utils";

const HuskyOptions = (props: any) => {
  const selectionOption = props?.selectedOption;

  const router = useRouter();

 const onOptionsClickHandler = (route: string) => {
    triggerLoader(true);
    router.push(route);
  }

  return (
    <>
      <div className="husky-options">
        <button className={`hysky-options__chat ${selectionOption === 'chat' ? 'isselected' : ''}`} onClick={() => onOptionsClickHandler(PAGE_ROUTES.HUSKY)}>Chat AI</button>
        <button className={`husky-options__intros ${selectionOption === 'intro' ? 'isselected' : ''} `} onClick={() => onOptionsClickHandler(PAGE_ROUTES.INROS_AI)}>Intros AI</button>
      </div>

      <style jsx>
        {`
          .husky-options {
            border-radius: 8px;
            background: linear-gradient(90deg, #c5e2ff 0%, #dffff1 100%) padding-box, 
                        linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%) border-box;
            border: 1px solid transparent;
            padding: 4px;
          }

          .hysky-options__chat {
            padding: 10px 25px;
            color: #475569;
            font-size: 14px;
            font-weight: 500;

          }

          .husky-options__intros {
            padding: 10px 25px;
            color: #475569;
            font-size: 14px;
            font-weight: 500;
          }

          .isselected {
            border: 1px solid #156ff7;
            background: white;
            font-size: 14px;
            color: #156FF7;
            border-radius: 6px;
            font-weight: 500;
          }
        `}
      </style>
    </>
  );
};

export default HuskyOptions;
