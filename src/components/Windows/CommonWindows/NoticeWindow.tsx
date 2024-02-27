import { Button } from "@progress/kendo-react-buttons";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import { Checkbox } from "@progress/kendo-react-inputs";
import { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
} from "../../../CommonStyled";
import { useApi } from "../../../hooks/api";
import { IWindowPosition } from "../../../hooks/interfaces";
import { loginResultState } from "../../../store/atoms";
import { TEditorHandle } from "../../../store/types";
import RichEditor from "../../RichEditor";

type IWindow = {
  setVisible(t: boolean): void;
  current: any;
  data: any;
  setPara(): void;
  modal?: boolean;
};

const NoticeWindow = ({
  setVisible,
  current,
  data,
  setPara,
  modal = false,
}: IWindow) => {
  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const isAdmin = loginResult && loginResult.role === "ADMIN";
  const editorRef = useRef<TEditorHandle>(null);
  const setHtmlOnEditor = (content: string) => {
    if (editorRef.current) {
      if (!isAdmin) editorRef.current.updateEditable(true);
      editorRef.current.setHtml(content);
      if (!isAdmin) editorRef.current.updateEditable(false);
    }
  };
  const [chk, setChk] = useState(false);

  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 500,
    height: 650,
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
    if (chk == true) {
      const savedNoticesRaw = localStorage.getItem("PopUpNotices");
      const savedNotices = savedNoticesRaw ? JSON.parse(savedNoticesRaw) : [];
      const updatedNotices = [...savedNotices, data.data[current].document_id];
      const uniqueNotices = Array.from(new Set(updatedNotices));

      localStorage.setItem("PopUpNotices", JSON.stringify(uniqueNotices));
    }
    setPara();
    setVisible(false);
  };

  const fetchPopUp = async () => {
    let datas: any;

    const para = {
      id: data.data[current].document_id,
    };

    try {
      datas = await processApi<any>("notice-detail", para);
    } catch (error) {
      datas = null;
    }

    if (datas && datas.result.isSuccess === true) {
      // Edior에 HTML & CSS 세팅
      const document = datas.document;
      setHtmlOnEditor(document);
    }
  };

  useEffect(() => {
    fetchPopUp();
  }, []);

  const InputChange = (e: any) => {
    const { value } = e.target;

    setChk(value);
  };

  const onLink = () => {
    const origin = window.location.origin;
    window.location.href =
      origin + `/Notice?go=` + data.data[current].document_id;
  };

  return (
    <Window
      title={"공지사항"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={modal}
    >
      <GridContainer height={`calc(100% - 70px)`}>
        <RichEditor
          id="editor"
          ref={editorRef}
          hideTools={!isAdmin}
          className={"notice-editor"}
        />
      </GridContainer>
      <BottomContainer style={{ display: "flex" }}>
        <ButtonContainer>
          <div style={{ height: "100%", marginRight: "10px" }}>
            <Checkbox
              value={chk}
              label={"다시는 보지않음"}
              onChange={InputChange}
            />
          </div>
          <Button themeColor={"primary"} fillMode={"outline"} onClick={onClose}>
            닫기
          </Button>
        </ButtonContainer>
        <div>
          <Button
            themeColor={"primary"}
            onClick={onLink}
            style={{ width: "auto" }}
          >
            공지사항으로 이동
          </Button>
        </div>
      </BottomContainer>
    </Window>
  );
};

export default NoticeWindow;
