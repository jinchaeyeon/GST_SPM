import { FilterDescriptor, filterBy } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  ComboBoxFilterChangeEvent
} from "@progress/kendo-react-dropdowns";
import { Input, NumericTextBox, TextArea } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import * as React from "react";
import { useEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  BottomContainer,
  ButtonContainer,
  FormBox,
  FormBoxWrap,
} from "../../../CommonStyled";
import { useApi } from "../../../hooks/api";
import { IWindowPosition } from "../../../hooks/interfaces";
import { isLoading, loginResultState } from "../../../store/atoms";
import {
  projectItemsColumns,
  userColumns,
} from "../../../store/columns/common-columns";
import { Iparameters } from "../../../store/types";
import CustomMultiColumnComboBox from "../../ComboBoxes/CustomMultiColumnComboBox";
import {
  UseParaPc,
  convertDateToStrWithTime2,
  getCodeFromValue,
  projectItemQueryStr,
  usersQueryStr,
} from "../../CommonFunction";

type IKendoWindow = {
  setVisible(t: boolean): void;
  reload(): void;
  data: TDetailData;
};

type TDetailData = {
  workType: "N" | "U";
  guid: string;
  project_value: {
    project: string;
    devmngnum: string;
  } | null;
  start: Date;
  end: Date;
  title: string;
  progress: number;
  remark: string;
  pjt_person: null | { user_id: string; user_name: string };
  project: null | { project_itemcd: string; project_itemnm: string };
  appointment_label: string;
};

const defaultDetailData = {
  workType: "N",
  guid: "",
  project_value: null,
  start: new Date(),
  end: new Date(),
  title: "",
  progress: 0,
  remark: "",
  pjt_person: null,
  project: null,
  appointment_label: "0",
};

const KendoWindow = ({ setVisible, data, reload }: IKendoWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 600,
    height: 350,
  });
  const processApi = useApi();
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";

  const [detailData, setDetailData] = useState<TDetailData>({
    ...defaultDetailData,
    ...data,
  });

  const setLoading = useSetRecoilState(isLoading);

  // Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const dataInputChange = (e: any) => {
    let { value, name } = e.target;

    if (name === "progress") {
      if (value < 0) {
        value = 0;
      } else if (value > 100) {
        value = 100;
      }
    }
    setDetailData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ComboBox Change 함수 => 사용자가 선택한 콤보박스 값을 조회 파라미터로 세팅
  const dataComboBoxChange = (e: any) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setDetailData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const onConfirmClick = (props: any) => {
    saveData();
  };

  // 데이터 저장
  const saveData = async () => {
    let data: any;

    const {
      workType,
      project_value,
      guid,
      start,
      end,
      title,
      progress,
      remark,
      pjt_person,
      project,
      appointment_label,
    } = detailData;

    if (!project_value) {
      alert("프로젝트 명은 필수 입력 항목입니다.");
      return false;
    }
    if (!title) {
      alert("제목은 필수 입력 항목입니다.");
      return false;
    }
    if (!start) {
      alert("시작일자는 필수 입력 항목입니다.");
      return false;
    }
    if (!end) {
      alert("종료일자는 필수 입력 항목입니다.");
      return false;
    }
    if (!project) {
      alert("일정항목은 필수 입력 항목입니다.");
      return false;
    }

    setLoading(true);
    const devmngnum = getCodeFromValue(project_value, "devmngnum");
    const user_id = getCodeFromValue(pjt_person, "user_id");

    const parameters: Iparameters = {
      procedureName: "pw6_sav_project_schedule",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "SAVE",
        "@p_devmngnum": devmngnum,
        "@p_rowstatus": workType,
        "@p_guid": guid,
        "@p_project_itemcd": project.project_itemcd,
        "@p_title": title,
        "@p_strtime": convertDateToStrWithTime2(start),
        "@p_endtime": convertDateToStrWithTime2(end),
        "@p_rate": progress,
        "@p_person": user_id,
        "@p_remark": remark,
        "@p_appointment_label": appointment_label,
        "@p_dep_rowstatus": "",
        "@p_parentguid": "",
        "@p_childguid": "",
        "@p_project_itemnm": "",
        "@p_id": userId,
        "@p_pc": pc,
        "@p_form_id": "SPM_WEB",
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      // fetchProjectDetail(devmngnum);
      reload();
      onClose();
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };
  useEffect(() => {
    console.log("data");
    console.log(data);
  }, []);

  const [usersData, setUsersData] = useState([]);
  const [projectItems, setProjectItems] = useState([]);
  const [userFilter, setUserFilter] = React.useState<FilterDescriptor>();
  const [prjItemsFilter, setPrjItemsFilter] =
    React.useState<FilterDescriptor>();
  const handleUserFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setUserFilter(event.filter);
    }
  };
  const handlePrjItemsFilterChange = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      setPrjItemsFilter(event.filter);
    }
  };

  const fetchProjectItems = async () => {
    let data: any;

    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(projectItemQueryStr));

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
      setProjectItems(rows);
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

  useEffect(() => {
    fetchProjectItems();
    fetchUsers();
  }, []);

  return (
    <Window
      title={"일정 입력"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={true}
    >
      <FormBoxWrap>
        <FormBox>
          <tbody>
            <tr>
              <th>제목</th>
              <td>
                <Input
                  name="title"
                  type="text"
                  value={detailData.title}
                  onChange={dataInputChange}
                  className="required"
                />
              </td>
              <th>시작일자</th>
              <td>
                <DatePicker
                  name="start"
                  value={detailData.start}
                  format="yyyy-MM-dd"
                  onChange={dataInputChange}
                  placeholder=""
                  className="required"
                />
              </td>
            </tr>
            <tr>
              <th>일정 항목</th>
              <td>
                <CustomMultiColumnComboBox
                  name="project"
                  data={
                    prjItemsFilter
                      ? filterBy(projectItems, prjItemsFilter)
                      : projectItems
                  }
                  value={detailData.project}
                  columns={projectItemsColumns}
                  textField={"project_itemnm"}
                  filterable={true}
                  onFilterChange={handlePrjItemsFilterChange}
                  onChange={dataComboBoxChange}
                  className="required"
                />
              </td>
              <th>종료일자</th>
              <td>
                <DatePicker
                  name="end"
                  value={detailData.end}
                  format="yyyy-MM-dd"
                  onChange={dataInputChange}
                  placeholder=""
                  className="required"
                />
              </td>
            </tr>
            <tr>
              <th>담당자</th>
              <td>
                <CustomMultiColumnComboBox
                  name="pjt_person"
                  data={
                    userFilter ? filterBy(usersData, userFilter) : usersData
                  }
                  value={detailData.pjt_person}
                  columns={userColumns}
                  textField={"user_name"}
                  filterable={true}
                  onFilterChange={handleUserFilterChange}
                  onChange={dataComboBoxChange}
                />
              </td>
              <th>진행률</th>
              <td>
                <NumericTextBox
                  name="progress"
                  value={detailData.progress}
                  onChange={dataInputChange}
                  min={0} // spiner 제한
                  max={100}
                />
              </td>
            </tr>
            <tr>
              <th>비고</th>
              <td colSpan={3}>
                <TextArea
                  name="remark"
                  value={detailData.remark}
                  onChange={dataInputChange}
                ></TextArea>
              </td>
            </tr>
          </tbody>
        </FormBox>
      </FormBoxWrap>
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
    </Window>
  );
};

export default KendoWindow;
