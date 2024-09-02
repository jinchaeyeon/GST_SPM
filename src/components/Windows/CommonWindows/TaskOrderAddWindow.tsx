import { filterBy, FilterDescriptor } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  ComboBoxChangeEvent,
  ComboBoxFilterChangeEvent,
} from "@progress/kendo-react-dropdowns";
import { Input } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import SwiperCore from "swiper";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";
import { v4 as uuidv4 } from "uuid";
import {
  BottomContainer,
  ButtonContainer,
  ButtonInGridInput,
  FormBox,
  FormBoxWrap,
  GridContainer,
} from "../../../CommonStyled";
import { useApi } from "../../../hooks/api";
import { IWindowPosition } from "../../../hooks/interfaces";
import { isLoading, loginResultState } from "../../../store/atoms";
import { TEditorHandle } from "../../../store/types";
import CustomMultiColumnComboBox from "../../ComboBoxes/CustomMultiColumnComboBox";
import {
  convertDateToStr,
  getHeight,
  getWindowDeviceHeight,
  toDate,
  UseParaPc,
} from "../../CommonFunction";
import RichEditor from "../../RichEditor";
import Window from "../WindowComponent/Window";
import PopUpAttachmentsWindow from "./PopUpAttachmentsWindow";
import TaskOrderDataWindow from "./TaskOrderDataWindow";
import  secureLocalStorage  from  "react-secure-storage";

type IKendoWindow = {
  workType: string;
  setVisible(t: boolean): void;
  reload(str: string): void;
  para: any;
  modal: boolean;
};
const valueCodeQueryStr = `select sub_code, code_name
from comCodeMaster
where group_code ='BA012_GST'`;
const workTypeQueryStr = `select sub_code, code_name FROM comCodeMaster where group_code = 'CR004'`;
const customersQueryStr = `SELECT custcd, custnm FROM ba020t WHERE useyn = 'Y'`;
const usersQueryStr = `SELECT user_id, user_name + (CASE WHEN rtrchk = 'Y' THEN '-퇴' ELSE '' END) as user_name FROM sysUserMaster ORDER BY (CASE WHEN rtrchk = 'Y' THEN 2 ELSE 1 END), user_id`;
const usersColumns = [
  {
    field: "user_id",
    header: "사용자코드",
    width: 120,
  },
  {
    field: "user_name",
    header: "사용자명",
    width: 120,
  },
];
const customersColumns = [
  {
    field: "custcd",
    header: "업체코드",
    width: 90,
  },
  {
    field: "custnm",
    header: "업체명",
    width: 150,
  },
];
const BasicColumns = [
  {
    field: "code_name",
    header: "코드명",
    width: 150,
  },
];
let index = 0;
var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
const KendoWindow = ({
  workType,
  setVisible,
  para,
  reload,
  modal,
}: IKendoWindow) => {
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const userName = loginResult ? loginResult.userName : "";
  const refEditorRef = useRef<TEditorHandle>(null);
  const processApi = useApi();
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  let deviceHeight = document.documentElement.clientHeight;
  const [swiper, setSwiper] = useState<SwiperCore>();
  const [position, setPosition] = useState<IWindowPosition>({
    left: 0,
    top: 0,
    width: deviceWidth,
    height: deviceHeight,
  });
  const setLoading = useSetRecoilState(isLoading);
  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  useLayoutEffect(() => {
    height = getHeight(".k-window-titlebar");
    height2 = getHeight(".BottomContainer");
    height3 = getHeight(".ButtonContainer");
    height4 = getHeight(".ButtonContainer2");
    setMobileHeight(
      getWindowDeviceHeight(false, position.height) - height - height2
    );
    setMobileHeight2(
      getWindowDeviceHeight(false, position.height) - height - height2
    );
  }, []);

  const onClose = () => {
    setVisible(false);
  };

  const onChangePostion = (position: any) => {
    setPosition(position);
  };

  const [attachmentsWindowVisible, setAttachmentsWindowVisible] =
    useState<boolean>(false);
  const onAttWndClick = () => {
    setAttachmentsWindowVisible(true);
  };
  const [typeWindowVisible, setTypeWindowVisible] = useState<boolean>(false);

  const onTypeWndClick = () => {
    setTypeWindowVisible(true);
  };
  const [detailData, setDetailData] = useState({
    custcd: { custcd: "", custnm: "" },
    groupcd: { sub_code: "", code_name: "" },
    value_code3: { sub_code: "", code_name: "" },
    person: { user_id: "", user_name: "" },
    finexpdt: new Date(),
    exphh: 0,
    expmm: 0,
    remark: "",
    attdatnum: "",
    files: "",
    ref_type: "미참조",
    ref_key: "",
    ref_seq: 0,
    guid: uuidv4(),
    docunum: "",
    recdt: new Date(),
    indicator: { user_id: userId, user_name: userName },
    custperson: "",
    is_urgent: "",
  });
  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const [customersState, setCustomersState] = useState<any[]>([]);
  const [WorkTypeItems, setWorkTypeItems] = useState<any[]>([]);
  const [valuecodeItems, setValuecodeItems] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [usersFilter, setUsersFilter] = useState<FilterDescriptor>();
  const [usersFilter2, setUsersFilter2] = useState<FilterDescriptor>();
  const [valuecodeFilter, setValueCodeFilter] = useState<FilterDescriptor>();
  const [custFilter, setCustFilter] = useState<FilterDescriptor>();
  const [workTypeFilter, setWorkTypeFilter] = useState<FilterDescriptor>();
  const handleFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setCustFilter(event.filter);
    }
  };
  const handleFilterChange2 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setWorkTypeFilter(event.filter);
    }
  };
  const handleFilterChange3 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setValueCodeFilter(event.filter);
    }
  };
  const handleFilterChange4 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setUsersFilter(event.filter);
    }
  };
  const handleFilterChange5 = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setUsersFilter2(event.filter);
    }
  };
  const ComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setDetailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const InputChange = (e: any) => {
    const { value, name = "" } = e.target;

    setDetailData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const fetchWorkType = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(workTypeQueryStr));

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
      setWorkTypeItems(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchCustomers = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(customersQueryStr));

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
      setCustomersState(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  useEffect(() => {
    // ComboBox에 사용할 코드 리스트 조회
    if (secureLocalStorage.getItem("accessToken")) {
      fetchCustomers();
      fetchWorkType();
      fetchValueCode();
      fetchUsers();
    }
  }, []);

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

    setDetailData((prev) => ({
      ...prev,
      attdatnum: data.length > 0 ? data[0].attdatnum : prev.attdatnum,
      files:
        data.length > 1
          ? data[0].realnm + " 등 " + String(data.length) + "건"
          : data.length == 0
          ? ""
          : data[0].realnm,
    }));
  };

  const getTypeData = (data: any, type: string) => {
    if (type == "접수") {
      const custnm = customersState.find(
        (items: any) => items.custcd == data.customer_code
      )?.custnm;
      setDetailData((prev) => ({
        ...prev,
        ref_type: type,
        ref_key: data.ref_number,
        ref_seq: 0,
        custcd: { custcd: data.customer_code, custnm: custnm },
      }));
    } else if (type == "프로젝트") {
      const custnm = customersState.find(
        (items: any) => items.custcd == data.custcd
      )?.custnm;
      setDetailData((prev) => ({
        ...prev,
        ref_type: type,
        ref_key: data.devmngnum,
        ref_seq: data.devmngseq,
        custcd: { custcd: data.custcd, custnm: custnm },
      }));
    } else if (type == "회의록") {
      const custnm = customersState.find(
        (items: any) => items.custcd == data.custcd
      )?.custnm;
      setDetailData((prev) => ({
        ...prev,
        ref_type: type,
        ref_key: data.meetingnum,
        ref_seq: data.meetingseq,
        custcd: { custcd: data.custcd, custnm: custnm },
      }));
    } else {
      setDetailData((prev) => ({
        ...prev,
        ref_type: "미참조",
        ref_key: "",
        ref_seq: 0,
        custcd: { custcd: "", custnm: "" },
      }));
    }
  };

  useEffect(() => {
    if (workType == "U" && para != undefined) {
      const custnm = customersState.find(
        (items: any) => items.custcd == para.custcd
      )?.custnm;
      const groupnm = WorkTypeItems.find(
        (items: any) => items.sub_code == para.groupcd
      )?.code_name;
      const value_code3nm = valuecodeItems.find(
        (items: any) => items.sub_code == para.value_code3
      )?.code_name;
      const personnm = usersData.find(
        (items: any) => items.user_id == para.person
      )?.user_name;
      const indicatornm = usersData.find(
        (items: any) => items.user_id == para.indicator
      )?.user_name;
      const guid = uuidv4();
      setDetailData({
        custcd: { custcd: para.custcd, custnm: custnm },
        groupcd: { sub_code: para.groupcd, code_name: groupnm },
        value_code3: { sub_code: para.value_code3, code_name: value_code3nm },
        person: { user_id: para.person, user_name: personnm },
        finexpdt: para.finexpdt != null ? toDate(para.finexpdt) : new Date(),
        exphh: para.exphh,
        expmm: para.expmm,
        remark: para.remark,
        attdatnum: para.attdatnum,
        files: para.files,
        ref_type: para.ref_type,
        ref_key: para.ref_key,
        ref_seq: para.ref_seq,
        guid: para.guid == undefined ? guid : para.guid,
        docunum: para.docunum,
        recdt: para.recdt != null ? toDate(para.recdt) : new Date(),
        indicator: { user_id: para.indicator, user_name: indicatornm },
        custperson: para.custperson,
        is_urgent: para.is_urgent,
      });
      fetchDocument("Task", para.orgdiv + "_" + para.docunum, para);
    }
  }, [customersState, WorkTypeItems, valuecodeItems, usersData]);

  const fetchDocument = async (type: string, ref_key: string, key?: any) => {
    let data: any;
    setLoading(true);

    if (type == "" || ref_key == "") {
      if (refEditorRef.current) {
        refEditorRef.current.setHtml("");
      }
    } else {
      const para = {
        para: `document?type=${type}&id=${ref_key}`,
      };

      try {
        data = await processApi<any>("document", para);
      } catch (error) {
        data = null;
      }
      if (data !== null) {
        if (refEditorRef.current) {
          const document = data.document;
          refEditorRef.current.setHtml(document);
        }
      } else {
        console.log("[에러발생]");
        console.log(data);
        if (refEditorRef.current) {
          refEditorRef.current.setHtml("");
        }
      }
    }
    setLoading(false);
  };

  const onConfirmClick = async () => {
    let data: any;
    let arrays: any = {};
    if (detailData.person != undefined && detailData.person != null) {
      if (detailData.person.user_id == "") {
        alert("필수값을 입력해주세요.");
        return false;
      }
    } else {
      alert("필수값을 입력해주세요.");
      return false;
    }
    if (detailData.indicator != undefined && detailData.indicator != null) {
      if (detailData.indicator.user_id == "") {
        alert("필수값을 입력해주세요.");
        return false;
      }
    } else {
      alert("필수값을 입력해주세요.");
      return false;
    }
    if (
      convertDateToStr(detailData.finexpdt).substring(0, 4) < "1997" ||
      convertDateToStr(detailData.finexpdt).substring(6, 8) > "31" ||
      convertDateToStr(detailData.finexpdt).substring(6, 8) < "01" ||
      convertDateToStr(detailData.finexpdt).substring(6, 8).length != 2
    ) {
      alert("필수값을 입력해주세요.");
      return false;
    }
    if (
      convertDateToStr(detailData.recdt).substring(0, 4) < "1997" ||
      convertDateToStr(detailData.recdt).substring(6, 8) > "31" ||
      convertDateToStr(detailData.recdt).substring(6, 8) < "01" ||
      convertDateToStr(detailData.recdt).substring(6, 8).length != 2
    ) {
      alert("필수값을 입력해주세요.");
      return false;
    }

    if (!navigator.onLine) {
      alert("네트워크 연결상태를 확인해주세요.");
      setLoading(false);
      return false;
    }

    let editorContent: any = "";
    if (refEditorRef.current) {
      editorContent = refEditorRef.current.getContent();
    }
    const promises = [];
    let newAttachmentNumber = "";
    for (const file of fileList) {
      // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
      if (detailData.attdatnum == "" && newAttachmentNumber == "") {
        newAttachmentNumber = await uploadFile(
          file,
          "task",
          detailData.attdatnum
        );
        const promise = newAttachmentNumber;
        promises.push(promise);
        continue;
      }

      const promise = newAttachmentNumber
        ? await uploadFile(
            file,
            "task",
            detailData.attdatnum,
            newAttachmentNumber
          )
        : await uploadFile(file, "task", detailData.attdatnum);
      promises.push(promise);
    }
    const results = await Promise.all(promises);
    // 실패한 파일이 있는지 확인
    if (results.includes(null)) {
      alert("파일 업로드에 실패했습니다.");
    }
    let datas: any;
    let type = "task";
    savenmList.map(async (parameter: any) => {
      try {
        datas = await processApi<any>("file-delete", {
          type,
          attached: parameter,
        });
      } catch (error) {
        datas = null;
      }
    });

    let guids = "";
    const guid = uuidv4();
    if (
      detailData.guid == undefined ||
      detailData.guid == "" ||
      detailData.guid == null
    ) {
      guids = uuidv4();
    } else {
      guids = guid;
    }
    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent)); //html
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorContent, "text/html");
    const textContent = doc.body.textContent || ""; //문자열
    arrays[guids] = convertedEditorContent;
    const paras = {
      fileBytes: arrays,
      procedureName: "pw6_sav_task_order",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "save",
        "@p_row_status": workType,
        "@p_guid": guids,
        "@p_docunum": detailData.docunum,
        "@p_recdt": convertDateToStr(detailData.recdt),
        "@p_person": detailData.person.user_id,
        "@p_indicator": detailData.indicator.user_id,
        "@p_contents": textContent,
        "@p_remark": detailData.remark,
        "@p_groupcd": detailData.groupcd.sub_code,
        "@p_value_code3": detailData.value_code3.sub_code,
        "@p_custcd": detailData.custcd.custcd,
        "@p_finexpdt": convertDateToStr(detailData.finexpdt),
        "@p_exphh": detailData.exphh,
        "@p_expmm": detailData.expmm,
        "@p_custperson": detailData.custperson,
        "@p_attdatnum":
          results[0] == undefined ? detailData.attdatnum : results[0],
        "@p_ref_type": detailData.ref_type,
        "@p_ref_key": detailData.ref_key,
        "@p_ref_seq": detailData.ref_seq,
        "@p_is_urgent": detailData.is_urgent == "" ? "N" : detailData.is_urgent,
        "@p_id": userId,
        "@p_pc": pc,
      },
    };

    try {
      data = await processApi<any>("taskorder-save", paras);
    } catch (error) {
      data = null;
    }

    setFileList([]);
    setSavenmList([]);

    if (data != null) {
      reload(data.returnString);
      onClose();
    } else {
      console.log("[오류 발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const uploadFile = async (
    files: File,
    type: string,
    attdatnum?: string,
    newAttachmentNumber?: string
  ) => {
    let data: any;
    const pathname = location.pathname.replace("/", "");

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

  return (
    <Window
      titles={workType == "N" ? "업무지시 생성" : "업무지시 수정"}
      positions={position}
      Close={onClose}
      modals={modal}
      onChangePostion={onChangePostion}
    >
      <Swiper
        onSwiper={(swiper) => {
          setSwiper(swiper);
        }}
        onActiveIndexChange={(swiper) => {
          index = swiper.activeIndex;
        }}
      >
        <SwiperSlide key={0}>
          <GridContainer>
            <FormBoxWrap border={true} style={{ height: mobileheight }}>
              <ButtonContainer>
                {" "}
                <Button
                  themeColor={"primary"}
                  fillMode={"flat"}
                  icon={"chevron-right"}
                  onClick={() => {
                    if (swiper) {
                      swiper.slideTo(1);
                    }
                  }}
                ></Button>
              </ButtonContainer>
              <FormBox>
                <tbody>
                  <tr>
                    <th>업체</th>
                    <td>
                      {customersState && (
                        <CustomMultiColumnComboBox
                          name="custcd"
                          data={
                            custFilter
                              ? filterBy(customersState, custFilter)
                              : customersState
                          }
                          value={detailData.custcd}
                          columns={customersColumns}
                          textField={"custnm"}
                          onChange={ComboBoxChange}
                          filterable={true}
                          onFilterChange={handleFilterChange}
                        />
                      )}
                    </td>
                    <th>업무분류</th>
                    <td>
                      {WorkTypeItems && (
                        <CustomMultiColumnComboBox
                          name="groupcd"
                          data={
                            workTypeFilter
                              ? filterBy(WorkTypeItems, workTypeFilter)
                              : WorkTypeItems
                          }
                          value={detailData.groupcd}
                          columns={BasicColumns}
                          textField={"code_name"}
                          onChange={ComboBoxChange}
                          filterable={true}
                          onFilterChange={handleFilterChange2}
                        />
                      )}
                    </td>
                    <th>Value 구분</th>
                    <td>
                      {valuecodeItems && (
                        <CustomMultiColumnComboBox
                          name="value_code3"
                          data={
                            valuecodeFilter
                              ? filterBy(valuecodeItems, valuecodeFilter)
                              : valuecodeItems
                          }
                          value={detailData.value_code3}
                          columns={BasicColumns}
                          textField={"code_name"}
                          onChange={ComboBoxChange}
                          filterable={true}
                          onFilterChange={handleFilterChange3}
                        />
                      )}
                    </td>
                    <th>처리담당자</th>
                    <td>
                      {usersData && (
                        <CustomMultiColumnComboBox
                          name="person"
                          data={
                            usersFilter
                              ? filterBy(usersData, usersFilter)
                              : usersData
                          }
                          value={detailData.person}
                          columns={usersColumns}
                          textField={"user_name"}
                          onChange={ComboBoxChange}
                          filterable={true}
                          className="required"
                          onFilterChange={handleFilterChange4}
                        />
                      )}
                    </td>
                    <th>완료예정일</th>
                    <td>
                      <DatePicker
                        name="finexpdt"
                        value={detailData.finexpdt}
                        onChange={InputChange}
                        format="yyyy-MM-dd"
                        placeholder=""
                        className="required"
                      />
                    </td>
                    <th>예상(H)</th>
                    <td>
                      <Input
                        name="exphh"
                        type="number"
                        value={detailData.exphh}
                        onChange={InputChange}
                        style={{ textAlign: "end" }}
                      />
                    </td>
                    <th>예상(M)</th>
                    <td>
                      <Input
                        name="expmm"
                        type="number"
                        value={detailData.expmm}
                        onChange={InputChange}
                        style={{ textAlign: "end" }}
                      />
                    </td>
                    <th>비고</th>
                    <td>
                      <Input
                        name="remark"
                        type="text"
                        value={detailData.remark}
                        onChange={InputChange}
                      />
                    </td>
                    <th>첨부파일</th>
                    <td>
                      <Input
                        name="files"
                        type="text"
                        value={detailData.files}
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
                    <th>지시일</th>
                    <td>
                      <DatePicker
                        name="recdt"
                        value={detailData.recdt}
                        onChange={InputChange}
                        format="yyyy-MM-dd"
                        placeholder=""
                        className="required"
                      />
                    </td>
                    <th>지시자</th>
                    <td>
                      {usersData && (
                        <CustomMultiColumnComboBox
                          name="indicator"
                          data={
                            usersFilter2
                              ? filterBy(usersData, usersFilter2)
                              : usersData
                          }
                          value={detailData.indicator}
                          columns={usersColumns}
                          textField={"user_name"}
                          onChange={ComboBoxChange}
                          filterable={true}
                          className="required"
                          onFilterChange={handleFilterChange5}
                        />
                      )}
                    </td>
                    <th>참조</th>
                    <td>
                      <div>
                        {detailData.ref_type == "접수" ? (
                          <span className="k-icon k-i-file k-icon-lg"></span>
                        ) : detailData.ref_type == "프로젝트" ? (
                          <span className="k-icon k-i-folder k-icon-lg"></span>
                        ) : detailData.ref_type == "회의록" ? (
                          <span className="k-icon k-i-comment k-icon-lg"></span>
                        ) : (
                          ""
                        )}
                        <ButtonInGridInput>
                          <Button
                            onClick={onTypeWndClick}
                            icon="more-horizontal"
                            fillMode="flat"
                          />
                        </ButtonInGridInput>
                      </div>
                    </td>
                    <th>참조번호1</th>
                    <td>
                      <Input
                        name="ref_key"
                        type="text"
                        value={detailData.ref_key}
                        className="readonly"
                      />
                    </td>
                    <th>참조번호2</th>
                    <td>
                      <Input
                        name="ref_seq"
                        type="text"
                        value={detailData.ref_seq}
                        className="readonly"
                        style={{ textAlign: "end" }}
                      />
                    </td>
                  </tr>
                </tbody>
              </FormBox>
            </FormBoxWrap>
          </GridContainer>
        </SwiperSlide>
        <SwiperSlide key={1}>
          <GridContainer style={{ height: mobileheight2 }}>
            <ButtonContainer style={{ justifyContent: "space-between" }}>
              <Button
                themeColor={"primary"}
                fillMode={"flat"}
                icon={"chevron-left"}
                onClick={() => {
                  if (swiper) {
                    swiper.slideTo(0);
                  }
                }}
              ></Button>
            </ButtonContainer>
            <RichEditor id="refEditor" ref={refEditorRef} />
          </GridContainer>
        </SwiperSlide>
      </Swiper>
      <BottomContainer className="BottomContainer">
        <ButtonContainer>
          <Button themeColor={"primary"} onClick={onConfirmClick}>
            확인
          </Button>
          <Button themeColor={"primary"} fillMode={"outline"} onClick={onClose}>
            닫기
          </Button>
        </ButtonContainer>
      </BottomContainer>
      {typeWindowVisible && (
        <TaskOrderDataWindow
          setVisible={setTypeWindowVisible}
          setData={getTypeData}
        />
      )}
      {attachmentsWindowVisible && (
        <PopUpAttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={detailData.attdatnum}
          permission={{ upload: true, download: true, delete: true }}
          type={"task"}
          fileLists={fileList}
          savenmLists={savenmList}
        />
      )}
    </Window>
  );
};

export default KendoWindow;
