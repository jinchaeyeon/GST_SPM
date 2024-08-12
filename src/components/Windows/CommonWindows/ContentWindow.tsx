import { Button } from "@progress/kendo-react-buttons";
import { Input, TextArea } from "@progress/kendo-react-inputs";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  BottomContainer,
  ButtonContainer,
  FormBox,
  FormBoxWrap,
  GridContainer,
} from "../../../CommonStyled";
import { IWindowPosition } from "../../../hooks/interfaces";
import { getHeight, getWindowDeviceHeight } from "../../CommonFunction";
import Window from "../WindowComponent/Window";

type IWindow = {
  setVisible(t: boolean): void;
  title?: string;
  content?: string;
  reload(title: string, content: string): void;
};

var height = 0;
var height2 = 0;

const ContentWindow = ({
  setVisible,
  title = "",
  content = "",
  reload,
}: IWindow) => {
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  let deviceHeight = document.documentElement.clientHeight;
  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 500) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 500) / 2,
    width: isMobile == true ? deviceWidth : 500,
    height: isMobile == true ? deviceHeight : 500,
  });

  const [mobileheight, setMobileHeight] = useState(0);
  const [webheight, setWebHeight] = useState(0);

  useLayoutEffect(() => {
    height = getHeight(".k-window-titlebar");
    height2 = getHeight(".BottomContainer");
    setMobileHeight(
      getWindowDeviceHeight(false, deviceHeight) - height - height2
    );
    setWebHeight(
      getWindowDeviceHeight(false, position.height) - height - height2
    );
  }, []);

  const onChangePostion = (position: any) => {
    setPosition(position);
    setWebHeight(
      getWindowDeviceHeight(false, position.height) - height - height2
    );
  };

  const onClose = () => {
    setVisible(false);
  };

  const [Information, setInformation] = useState<{ [name: string]: any }>({
    title: "",
    content: "",
  });

  useEffect(() => {
    setInformation({
      title: title,
      content: content,
    });
  }, []);

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const InputChange = (e: any) => {
    const { value, name = "" } = e.target;

    setInformation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSave = () => {
    reload(Information.title, Information.content);
    onClose();
  };

  return (
    <>
      <Window
        titles={"내용 수정"}
        positions={position}
        Close={onClose}
        onChangePostion={onChangePostion}
        modals={true}
      >
        <GridContainer height={`${isMobile ? mobileheight : webheight}px`}>
          <FormBoxWrap>
            <FormBox>
              <tbody>
                <tr>
                  <th style={{ width: "8%" }}>제목</th>
                  <td>
                    <Input
                      name="title"
                      type="text"
                      value={Information.title}
                      onChange={InputChange}
                    />
                  </td>
                </tr>
                <tr>
                  <th style={{ width: "8%" }}>내용</th>
                  <td>
                    <TextArea
                      value={Information.content}
                      name="content"
                      rows={isMobile ? 10 : 15}
                      onChange={InputChange}
                    />
                  </td>
                </tr>
              </tbody>
            </FormBox>
            <BottomContainer className="BottomContainer">
              <ButtonContainer style={{ justifyContent: "space-between" }}>
                <Button
                  themeColor={"primary"}
                  onClick={() => onSave()}
                  style={{ marginLeft: "10px" }}
                >
                  확인
                </Button>
                <Button
                  themeColor={"primary"}
                  fillMode={"outline"}
                  onClick={onClose}
                >
                  취소
                </Button>
              </ButtonContainer>
            </BottomContainer>
          </FormBoxWrap>
        </GridContainer>
      </Window>
    </>
  );
};

export default ContentWindow;
