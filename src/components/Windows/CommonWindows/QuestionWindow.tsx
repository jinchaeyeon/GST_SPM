import { useEffect, useRef, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  IAttachmentData,
  ICustData,
  IWindowPosition,
} from "../../../hooks/interfaces";
import {
  deletedAttadatnumsState,
  isLoading,
  loginResultState,
  unsavedAttadatnumsState,
} from "../../../store/atoms";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import { DEFAULT_ATTDATNUMS } from "../../CommonString";
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
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import {
  ComboBoxFilterChangeEvent,
  MultiColumnComboBox,
} from "@progress/kendo-react-dropdowns";
import { FilterDescriptor, filterBy } from "@progress/kendo-data-query";
import {
  custTypeColumns,
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../../../store/columns/common-columns";
import { bytesToBase64 } from "byte-base64";
import { useApi } from "../../../hooks/api";
import CustomersWindow from "./CustomersWindow";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import RichEditor from "../../RichEditor";
import { TEditorHandle } from "../../../store/types";
import PopUpAttachmentsWindow from "./PopUpAttachmentsWindow";
import { UseParaPc, convertDateToStr, toDate } from "../../CommonFunction";

type IKendoWindow = {
  setVisible(t: boolean): void;
  reload(str: string): void;
  para?: any;
  modal: boolean;
};

const custQueryStr = `SELECT custcd,custnm
FROM ba020t where useyn = 'Y' order by custcd`;

const receptionTypeQueryStr = `SELECT a.sub_code,
a.code_name
FROM comCodeMaster a 
WHERE a.group_code = 'BA097'
AND use_yn = 'Y'`;

const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;

const usersQueryStr = `SELECT user_id, user_name 
FROM sysUserMaster`;

const KendoWindow = ({
  setVisible,
  reload,
  para = "",
  modal = false,
}: IKendoWindow) => {
  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const userName = loginResult ? loginResult.userName : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const setLoading = useSetRecoilState(isLoading);
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: isMobile == true ? deviceWidth : 1200,
    height: 900,
  });
  // 서버 업로드는 되었으나 DB에는 저장안된 첨부파일 리스트
  const [unsavedAttadatnums, setUnsavedAttadatnums] = useRecoilState(
    unsavedAttadatnumsState
  );
  // 삭제할 첨부파일 리스트를 담는 함수
  const setDeletedAttadatnums = useSetRecoilState(deletedAttadatnumsState);

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
    if (unsavedAttadatnums.attdatnums.length > 0) {
      setDeletedAttadatnums(unsavedAttadatnums);
    }
    setUnsavedAttadatnums(DEFAULT_ATTDATNUMS);
    reload(para.document_id);
    setVisible(false);
  };

  const [custWindowVisible, setCustWindowVisible] = useState<boolean>(false);
  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const [attachmentsWindowVisible2, setAttachmentsWindowVisible2] =
    useState<boolean>(false);
  const onAttWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const onAttWndClick2 = () => {
    setAttachmentsWindowVisible2(true);
  };
  const [Information, setInformation] = useState<{ [name: string]: any }>({
    custcd: "",
    custnm: { custcd: "", custnm: "" },
    user_name: "",
    user_tel: "",
    request_date: new Date(),
    reception_date: new Date(),
    reception_type: { sub_code: "", code_name: "" },
    reception_person: { user_id: userId, user_name: userName },
    value_code3: { sub_code: "", code_name: "" },
    reception_time: 0,
    attach_number: "",
    attach_files: "",
    title: "",
    attdatnum: "",
    files: "",
    be_finished_date: "",
  });
  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name = "" } = e.target;

    setInformation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const filterComboBoxChange = (e: any) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    if (name == "custnm") {
      setInformation((prev) => ({
        ...prev,
        custcd: value.custcd,
        [name]: value,
      }));
    } else {
      setInformation((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  const [filter, setFilter] = useState<FilterDescriptor>();
  const [filter2, setFilter2] = useState<FilterDescriptor>();
  const [filter3, setFilter3] = useState<FilterDescriptor>();
  const [filter4, setFilter4] = useState<FilterDescriptor>();
  const handleFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter(event.filter);
    }
  };
  const handleFilterChange2 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter2(event.filter);
    }
  };
  const handleFilterChange3 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter3(event.filter);
    }
  };
  const handleFilterChange4 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setFilter4(event.filter);
    }
  };
  const [custListData, setCustListData] = useState<any[]>([]);
  const [receptionTypeData, setReceptionTypeData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [valuecodeItems, setValuecodeItems] = useState<any[]>([]);

  const fetchValueCode = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(valueCodeQueryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("bizgst-query", query);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.isSuccess === true) {
      const rows = data.tables[0].Rows;
      setValuecodeItems(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchUsers = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(usersQueryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("bizgst-query", query);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.isSuccess === true) {
      const rows = data.tables[0].Rows;
      setUsersData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchReceptionType = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(receptionTypeQueryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("bizgst-query", query);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.isSuccess === true) {
      const rows = data.tables[0].Rows;
      setReceptionTypeData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchCust = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(custQueryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("bizgst-query", query);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.isSuccess === true) {
      const rows = data.tables[0].Rows;
      setCustListData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    fetchCust();
    fetchReceptionType();
    fetchUsers();
    fetchValueCode();
  }, []);

  useEffect(() => {
    if (
      para != "" &&
      receptionTypeData.length != 0 &&
      usersData.length != 0 &&
      valuecodeItems.length != 0
    ) {
      setInformation({
        custcd: para.customer_code,
        custnm: { custcd: para.customer_code, custnm: para.customer_name },
        user_name: para.user_name,
        user_tel: para.user_tel,
        request_date: toDate(para.request_date),
        reception_date: toDate(para.reception_date),
        reception_type: {
          sub_code: para.reception_type,
          code_name: receptionTypeData.find(
            (items: any) => items.sub_code == para.reception_type
          )?.code_name,
        },
        reception_person: {
          user_id: para.reception_person,
          user_name: usersData.find(
            (items: any) => items.user_id == para.reception_person
          )?.user_name,
        },
        value_code3: {
          sub_code: para.value_code3,
          code_name: valuecodeItems.find(
            (items: any) => items.sub_code == para.value_code3
          )?.code_name,
        },
        reception_time: para.reception_time,
        attach_number: para.reception_attach_number,
        attach_files: para.reception_attach_files,
        title: para.title,
        attdatnum: para.attdatnum,
        files: para.files,
        be_finished_date: toDate(para.be_finished_date),
      });

      fetchDocument(para.document_id);
    }
  }, [para, receptionTypeData, usersData, valuecodeItems]);

  const fetchDocument = async (ref_key: any) => {
    let data: any;
    setLoading(true);

    if (ref_key != "") {
      const para = {
        para: `document?type=Question&id=${ref_key}`,
      };

      try {
        data = await processApi<any>("document", para);
      } catch (error) {
        data = null;
      }

      if (data !== null) {
        const document = data.document;
        if (refEditorRef.current) {
          refEditorRef.current.setHtml(document);
        }
      } else {
        if (refEditorRef.current) {
          refEditorRef.current.setHtml("");
        }
      }
    } else {
      if (refEditorRef.current) {
        refEditorRef.current.setHtml("");
      }
    }
    setLoading(false);
  };

  const setCustData = (data: ICustData) => {
    setInformation((prev) => ({
      ...prev,
      custcd: data.custcd,
      custnm: { custcd: data.custcd, custnm: data.custnm },
    }));
  };

  const getAttachmentsData = (data: IAttachmentData) => {
    if (!Information.attach_number) {
      setUnsavedAttadatnums((prev) => ({
        type: [...prev.type, "receipt"],
        attdatnums: [...prev.attdatnums, ...[data.attdatnum]],
      }));
    }
    setInformation((prev) => ({
      ...prev,
      attach_number: data.attdatnum,
      attach_files:
        data.original_name +
        (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
    }));
  };
  const getAttachmentsData2 = (data: IAttachmentData) => {
    if (!Information.attdatnum) {
      setUnsavedAttadatnums((prev) => ({
        type: [...prev.type, "question"],
        attdatnums: [...prev.attdatnums, ...[data.attdatnum]],
      }));
    }
    setInformation((prev) => ({
      ...prev,
      attdatnum: data.attdatnum,
      files:
        data.original_name +
        (data.rowCount > 1 ? " 등 " + String(data.rowCount) + "건" : ""),
    }));
  };
  const refEditorRef = useRef<TEditorHandle>(null);
  const parseDate = (input: any) => {
    // 값이 없는 경우 null 반환
    if (!input) {
      return "";
    }

    const pattern = /(^\d{4})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/;

    if (!pattern.test(input)) {
      return "";
    }

    var yyyyMMdd = String(input);
    var sYear = yyyyMMdd.substring(0, 4);
    var sMonth = yyyyMMdd.substring(4, 6);
    var sDate = yyyyMMdd.substring(6, 8);

    // 입력을 Date 객체로 변환
    const date = new Date(Number(sYear), Number(sMonth) - 1, Number(sDate));

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      // 유효하지 않은 날짜인 경우 오늘의 날짜 반환
      return "";
    } else {
      // 유효한 날짜인 경우 변환된 날짜 반환
      return date;
    }
  };
  const onConfirmClick = async () => {
    if (
      Information.custnm.custnm == "" ||
      Information.custnm.custnm == undefined ||
      Information.custnm.custnm == null ||
      Information.user_name == "" ||
      parseDate(convertDateToStr(Information.reception_date)) == "" ||
      parseDate(convertDateToStr(Information.request_date)) == "" ||
      Information.reception_type.sub_code == "" ||
      Information.reception_type.sub_code == undefined ||
      Information.reception_type.sub_code == null ||
      Information.reception_person.user_id == "" ||
      Information.reception_person.user_id == undefined ||
      Information.reception_person.user_id == null ||
      Information.title == ""
    ) {
      alert("필수 항목을 채워주세요.");
    } else {
      let editorContent: any = "";
      if (refEditorRef.current) {
        editorContent = refEditorRef.current.getContent();
      }
      const bytes = require("utf8-bytes");
      const convertedEditorContent = bytesToBase64(bytes(editorContent));

      const parser = new DOMParser();
      const doc = parser.parseFromString(editorContent, "text/html");
      const textContent = doc.body.textContent || ""; //문자열

      let data: any;
      setLoading(true);
      const paras = {
        fileBytes: convertedEditorContent,
        procedureName: "pw6_sav_receptions",
        pageNumber: 0,
        pageSize: 0,
        parameters: {
          "@p_work_type": para == "" ? "N" : "U",

          "@p_row_status": para == "" ? "" : "U",
          "@p_document_id_s": para == "" ? "" : para.document_id,

          "@p_customer_code_s": Information.custcd,
          "@p_user_name_s": Information.user_name,
          "@p_user_tel_s": Information.user_tel,
          "@p_request_date_s":
            Information.request_date == null
              ? ""
              : convertDateToStr(Information.request_date),

          "@p_title_s": Information.title,
          "@p_reception_type_s":
            Information.reception_type == ""
              ? ""
              : Information.reception_type.sub_code,

          "@p_reception_date_s":
            Information.reception_date == null
              ? ""
              : convertDateToStr(Information.reception_date),
          "@p_reception_person_s":
            Information.reception_person == ""
              ? ""
              : Information.reception_person.user_id,
          "@p_reception_time_s": Information.reception_time,

          "@p_work_person_s": "",
          "@p_work_estimated_hour_s": 0,
          "@p_work_estimated_minute_s": 0,
          "@p_value_code3_s":
            Information.value_code3 == ""
              ? ""
              : Information.value_code3.sub_code,

          "@p_be_finished_date_s":
            Information.be_finished_date == null
              ? ""
              : convertDateToStr(Information.be_finished_date),
          "@p_completion_date_s": para == "" ? "" : para.completion_date,
          "@p_status_s": para == "" ? "U" : para.status,
          "@p_attach_number_s": Information.attach_number,
          "@p_ref_number_s": para == "" ? "U" : para.ref_number,

          "@p_contents": textContent,
          "@p_attdatnum": Information.attdatnum,

          "@p_id": userId,
          "@p_pc": pc,
        },
      };

      try {
        data = await processApi<any>("receptions-save", paras);
      } catch (error) {
        data = null;
      }
      if (data != null) {
        reload(data.returnString);
        setUnsavedAttadatnums(DEFAULT_ATTDATNUMS);
        setVisible(false);
      } else {
        console.log("[오류 발생]");
        console.log(data);
      }
      setLoading(false);
    }
  };

  return (
    <Window
      title={"접수 내용 작성"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={modal}
    >
      <GridTitleContainer>
        <GridTitle>접수 기본정보</GridTitle>
      </GridTitleContainer>
      <FormBoxWrap border={true}>
        <FormBox>
          <tbody>
            <tr>
              <th>업체코드</th>
              <td>
                <div className="filter-item-wrap">
                  <Input
                    name="custcd"
                    value={Information.custcd}
                    className="readonly"
                  />
                  <Button
                    icon="more-horizontal"
                    fillMode={"flat"}
                    onClick={() => setCustWindowVisible(true)}
                  />
                </div>
              </td>
              <th>업체명</th>
              <td colSpan={3}>
                <MultiColumnComboBox
                  name="custnm"
                  data={filter ? filterBy(custListData, filter) : custListData}
                  value={Information.custnm}
                  columns={custTypeColumns}
                  textField={"custnm"}
                  onChange={filterComboBoxChange}
                  filterable={true}
                  onFilterChange={handleFilterChange}
                  className="required"
                />
              </td>
            </tr>
            <tr>
              <th>고객명</th>
              <td>
                <Input
                  name="user_name"
                  type="text"
                  value={Information.user_name}
                  className="required"
                  onChange={filterInputChange}
                />
              </td>
              <th>연락처</th>
              <td colSpan={3}>
                <Input
                  name="user_tel"
                  type="text"
                  value={Information.user_tel}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
            <tr>
              <th>요청일</th>
              <td>
                <DatePicker
                  name="request_date"
                  value={Information.request_date}
                  onChange={filterInputChange}
                  format="yyyy-MM-dd"
                  className="required"
                  placeholder=""
                />
              </td>
              <th>접수일</th>
              <td>
                <DatePicker
                  name="reception_date"
                  value={Information.reception_date}
                  onChange={filterInputChange}
                  format="yyyy-MM-dd"
                  className="required"
                  placeholder=""
                />
              </td>
              <th>접수구분</th>
              <td>
                <MultiColumnComboBox
                  name="reception_type"
                  data={
                    filter2
                      ? filterBy(receptionTypeData, filter2)
                      : receptionTypeData
                  }
                  value={Information.reception_type}
                  columns={dataTypeColumns}
                  textField={"code_name"}
                  onChange={filterComboBoxChange}
                  filterable={true}
                  onFilterChange={handleFilterChange2}
                  className="required"
                />
              </td>
            </tr>
            <tr>
              <th>접수자</th>
              <td>
                <MultiColumnComboBox
                  name="reception_person"
                  data={filter3 ? filterBy(usersData, filter3) : usersData}
                  value={Information.reception_person}
                  columns={userColumns}
                  textField={"user_name"}
                  onChange={filterComboBoxChange}
                  filterable={true}
                  onFilterChange={handleFilterChange3}
                  className="required"
                />
              </td>
              <th>Value 구분</th>
              <td>
                <MultiColumnComboBox
                  name="value_code3"
                  data={
                    filter4 ? filterBy(valuecodeItems, filter4) : valuecodeItems
                  }
                  value={Information.value_code3}
                  columns={dataTypeColumns2}
                  textField={"code_name"}
                  onChange={filterComboBoxChange}
                  filterable={true}
                  onFilterChange={handleFilterChange4}
                />
              </td>
              <th>접수소요시간</th>
              <td>
                <Input
                  name="reception_time"
                  type="number"
                  value={Information.reception_time}
                  onChange={filterInputChange}
                />
              </td>
            </tr>
            <tr>
              <th>완료예정일</th>
              <td>
                <DatePicker
                  name="be_finished_date"
                  value={Information.be_finished_date}
                  onChange={filterInputChange}
                  format="yyyy-MM-dd"
                  placeholder=""
                />
              </td>
              <th>접수첨부자료</th>
              <td colSpan={3}>
                <Input
                  name="attach_files"
                  type="text"
                  value={Information.attach_files}
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
            <tr>
              <th>제목</th>
              <td colSpan={5}>
                <Input
                  name="title"
                  type="text"
                  value={Information.title}
                  onChange={filterInputChange}
                  className="required"
                />
              </td>
            </tr>
          </tbody>
        </FormBox>
      </FormBoxWrap>
      <GridContainer height={isMobile ? "80vh" : "55%"}>
        <GridTitleContainer>
          <GridTitle>내용</GridTitle>
        </GridTitleContainer>
        <RichEditor id="refEditor" ref={refEditorRef} />
        <FormBoxWrap border={true}>
          <FormBox>
            <tbody>
              <tr>
                <th style={{ width: "5%" }}>파일첨부</th>
                <td colSpan={5}>
                  <Input
                    name="files"
                    type="text"
                    value={Information.files}
                    className="readonly"
                  />
                  <ButtonInGridInput>
                    <Button
                      onClick={onAttWndClick2}
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
        <ButtonContainer>
          <Button themeColor={"primary"} onClick={onConfirmClick}>
            확인
          </Button>
          <Button themeColor={"primary"} fillMode={"outline"} onClick={onClose}>
            닫기
          </Button>
        </ButtonContainer>
      </BottomContainer>
      {attachmentsWindowVisible && (
        <PopUpAttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={Information.attach_number}
          permission={{ upload: true, download: true, delete: true }}
          type={"receipt"}
        />
      )}
      {attachmentsWindowVisible2 && (
        <PopUpAttachmentsWindow
          setVisible={setAttachmentsWindowVisible2}
          setData={getAttachmentsData2}
          para={Information.attdatnum}
          permission={{ upload: true, download: true, delete: true }}
          type={"question"}
        />
      )}
      {custWindowVisible && (
        <CustomersWindow
          setVisible={setCustWindowVisible}
          workType={"Filter"}
          setData={setCustData}
        />
      )}
    </Window>
  );
};
export default KendoWindow;
