import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import { Checkbox, Input } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  BottomContainer,
  ButtonContainer,
  ButtonInGridInput,
  FormBox,
  FormBoxWrap,
  GridContainer,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { useApi } from "../../../hooks/api";
import { IWindowPosition } from "../../../hooks/interfaces";
import { isLoading, loginResultState } from "../../../store/atoms";
import { Iparameters, TEditorHandle } from "../../../store/types";
import {
  UseParaPc,
  convertDateToStr,
  dateformat2,
  extractDownloadFilename,
  toDate,
} from "../../CommonFunction";
import { PAGE_SIZE } from "../../CommonString";
import RichEditor from "../../RichEditor";
import PopUpAttachmentsWindow from "./PopUpAttachmentsWindow";

interface IAnswer {
  reception_document_id: string;
}

type IWindow = {
  setVisible(t: boolean): void;
  para: IAnswer;
  reload(): void;
};

const SignWindow = ({ setVisible, para, reload }: IWindow) => {
  const setLoading = useSetRecoilState(isLoading);
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");

  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: isMobile == true ? deviceWidth : 1050,
    height: 850,
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
    setFileList([]);
    setSavenmList([]);
    setVisible(false);
  };

  const processApi = useApi();

  //그리드 데이터 조회
  const fetchMainGrid = async () => {
    let data: any;
    setLoading(true);

    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_record",
      pageNumber: 1,
      pageSize: PAGE_SIZE,
      parameters: {
        "@p_work_type": "edit",
        "@p_date_type": "",
        "@p_from_date": "",
        "@p_to_date": "",
        "@p_customer_code": "",
        "@p_customer_name": "",
        "@p_contents": "",
        "@p_orderer": "",
        "@p_worker": "",
        "@p_value_code3": "",
        "@p_status": "",
        "@p_work_category": "",
        "@p_ref_type": "",
        "@p_ref_key": para,
      },
    };
    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) {
        setInformation({
          answer_attdatnum: rows[0].answer_attdatnum,
          answer_document_id: rows[0].answer_document_id,
          answer_files: rows[0].answer_files,
          attdatnum: rows[0].attdatnum,
          be_finished_date: rows[0].be_finished_date,
          check_date: rows[0].check_date,
          completion_date:
            rows[0].completion_date == "" ? null : toDate(rows[0].completion_date),
          contents: rows[0].contents,
          customer_code: rows[0].customer_code,
          customer_name: rows[0].customer_name,
          document_id: rows[0].document_id,
          files: rows[0].files,
          finished_count: rows[0].finished_count,
          insert_pc: rows[0].insert_pc,
          insert_time: rows[0].insert_time,
          insert_userid: rows[0].insert_userid,
          is_checked: rows[0].is_checked,
          is_finish:
            rows[0].is_finish == "N" || rows[0].is_finish == undefined
              ? false
              : true,
          is_lock: rows[0].is_lock,
          is_public: rows[0].is_public,
          module_type: rows[0].module_type,
          password: rows[0].password,
          reception_attach_exists: rows[0].reception_attach_exists,
          reception_attach_number: rows[0].reception_attach_number,
          reception_date: rows[0].reception_date,
          reception_person: rows[0].reception_person,
          reception_time: rows[0].reception_time,
          reception_type: rows[0].reception_type,
          ref_number: rows[0].ref_number,
          request_date: rows[0].request_date,
          salt: rows[0].salt,
          status: rows[0].status,
          title: rows[0].title,
          user_id: rows[0].user_id,
          user_name: rows[0].user_name,
          user_tel: rows[0].user_tel,
          update_pc: rows[0].update_pc,
          update_time: rows[0].update_time,
          update_userid: rows[0].update_userid,
          value_code3: rows[0].value_code3,
        });
        fetchDocument(rows[0].answer_document_id);
      } else {
      }
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const fetchDocument = async (ref_key: string) => {
    let data: any;
    setLoading(true);

    const para = {
      para: `document?type=Answer&id=${ref_key}`,
    };

    try {
      data = await processApi<any>("document", para);
    } catch (error) {
      data = null;
    }

    if (data !== null) {
      const reference = data.document;
      if (refEditorRef.current) {
        refEditorRef.current.setHtml(reference);
      }
    } else {
      console.log("[에러발생]");
      console.log(data);

      if (refEditorRef.current) {
        refEditorRef.current.setHtml("");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (para != undefined) {
      fetchMainGrid();
    }
  }, [para]);

  const refEditorRef = useRef<TEditorHandle>(null);
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);

  const onAttWndClick = () => {
    setAttachmentsWindowVisible(true);
  };

  const getAttachmentsData = (
    data: any,
    fileList?: FileList | any[],
    savenmList?: string[]
  ) => {
    if (fileList) {
      setFileList(fileList);
    } else {
      setFileList([]);
    }

    if (savenmList) {
      setSavenmList(savenmList);
    } else {
      setSavenmList([]);
    }

    setInformation((prev) => ({
      ...prev,
      answer_attdatnum:
        data.length > 0 ? data[0].attdatnum : prev.answer_attdatnum,
      answer_files:
        data.length > 1
          ? data[0].realnm + " 등 " + String(data.length) + "건"
          : data.length == 0
          ? ""
          : data[0].realnm,
    }));
  };

  const [Information, setInformation] = useState<{ [name: string]: any }>({
    answer_attdatnum: "",
    answer_document_id: "",
    answer_files: "",
    attdatnum: "",
    be_finished_date: "",
    check_date: "",
    completion_date: null,
    contents: "",
    customer_code: "",
    customer_name: "",
    document_id: "",
    files: "",
    finished_count: 0,
    insert_pc: "",
    insert_time: "",
    insert_userid: "",
    is_checked: "",
    is_finish: false,
    is_lock: "",
    is_public: "",
    module_type: "",
    password: "",
    reception_attach_exists: "",
    reception_attach_number: "",
    reception_date: "",
    reception_person: "",
    reception_time: 0,
    reception_type: "",
    ref_number: "",
    request_date: "",
    salt: "",
    status: "",
    title: "",
    user_id: "",
    user_name: "",
    user_tel: "",
    update_pc: "",
    update_time: 0,
    update_userid: "",
    value_code3: "",
  });

  const onSave = async (workType: string) => {
    if (workType == "D") {
      if (!window.confirm("삭제하시겠습니까?")) {
        return false;
      }
    }

    let data2: any;
    const parameters: Iparameters = {
      procedureName: "pw6_sel_answers",
      pageNumber: 1,
      pageSize: PAGE_SIZE,
      parameters: {
        "@p_work_type": "question",
        "@p_document_id": para,
      },
    };

    try {
      data2 = await processApi<any>("procedure", parameters);
    } catch (error) {
      data2 = null;
    }
    const rows = data2.tables[0].Rows;

    let editorContent: any = "";
    if (refEditorRef.current) {
      editorContent = refEditorRef.current.getContent();
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorContent, "text/html");
    const textContent = doc.body.textContent || ""; //문자열

    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent)); //html

    let data3: any;

    let newAttachmentNumber = "";
    const promises = [];

    for (const file of fileList) {
      // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
      if (Information.answer_attdatnum == "" && newAttachmentNumber == "") {
        newAttachmentNumber = await uploadFile(
          file,
          "answer",
          Information.answer_attdatnum
        );
        const promise = newAttachmentNumber;
        promises.push(promise);
        continue;
      }

      const promise = newAttachmentNumber
        ? await uploadFile(
            file,
            "answer",
            Information.answer_attdatnum,
            newAttachmentNumber
          )
        : await uploadFile(file, "answer", Information.answer_attdatnum);
      promises.push(promise);
    }

    const results = await Promise.all(promises);

    // 실패한 파일이 있는지 확인
    if (results.includes(null)) {
      alert("파일 업로드에 실패했습니다.");
    } else {
      setInformation((prev) => ({
        ...prev,
        attdatnum: results[0],
      }));
    }

    let data: any;
    let type = "answer";
    savenmList.map(async (parameter: any) => {
      try {
        data = await processApi<any>("file-delete", {
          type,
          attached: parameter,
        });
      } catch (error) {
        data = null;
      }
    });

    //추가, 수정 프로시저 파라미터
    const paras = {
      fileBytes: convertedEditorContent,
      procedureName: "pw6_sav_answers",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type":
          workType == "U"
            ? rows[0].answer_document_id != undefined &&
              rows[0].answer_document_id != null &&
              rows[0].answer_document_id != ""
              ? "U"
              : "N"
            : workType,
        "@p_document_id": Information.answer_document_id,
        "@p_ref_document_id": para,
        "@p_contents": textContent,
        "@p_attdatnum":
          results[0] == undefined ? Information.answer_attdatnum : results[0],
        "@p_is_finish":
          Information.is_finish == undefined
            ? "N"
            : Information.is_finish == true
            ? "Y"
            : Information.is_finish == false
            ? "N"
            : Information.is_finish,
        "@p_completion_date":
          Information.completion_date == null
            ? ""
            : convertDateToStr(Information.completion_date),
        "@p_id": userId,
        "@p_pc": pc,
      },
    };

    try {
      data3 = await processApi<any>("answer", paras);
    } catch (error) {
      data3 = null;
    }

    if (data3 != null) {
      if (workType == "D") {
        let data2: any;
        try {
          data2 = await processApi<any>("attachment-delete", {
            attached:
              "attachment?type=answer&attachmentNumber=" +
              Information.answer_attdatnum +
              "&id=",
          });
        } catch (error) {
          data2 = null;
        }
      }
      reload();
      setVisible(false);
    }
  };

  const uploadFile = async (
    files: File,
    type: string,
    attdatnum?: string,
    newAttachmentNumber?: string
  ) => {
    let data: any;

    const queryParams = new URLSearchParams();

    if (newAttachmentNumber != undefined) {
      queryParams.append("attachmentNumber", newAttachmentNumber);
    } else if (attdatnum != undefined) {
      queryParams.append("attachmentNumber", attdatnum == "" ? "" : attdatnum);
    }

    const formid = "%28web%29" + pathname;

    queryParams.append("type", type);
    queryParams.append("formId", formid);

    const filePara = {
      attached: "attachment?" + queryParams.toString(),
      files: files,
    };

    setLoading(true);

    try {
      data = await processApi<any>("file-upload", filePara);
    } catch (error) {
      data = null;
    }

    setLoading(false);

    if (data !== null) {
      return data.attachmentNumber;
    } else {
      return data;
    }
  };

  const downloadDoc = async () => {
    let response: any;
    setLoading(true);
    if (Information.answer_document_id == "") {
      alert("데이터를 저장 후 다운로드해주세요.");
    } else {
      const para = {
        para: "doc?type=answer&id=" + Information.answer_document_id,
      };

      try {
        response = await processApi<any>("doc-download", para);
      } catch (error) {
        response = null;
      }

      if (response !== null) {
        const blob = new Blob([response.data]);
        // 특정 타입을 정의해야 경우에는 옵션을 사용해 MIME 유형을 정의 할 수 있습니다.
        // const blob = new Blob([this.content], {type: 'text/plain'})

        // blob을 사용해 객체 URL을 생성합니다.
        const fileObjectUrl = window.URL.createObjectURL(blob);

        // blob 객체 URL을 설정할 링크를 만듭니다.
        const link = document.createElement("a");
        link.href = fileObjectUrl;
        link.style.display = "none";

        // 다운로드 파일 이름을 지정 할 수 있습니다.
        // 일반적으로 서버에서 전달해준 파일 이름은 응답 Header의 Content-Disposition에 설정됩니다.
        link.download = extractDownloadFilename(response);

        // 링크를 body에 추가하고 강제로 click 이벤트를 발생시켜 파일 다운로드를 실행시킵니다.
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 다운로드가 끝난 리소스(객체 URL)를 해제합니다
      }
    }
    setLoading(false);
  };

  const changeCheck = () => {
    setInformation((prev) => ({
      ...prev,
      is_finish:
        prev.is_finish == undefined
          ? true
          : prev.is_finish == "Y"
          ? false
          : prev.is_finish == "N"
          ? true
          : !prev.is_finish,
      completion_date:
        prev.is_finish == false
          ? new Date()
          : prev.is_finish == true
          ? null
          : prev.completion_date,
    }));
  };

  const InputChange = (e: any) => {
    const { value, name = "" } = e.target;

    setInformation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <Window
        title={"답변 작성"}
        width={position.width}
        height={position.height}
        onMove={handleMove}
        onResize={handleResize}
        onClose={onClose}
        modal={true}
      >
        <GridTitleContainer>
          <GridTitle>문의 정보</GridTitle>
        </GridTitleContainer>
        <FormBoxWrap border={true}>
          <FormBox>
            <tbody>
              <tr>
                <th style={{ width: "5%" }}>업체명</th>
                <td>
                  <Input
                    name="customer_name"
                    type="text"
                    value={Information.customer_name}
                    className="readonly"
                  />
                </td>
                <th style={{ width: "5%" }}>제목</th>
                <td colSpan={3}>
                  <Input
                    name="title"
                    type="text"
                    value={Information.title}
                    className="readonly"
                  />
                </td>
              </tr>
              <tr>
                <th style={{ width: "5%" }}>작성자</th>
                <td>
                  <Input
                    name="user_name"
                    type="text"
                    value={Information.user_name}
                    className="readonly"
                  />
                </td>
                <th style={{ width: "5%" }}>연락처</th>
                <td>
                  <Input
                    name="user_tel"
                    type="text"
                    value={Information.user_tel}
                    className="readonly"
                  />
                </td>
                <th style={{ width: "5%" }}>요청일</th>
                <td>
                  <Input
                    name="request_date"
                    type="text"
                    value={dateformat2(Information.request_date)}
                    className="readonly"
                  />
                </td>
              </tr>
            </tbody>
          </FormBox>
        </FormBoxWrap>
        <GridContainer height={`calc(100% - 210px)`}>
          <GridTitleContainer>
            <GridTitle>답변 내용</GridTitle>
          </GridTitleContainer>
          <RichEditor id="refEditor" ref={refEditorRef} />
          <FormBoxWrap border={true}>
            <FormBox>
              <tbody>
                <tr>
                  <th style={{ width: "5%" }}>첨부파일</th>
                  <td>
                    <Input
                      name="answer_files"
                      type="text"
                      value={Information.answer_files}
                      className="readonly"
                    />
                    <ButtonInGridInput>
                      <Button
                        onClick={onAttWndClick}
                        icon="more-horizontal"
                        fillMode="flat"
                      />
                    </ButtonInGridInput>
                  </td>
                </tr>
              </tbody>
            </FormBox>
          </FormBoxWrap>
        </GridContainer>
        <BottomContainer>
          <ButtonContainer style={{ justifyContent: "space-between" }}>
            <div style={{ float: "left" }}>
              <Button
                fillMode={"outline"}
                themeColor={"primary"}
                icon="delete"
                onClick={() => onSave("D")}
              >
                삭제
              </Button>
              <Button
                themeColor={"primary"}
                fillMode={"outline"}
                icon={"file-word"}
                onClick={downloadDoc}
              >
                다운로드
              </Button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                marginTop: isMobile ? "10px" : "0px",
              }}
            >
              <div style={{ marginTop: "10px", marginRight: "10px" }}>
                <Checkbox
                  value={Information.is_finish}
                  onClick={changeCheck}
                  label="처리 완료"
                />
              </div>
              <div className="datepicker_button">
                <DatePicker
                  name="completion_date"
                  value={Information.completion_date}
                  onChange={InputChange}
                  format="yyyy-MM-dd"
                  className="required"
                  placeholder=""
                  disabled={Information.is_finish == true ? false : true}
                  size={"small"}
                />
              </div>
              <Button
                themeColor={"primary"}
                onClick={() => onSave("U")}
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
            </div>
          </ButtonContainer>
        </BottomContainer>
      </Window>
      {attachmentsWindowVisible && (
        <PopUpAttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={Information != undefined ? Information.answer_attdatnum : ""}
          permission={{ upload: true, download: true, delete: true }}
          type={"answer"}
          fileLists={fileList}
          savenmLists={savenmList}
        />
      )}
    </>
  );
};

export default SignWindow;
