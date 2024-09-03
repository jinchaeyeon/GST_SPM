import { Button } from "@progress/kendo-react-buttons";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "swiper/css";
import { BottomContainer, ButtonContainer } from "../../../CommonStyled";
import { IWindowPosition } from "../../../hooks/interfaces";
import { TEditorHandle } from "../../../store/types";
import { getHeight, getWindowDeviceHeight } from "../../CommonFunction";
import RichEditor from "../../RichEditor";
import Window from "../WindowComponent/Window";

type IWindow = {
  setVisible(t: boolean): void;
  para: any;
  modal?: boolean;
};

var height = 0;
var height2 = 0;

const QnAPopUpWindow = ({ setVisible, para, modal = false }: IWindow) => {
  let deviceWidth = window.innerWidth;
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;

  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 1500) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 850) / 2,
    width: isMobile == true ? deviceWidth : 1500,
    height: isMobile == true ? deviceHeight : 850,
  });

  const onChangePostion = (position: any) => {
    setPosition(position);
    setWebHeight(
      getWindowDeviceHeight(false, position.height) - height - height2 - 20
    );
  };
  const aEditorRef = useRef<TEditorHandle>(null);
  const [mobileheight, setMobileHeight] = useState(0);

  const [webheight, setWebHeight] = useState(0);

  useLayoutEffect(() => {
    height = getHeight(".k-window-titlebar"); //공통 해더
    height2 = getHeight(".BottomContainer"); //하단 버튼부분

    setMobileHeight(
      getWindowDeviceHeight(false, deviceHeight) - height - height2 - 20
    );

    setWebHeight(
      getWindowDeviceHeight(false, position.height) - height - height2 - 20
    );
  }, []);

  const setHtmlOnEditor = (para: any) => {
    if (aEditorRef.current) {
      aEditorRef.current.updateEditable(true);
      aEditorRef.current.setHtml(para);
      aEditorRef.current.updateEditable(false);
    }
  };

  const onClose = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (para != undefined) {
      setHtmlOnEditor(para);
    }
  }, [para]);

  return (
    <>
      <Window
        titles={"답변 팝업"}
        positions={position}
        Close={onClose}
        modals={modal}
        onChangePostion={onChangePostion}
      >
        <div style={{ height: isMobile ? mobileheight : webheight }}>
          <RichEditor id="aEditor" ref={aEditorRef} hideTools />
        </div>
        <BottomContainer className="BottomContainer">
          <ButtonContainer>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              onClick={onClose}
            >
              닫기
            </Button>
          </ButtonContainer>
        </BottomContainer>
      </Window>
    </>
  );
};

export default QnAPopUpWindow;
