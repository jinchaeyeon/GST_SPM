import { FilterDescriptor, filterBy } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { ComboBoxFilterChangeEvent } from "@progress/kendo-react-dropdowns";
import { Input } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { ICustData, IWindowPosition } from "../../../hooks/interfaces";
import { isLoading, loginResultState } from "../../../store/atoms";
import {
  custTypeColumns,
  dataTypeColumns,
  dataTypeColumns2,
  userColumns,
} from "../../../store/columns/common-columns";
import { TEditorHandle } from "../../../store/types";
import CustomMultiColumnComboBox from "../../ComboBoxes/CustomMultiColumnComboBox";
import {
  UseParaPc,
  convertDateToStr,
  getHeight,
  getWindowDeviceHeight,
  toDate,
} from "../../CommonFunction";
import RichEditor from "../../RichEditor";
import CustomersWindow from "./CustomersWindow";
import PopUpAttachmentsWindow from "./PopUpAttachmentsWindow";
import Window from "../WindowComponent/Window";
import SwiperCore from "swiper";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";

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

const usersQueryStr = `SELECT user_id, user_name + (CASE WHEN rtrchk = 'Y' THEN '-퇴' ELSE '' END) as user_name FROM sysUserMaster ORDER BY (CASE WHEN rtrchk = 'Y' THEN 2 ELSE 1 END), user_id`;

var index = 0;

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;
var height6 = 0;

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
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;
  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 1200) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 900) / 2,
    width: isMobile == true ? deviceWidth : 1200,
    height: isMobile == true ? deviceHeight : 900,
  });

  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [swiper, setSwiper] = useState<SwiperCore>();

  useLayoutEffect(() => {
    height = getHeight(".ButtonContainer");
    height2 = getHeight(".ButtonContainer2");
    height3 = getHeight(".k-window-titlebar");
    height4 = getHeight(".FormBox");
    height5 = getHeight(".FormBoxWrap2");
    height6 = getHeight(".BottomContainer");
    setMobileHeight(
      getWindowDeviceHeight(false, deviceHeight) -
        height -
        height3 -
        height6 -
        15
    );
    setMobileHeight2(
      getWindowDeviceHeight(false, deviceHeight) - height3 - height6
    );
    setWebHeight(
      getWindowDeviceHeight(false, position.height) -
        height -
        height3 -
        height4 -
        height6 -
        35
    );
  }, [position.height, webheight]);

  const onChangePostion = (position: any) => {
    setPosition(position);
    setWebHeight(
      getWindowDeviceHeight(false, position.height) -
        height -
        height2 -
        height3 -
        height4 -
        height5 -
        height6
    );
  };

  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const [fileList2, setFileList2] = useState<FileList | any[]>([]);
  const [savenmList2, setSavenmList2] = useState<string[]>([]);
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");

  const onClose = () => {
    setFileList([]);
    setSavenmList([]);
    setFileList2([]);
    setSavenmList2([]);
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
        custcd: value == null ? "" : value.custcd,
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
      attach_number: data.length > 0 ? data[0].attdatnum : prev.attach_number,
      attach_files:
        data.length > 1
          ? data[0].realnm + " 등 " + String(data.length) + "건"
          : data.length == 0
          ? ""
          : data[0].realnm,
    }));
  };

  const getAttachmentsData2 = (
    data: any,
    fileList?: FileList | any[],
    savenmList?: string[]
  ) => {
    if (fileList) {
      setFileList2(fileList);
    } else {
      setFileList2([]);
    }

    if (savenmList) {
      setSavenmList2(savenmList);
    } else {
      setSavenmList2([]);
    }

    setInformation((prev) => ({
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
      let newAttachmentNumber = "";
      let newAttachmentNumber2 = "";

      const promises = [];
      const promises2 = [];

      for (const file of fileList) {
        // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
        if (Information.attach_number == "" && newAttachmentNumber == "") {
          newAttachmentNumber = await uploadFile(
            file,
            "receipt",
            Information.attach_number
          );
          const promise = newAttachmentNumber;
          promises.push(promise);
          continue;
        }

        const promise = newAttachmentNumber
          ? await uploadFile(
              file,
              "receipt",
              Information.attach_number,
              newAttachmentNumber
            )
          : await uploadFile(file, "receipt", Information.attach_number);
        promises.push(promise);
      }

      const results = await Promise.all(promises);

      // 실패한 파일이 있는지 확인
      if (results.includes(null)) {
        alert("파일 업로드에 실패했습니다.");
      } else {
        setInformation((prev) => ({
          ...prev,
          attach_number: results[0],
        }));
      }

      let data2: any;
      var type = "receipt";
      savenmList.map(async (parameter: any) => {
        try {
          data2 = await processApi<any>("file-delete", {
            type,
            attached: parameter,
          });
        } catch (error) {
          data2 = null;
        }
      });

      for (const file of fileList2) {
        // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
        if (Information.attdatnum == "" && newAttachmentNumber2 == "") {
          newAttachmentNumber2 = await uploadFile(
            file,
            "question",
            Information.attdatnum
          );
          const promise = newAttachmentNumber2;
          promises2.push(promise);
          continue;
        }

        const promise = newAttachmentNumber2
          ? await uploadFile(
              file,
              "question",
              Information.attdatnum,
              newAttachmentNumber2
            )
          : await uploadFile(file, "question", Information.attdatnum);
        promises2.push(promise);
      }

      const results2 = await Promise.all(promises2);

      // 실패한 파일이 있는지 확인
      if (results2.includes(null)) {
        alert("파일 업로드에 실패했습니다.");
      } else {
        setInformation((prev) => ({
          ...prev,
          attdatnum: results2[0],
        }));
      }

      let data3: any;
      var type = "question";
      savenmList2.map(async (parameter: any) => {
        try {
          data3 = await processApi<any>("file-delete", {
            type,
            attached: parameter,
          });
        } catch (error) {
          data3 = null;
        }
      });

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
          "@p_attach_number_s":
            results[0] == undefined ? Information.attach_number : results[0],
          "@p_ref_number_s": para == "" ? "U" : para.ref_number,

          "@p_contents": textContent,
          "@p_attdatnum":
            results2[0] == undefined ? Information.attdatnum : results2[0],

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
        setFileList([]);
        setSavenmList([]);
        setFileList2([]);
        setSavenmList2([]);
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
      titles={"접수 내용 작성"}
      positions={position}
      Close={onClose}
      modals={modal}
      onChangePostion={onChangePostion}
    >
      {isMobile ? (
        <Swiper
          onSwiper={(swiper) => {
            setSwiper(swiper);
          }}
          onActiveIndexChange={(swiper) => {
            index = swiper.activeIndex;
          }}
        >
          <SwiperSlide key={0}>
            <GridTitleContainer className="ButtonContainer">
              <GridTitle>
                접수 기본정보
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
              </GridTitle>
            </GridTitleContainer>
            <FormBoxWrap
              border={true}
              style={{ height: mobileheight, overflow: "auto" }}
            >
              <FormBox className="FormBox">
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
                      <CustomMultiColumnComboBox
                        name="custnm"
                        data={
                          filter ? filterBy(custListData, filter) : custListData
                        }
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
                      <CustomMultiColumnComboBox
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
                      <CustomMultiColumnComboBox
                        name="reception_person"
                        data={
                          filter3 ? filterBy(usersData, filter3) : usersData
                        }
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
                      <CustomMultiColumnComboBox
                        name="value_code3"
                        data={
                          filter4
                            ? filterBy(valuecodeItems, filter4)
                            : valuecodeItems
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
          </SwiperSlide>
          <SwiperSlide key={1}>
            <GridContainer height={`${mobileheight2}px`}>
              <GridTitleContainer className="ButtonContainer2">
                <GridTitle>
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
                  내용
                </GridTitle>
              </GridTitleContainer>
              <RichEditor id="refEditor" ref={refEditorRef} />
              <FormBoxWrap border={true} className="FormBoxWrap2">
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
          </SwiperSlide>
        </Swiper>
      ) : (
        <>
          <GridTitleContainer className="ButtonContainer">
            <GridTitle>접수 기본정보</GridTitle>
          </GridTitleContainer>
          <FormBoxWrap border={true}>
            <FormBox className="FormBox">
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
                    <CustomMultiColumnComboBox
                      name="custnm"
                      data={
                        filter ? filterBy(custListData, filter) : custListData
                      }
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
                    <CustomMultiColumnComboBox
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
                    <CustomMultiColumnComboBox
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
                    <CustomMultiColumnComboBox
                      name="value_code3"
                      data={
                        filter4
                          ? filterBy(valuecodeItems, filter4)
                          : valuecodeItems
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
          <GridContainer height={`${webheight}px`}>
            <GridTitleContainer className="ButtonContainer2">
              <GridTitle>내용</GridTitle>
            </GridTitleContainer>
            <RichEditor id="refEditor" ref={refEditorRef} />
            <FormBoxWrap border={true} className="FormBoxWrap2">
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
        </>
      )}
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
      {attachmentsWindowVisible && (
        <PopUpAttachmentsWindow
          setVisible={setAttachmentsWindowVisible}
          setData={getAttachmentsData}
          para={Information.attach_number}
          permission={{ upload: true, download: true, delete: true }}
          type={"receipt"}
          fileLists={fileList}
          savenmLists={savenmList}
        />
      )}
      {attachmentsWindowVisible2 && (
        <PopUpAttachmentsWindow
          setVisible={setAttachmentsWindowVisible2}
          setData={getAttachmentsData2}
          para={Information.attdatnum}
          permission={{ upload: true, download: true, delete: true }}
          type={"question"}
          fileLists={fileList2}
          savenmLists={savenmList2}
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
