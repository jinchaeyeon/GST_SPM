import { useEffect, useLayoutEffect, useState } from "react";
import {
  GridDataStateChangeEvent,
  getSelectedState,
  GridSelectionChangeEvent,
  Grid,
  GridColumn,
} from "@progress/kendo-react-grid";
import { DataResult, process, State, getter } from "@progress/kendo-data-query";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
} from "../../../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../../hooks/interfaces";
import {
  getHeight,
  getWindowDeviceHeight,
  UseParaPc,
} from "../../CommonFunction";
import {
  SELECTED_FIELD,
} from "../../CommonString";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  isLoading,
  loginResultState,
} from "../../../store/atoms";
import { Iparameters } from "../../../store/types";
import DateCell from "../../Cells/DateCell";
import { bytesToBase64 } from "byte-base64";
import CheckBoxReadOnlyCell from "../../Cells/CheckBoxReadOnlyCell";
import Window from "../WindowComponent/Window";

type IKendoWindow = {
  setVisible(t: boolean): void;
  para: ITypes;
  modal: boolean;
};

type ITypes = {
  answer_attdatnum: string;
  answer_document_id: string;
  answer_files: string;
  attdatnum: string;
  be_finished_date: string;
  check_date: null;
  completion_date: string;
  contents: string;
  customer_code: string;
  customer_name: string;
  document_id: string;
  exists_task: string;
  files: string;
  find_key: string;
  finished_count: number;
  insert_pc: string;
  insert_time: string;
  insert_user_id: string;
  insert_userid: string;
  is_checked: string;
  is_finish: string;
  is_lock: string;
  is_public: string;
  module_type: string;
  password: string;
  reception_attach_exists: string;
  reception_attach_number: string;
  reception_date: string;
  reception_person: string;
  reception_time: number;
  reception_type: string;
  ref_number: string;
  request_date: string;
  salt: string;
  status: string;
  title: string;
  total_count: number;
  user_id: string;
  user_name: string;
  user_tel: string;
  value_code3: string;

  //프로젝트 추가
  devmngnum: string;
  devmngseq: number;

  //회의록 추가
  meetingnum: string;
  meetingseq: number;
};

const workTypeQueryStr = `select sub_code, code_name FROM comCodeMaster where group_code = 'CR004'`;

const usersQueryStr = `SELECT user_id, user_name + (CASE WHEN rtrchk = 'Y' THEN '-퇴' ELSE '' END) as user_name FROM sysUserMaster ORDER BY (CASE WHEN rtrchk = 'Y' THEN 2 ELSE 1 END), user_id`;

const DATA_ITEM_KEY = "num";

var height = 0;
var height2 = 0;

const KendoWindow = ({ setVisible, para, modal }: IKendoWindow) => {
  let deviceWidth = document.documentElement.clientWidth;
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;
  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 740) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 500) / 2,
    width: isMobile == true ? deviceWidth : 740,
    height: isMobile == true ? deviceHeight : 500,
  });
  const idGetter = getter(DATA_ITEM_KEY);
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const setLoading = useSetRecoilState(isLoading);

  const [mobileheight, setMobileHeight] = useState(0);
  const [webheight, setWebHeight] = useState(0);

  useLayoutEffect(() => {
    height = getHeight(".k-window-titlebar"); //공통 해더
    height2 = getHeight(".BottomContainer"); //하단 버튼부분
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
  const processApi = useApi();

  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });

  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [usersData, setUsersData] = useState<any[]>([]);
  const [WorkTypeItems, setWorkTypeItems] = useState<any[]>([]);

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

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
    //그리드 데이터 조회
    const fetchMainGrid = async () => {
      let data: any;
      setLoading(true);

      //조회조건 파라미터
      const parameters: Iparameters = {
        procedureName: "pw6_sel_task_order",
        pageNumber: 1,
        pageSize: 10000,
        parameters: {
          "@p_work_type": "task_order",
          "@p_date_type": "",
          "@p_from_date": "",
          "@p_to_date": "",
          "@p_customer_code": "",
          "@p_customer_name": "",
          "@p_user_name": "",
          "@p_contents": "",
          "@p_reception_type": "",
          "@p_value_code3": "",
          "@p_reception_person": "",
          "@p_worker": "",
          "@p_receptionist": "",
          "@p_status": "",
          "@p_check": "",
          "@p_pgmnm": "",
          "@p_ref_type": "접수",
          "@p_ref_key": para.ref_number,
          "@p_ref_seq": 0,
          "@p_find_row_value": "",
        },
      };

      try {
        data = await processApi<any>("procedure", parameters);
      } catch (error) {
        data = null;
      }
      if (data.isSuccess === true) {
        const totalRowCnt = data.tables[0].TotalRowCount;
        const rows = data.tables[0].Rows.map((item: { guid: undefined }) => ({
          ...item,
        }));

        setMainDataResult((prev) => {
          return {
            data: rows,
            total: totalRowCnt == -1 ? 0 : totalRowCnt,
          };
        });

        if (totalRowCnt > 0) {
          setSelectedState({ [rows[0][DATA_ITEM_KEY]]: true });
        }
      } else {
        console.log("[오류 발생]");
        console.log(data);
      }
      setLoading(false);
    };

  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setSelectedState(newSelectedState);
  };

  useEffect(() => {
    fetchUsers();
    fetchWorkType();
    if (para != undefined) {
      fetchMainGrid();
    }
  }, [para]);

  return (
    <Window
      titles={"지시 내역"}
      positions={position}
      Close={onClose}
      onChangePostion={onChangePostion}
      modals={modal}
    >
      <GridContainer height={`${isMobile? mobileheight : webheight}px`}>
        <Grid
          style={{ height: `100%` }}
          data={process(
            mainDataResult.data.map((row) => ({
              ...row,
              indicator: usersData.find(
                (items: any) => items.user_id == row.indicator
              )?.user_name,
              person: usersData.find(
                (items: any) => items.user_id == row.person
              )?.user_name,
              groupcd: WorkTypeItems.find(
                (items: any) => items.sub_code == row.groupcd
              )?.code_name,
              [SELECTED_FIELD]: selectedState[idGetter(row)],
            })),
            mainDataState
          )}
          {...mainDataState}
          onDataStateChange={onMainDataStateChange}
          //선택 기능
          dataItemKey={DATA_ITEM_KEY}
          selectedField={SELECTED_FIELD}
          selectable={{
            enabled: true,
            mode: "single",
          }}
          onSelectionChange={onSelectionChange}
          //스크롤 조회 기능
          fixedScroll={true}
          total={mainDataResult.total}
          //정렬기능
          sortable={true}
          onSortChange={onMainSortChange}
          //컬럼순서조정
          reorderable={true}
          //컬럼너비조정
          resizable={true}
        >
          <GridColumn
            field="recdt"
            title="지시일"
            width={120}
            cell={DateCell}
          />
          <GridColumn
            field="indicator"
            title="지시자"
            width={120}
          />
          <GridColumn
            field="person"
            title="처리담당자"
            width={120}
          />
          <GridColumn
            field="finexpdt"
            title="완료예정일"
            cell={DateCell}
            width={120}
          />
          <GridColumn
            field="groupcd"
            title=" 업무분류"
            width={120}
          />
          <GridColumn
            field="finyn"
            title="완료"
            width={80}
            cell={CheckBoxReadOnlyCell}
          />
        </Grid>
      </GridContainer>
      <BottomContainer className="BottomContainer">
        <ButtonContainer>
          <Button themeColor={"primary"} fillMode={"outline"} onClick={onClose}>
            닫기
          </Button>
        </ButtonContainer>
      </BottomContainer>
    </Window>
  );
};

export default KendoWindow;
