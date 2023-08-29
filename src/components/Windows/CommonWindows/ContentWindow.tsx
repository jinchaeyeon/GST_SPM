import { Button } from "@progress/kendo-react-buttons";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import { Input, TextArea } from "@progress/kendo-react-inputs";
import { useEffect, useState } from "react";
import {
  BottomContainer,
  ButtonContainer,
  FormBox,
  FormBoxWrap,
  GridContainer,
} from "../../../CommonStyled";
import { IWindowPosition } from "../../../hooks/interfaces";

type IWindow = {
  setVisible(t: boolean): void;
  title?: string;
  content?: string;
  reload(title: string, content: string): void;
};

const ContentWindow = ({
  setVisible,
  title = "",
  content = "",
  reload,
}: IWindow) => {
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: isMobile == true ? deviceWidth : 500,
    height: 500,
  });

  const handleMove = (event: WindowMoveEvent) => {
    setPosition({ ...position, left: event.left, top: event.top });
  };
  const handleResize = (event: WindowMoveEvent) => {
    setPosition({
      left: event.left,
      top: event.top,
      width: event.width,
      height: event.height,
    });
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
        title={"내용 수정"}
        width={position.width}
        height={position.height}
        onMove={handleMove}
        onResize={handleResize}
        onClose={onClose}
        modal={true}
      >
        <GridContainer height={`calc(100% - 50px)`}>
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
            <BottomContainer>
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
