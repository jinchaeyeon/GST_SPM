import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import {
  getSelectedState,
  Grid,
  GridColumn,
  GridDataStateChangeEvent,
  GridEvent,
  GridSelectionChangeEvent,
} from "@progress/kendo-react-grid";
import { Input, RadioGroup } from "@progress/kendo-react-inputs";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ButtonContainer,
  FilterBox,
  FilterBoxWrap,
  FormBox,
  FormBoxWrap,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
  QnaPwBox,
  Title,
  TitleContainer,
} from "../CommonStyled";
import {
  chkScrollHandler,
  convertDateToStr,
  dateformat2,
  handleKeyPressSearch,
  toDate,
} from "../components/CommonFunction";
import { PAGE_SIZE, SELECTED_FIELD } from "../components/CommonString";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isLoading, loginResultState } from "../store/atoms";
import { useApi } from "../hooks/api";
import { TEditorHandle } from "../store/types";
import RichEditor from "../components/RichEditor";
import {
  MultiSelect,
  MultiSelectChangeEvent,
} from "@progress/kendo-react-dropdowns";
import CenterCell from "../components/Cells/CenterCell";
import QnaStateCell from "../components/Cells/QnaStateCell";
import { bytesToBase64 } from "byte-base64";
import { Icon } from "@progress/kendo-react-common";
type TItem = {
  sub_code: string;
  code_name: string;
};

//조회조건 초기값
type TFilters = {
  fromDate: Date;
  toDate: Date;
  userName: string;
  contents: string;
  isPublic: string;
  status: { sub_code: string; code_name: string }[];
  findRowValue: string;
  pgNum: number;
  pgSize: number;
  isFetch: boolean;
  scrollDirrection: string;
  pgGap: number;
};

const DATA_ITEM_KEY = "document_id";
const isPublicListData = [
  { value: "Y", label: "공개" },
  { value: "N", label: "비공개" },
  { value: "All", label: "전체" },
];

const columns = [
  { field: "code_name", header: "이름", width: "200px" },
  { field: "sub_code", header: "코드", width: "200px" },
];
const statusListData: TItem[] = [
  { sub_code: "1", code_name: "대기" },
  { sub_code: "2", code_name: "진행중" },
  { sub_code: "4", code_name: "보류" },
  { sub_code: "8", code_name: "완료" },
];
const detailDataStatusListData: TItem[] = [
  { sub_code: "N", code_name: "대기" },
  { sub_code: "R", code_name: "진행중" },
  { sub_code: "4", code_name: "보류" },
  { sub_code: "Y", code_name: "완료" },
];

const defaultDetailData = {
  work_type: "",
  document_id: "",
  title: "",
  password: "",
  user_name: "",
  user_tel: "",
  is_public: "Y",
  is_lock: false,
  request_date: new Date(),
  be_finished_date: "",
  reception_date: "",
  status: { code_name: "", sub_code: "" },
  attdatnum: "",
};

const App = () => {
  const [loginResult] = useRecoilState(loginResultState);
  const setLoading = useSetRecoilState(isLoading);
  const idGetter = getter(DATA_ITEM_KEY);
  const processApi = useApi();
  const qEditorRef = useRef<TEditorHandle>(null);
  const aEditorRef = useRef<TEditorHandle>(null);
  const [isDataLocked, setIsDataLocked] = useState(false);

  const pwInputRef: any = useRef(null);

  const isAdmin = loginResult.role === "ADMIN";

  //조회조건 Input Change 함수 => 사용자가 Input에 입력한 값을 조회 파라미터로 세팅
  const filterInputChange = (e: any) => {
    const { value, name } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const detailDataInputChange = (e: any) => {
    const { value, name } = e.target;

    setDetailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filterMultiSelectChange = (event: MultiSelectChangeEvent) => {
    const values = event.value;

    setFilters((prev) => ({
      ...prev,
      status: values,
    }));
  };

  const [filters, setFilters] = useState<TFilters>({
    fromDate: new Date(),
    toDate: new Date(),
    userName: "",
    contents: "",
    isPublic: "All",
    status: [],
    findRowValue: "",
    pgNum: 1,
    pgSize: PAGE_SIZE,
    isFetch: true,
    scrollDirrection: "down",
    pgGap: 0,
  });

  const search = () => {
    setSelectedState({});
    setMainDataResult(process([], mainDataState));
    setFilters((prev) => ({ ...prev, pgNum: 1, isFetch: true }));
  };

  const [mainPgNum, setMainPgNum] = useState(1);
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [detailData, setDetailData] = useState(defaultDetailData);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const onMainDataStateChange = (event: GridDataStateChangeEvent) => {
    setMainDataState(event.dataState);
  };

  //메인 그리드 선택 이벤트 => 디테일 그리드 조회
  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    // const selectedIdx = event.startRowIndex;
    // const selectedRowData = event.dataItems[selectedIdx];
    // setMainDataId(selectedRowData[DATA_ITEM_KEY]);
  };

  const onMainScrollHandler = (event: GridEvent) => {
    if (chkScrollHandler(event, mainPgNum, PAGE_SIZE))
      setMainPgNum((prev) => prev + 1);
  };
  const onMainSortChange = (e: any) => {
    setMainDataState((prev) => ({ ...prev, sort: e.sort }));
  };

  //그리드 데이터 조회
  const fetchGrid = useCallback(async () => {
    let data: any;
    setLoading(true);

    const status =
      filters.status.length === 0
        ? 0 // 미선택시 => 0 전체
        : filters.status.length === 1
        ? filters.status[0].sub_code // 1개만 선택시 => 선택된 값 (ex. 1 대기)
        : filters.status.reduce(
            (total, current) => total + Number(current.sub_code),
            0
          ); //  2개 이상 선택시 => 값 합치기 (ex. 1 대기 + 2 진행중 = 3 )

    const para = {
      para: `list?fromDate=${convertDateToStr(
        filters.fromDate
      )}&toDate=${convertDateToStr(filters.toDate)}&userName=${
        filters.userName
      }&contents=${filters.contents}&isPublic=${
        filters.isPublic
      }&status=${status}&findRowValue=${filters.findRowValue}&page=${
        filters.pgNum
      }&pageSize=${filters.pgSize}`,
    };

    try {
      data = await processApi<any>("qna-list", para);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows;
      if (totalRowCnt > 0) {
        setMainDataResult((prev) => {
          return {
            data: [...prev.data, ...rows],
            total: totalRowCnt,
          };
        });

        if (Object.keys(selectedState).length === 0) {
          // 첫번째 행 선택하기
          const firstRowData = rows[0];
          setSelectedState({ [firstRowData[DATA_ITEM_KEY]]: true });
        }
      }
    }
    setFilters((prev) => ({
      ...prev,
      isFetch: false,
    }));
    setLoading(false);
  }, [selectedState, filters, setLoading, setSelectedState]);

  const fetchDetail = useCallback(
    async (enteredPw: string = "") => {
      let data: any;
      setLoading(true);

      const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
      const para = {
        id: mainDataId,
        password: detailData.password,
      };

      try {
        data = await processApi<any>("qna-detail", para);
      } catch (error: any) {
        data = null;
        console.log(error.message === "암호를 확인해 주십시오.");
        console.log(error);
        if (error.message === "암호를 확인해 주십시오.") {
          setIsDataLocked(true);
        }
      }

      if (data && data.result.isSuccess === true) {
        const questionDocument = data.questionDocument;
        const answerDocument = data.answerDocument;
        const rowCount = data.result.tables[0].RowCount;

        if (rowCount) {
          setIsDataLocked(false);
          // 상세정보 데이터 세팅
          const row = data.result.tables[0].Rows[0];
          setDetailData((prev) => ({
            ...row,
            work_type: "U",
            password: enteredPw,
            is_lock: row.is_lock === "Y" ? true : false,
            status: detailDataStatusListData.find(
              (item: any) => item["sub_code"] === row.status
            ),
            request_date: toDate(row.request_date),
            reception_date: dateformat2(row.reception_date),
            be_finished_date: dateformat2(row.be_finished_date),
          }));
        }

        // Edior에 HTML & CSS 세팅
        if (qEditorRef.current) {
          qEditorRef.current.setHtml(questionDocument);
        }

        if (aEditorRef.current) {
          aEditorRef.current.setHtml(answerDocument);
        }
      } else {
        console.log("[에러발생]");
        console.log(data);

        resetDetailData();
      }
      setLoading(false);
    },
    [selectedState, setLoading, detailData, setIsDataLocked]
  );

  const saveData = useCallback(async () => {
    let data: any;
    setLoading(true);

    let editorContent = "";
    if (qEditorRef.current) {
      editorContent = qEditorRef.current.getContent();
    }

    if (detailData.is_lock && !detailData.password) {
      alert("비밀번호를 입력해주세요.");
      setLoading(false);
      return false;
    }
    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent));

    const para = {
      password: `qna?password=${detailData.password}`,
      fileBytes: convertedEditorContent,
      procedureName: "pw6_sav_questions",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": detailData.work_type,
        "@p_document_id": detailData.document_id,
        "@p_password": detailData.password,
        "@p_salt": "",
        "@p_customer_code": loginResult.userId,
        "@p_user_id": loginResult.userId,
        "@p_user_name": detailData.user_name,
        "@p_user_tel": detailData.user_tel,
        "@p_request_date": convertDateToStr(detailData.request_date),
        "@p_title": detailData.title,
        "@p_contents": "",
        "@p_is_lock": detailData.is_lock ? "Y" : "N",
        "@p_is_public": detailData.is_public,
        "@p_attdatnum": detailData.attdatnum,
        "@p_pc": "",
      },
    };

    try {
      data = await processApi<any>("qna-save", para);
    } catch (error: any) {
      alert(error.message);
      data = null;
    }

    if (data && data.isSuccess === true) {
      if (detailData.work_type === "N") {
        // 신규 데이터 저장 시 첫번째 행 선택
        search();
      } else {
        // 기존 데이터 저장 시 기존 행 선택 유지
        setMainDataResult(process([], mainDataState));
        fetchGrid();
        fetchDetail();
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }

    setLoading(false);
  }, [setLoading, detailData, setSelectedState]);

  const deleteData = useCallback(async () => {
    let data: any;
    if (!window.confirm("정말 삭제하시겠습니까?")) return false;
    setLoading(true);

    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
    const para = {
      id: mainDataId,
      password: detailData.password,
    };

    try {
      data = await processApi<any>("qna-delete", para);
    } catch (error: any) {
      alert(error.message);
      data = null;
    }

    if (data && data.isSuccess === true) {
      search();
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  }, [setLoading, detailData]);

  // 상세정보 & 답변 초기화
  const resetDetailData = () => {
    setDetailData(defaultDetailData);

    // Edior에 HTML & CSS 세팅
    if (qEditorRef.current) {
      qEditorRef.current.setHtml("");
    }

    if (aEditorRef.current) {
      aEditorRef.current.setHtml("");
    }
  };

  useEffect(() => {
    if (filters.isFetch) {
      setFilters((prev) => ({ ...prev, isFetch: false }));
      fetchGrid();
    }
  }, [filters]);

  useEffect(() => {
    const mainDataId = Object.getOwnPropertyNames(selectedState)[0];
    console.log(mainDataId);
    if (mainDataId) {
      fetchDetail();
    }
  }, [selectedState]);

  useEffect(() => {
    // 미잠금시, 공개여부 공개로 설정
    if (!detailData.is_lock && detailData.is_public !== "Y") {
      setDetailData((prev) => ({ ...prev, is_public: "Y" }));
    }
  }, [detailData]);

  useEffect(() => {
    if (isDataLocked && detailData.work_type !== "N" && pwInputRef.current) {
      pwInputRef.current.focus();
    }
  }, [isDataLocked, detailData]);

  const addData = () => {
    setDetailData((prev) => ({
      ...prev,
      ...defaultDetailData,
      work_type: "N",
    }));

    if (qEditorRef.current) {
      qEditorRef.current.setHtml("");
    }

    if (aEditorRef.current) {
      aEditorRef.current.setHtml("");
    }
  };

  const handleKeyPressSearchDetail = (
    e: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (e.key === "Enter") {
      fetchDetail(detailData.password);
    }
  };

  return (
    <>
      <TitleContainer>
        <Title>QnA</Title>
        <ButtonContainer>
          <Button onClick={search} icon="search" themeColor={"primary"}>
            조회
          </Button>
          <Button
            onClick={addData}
            icon="file-add"
            themeColor={"primary"}
            fillMode="outline"
          >
            신규
          </Button>
          <Button
            onClick={saveData}
            fillMode="outline"
            themeColor={"primary"}
            icon="save"
          >
            저장
          </Button>
          <Button
            onClick={deleteData}
            fillMode="outline"
            themeColor={"primary"}
            icon="delete"
          >
            삭제
          </Button>
        </ButtonContainer>
      </TitleContainer>

      <GridContainerWrap height={"93vh"}>
        <GridContainer width={`40%`}>
          <GridTitleContainer>
            <GridTitle>요약정보</GridTitle>
          </GridTitleContainer>
          <FilterBoxWrap style={{ padding: "0 0 10px" }}>
            <FilterBox onKeyPress={(e) => handleKeyPressSearch(e, search)}>
              <tbody>
                <tr>
                  <th>요청일자</th>
                  <td colSpan={3}>
                    <div className="filter-item-wrap">
                      <DatePicker
                        name="fromDate"
                        value={filters.fromDate}
                        format="yyyy-MM-dd"
                        onChange={filterInputChange}
                        placeholder=""
                        className="required"
                      />
                      ~
                      <DatePicker
                        name="toDate"
                        value={filters.toDate}
                        format="yyyy-MM-dd"
                        onChange={filterInputChange}
                        placeholder=""
                        className="required"
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>공개 여부</th>
                  <td colSpan={3}>
                    <RadioGroup
                      name="isPublic"
                      data={isPublicListData}
                      value={filters.isPublic}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, isPublic: e.value }))
                      }
                      layout="horizontal"
                    />
                  </td>
                </tr>
                <tr>
                  <th>상태</th>
                  <td colSpan={3}>
                    <MultiSelect
                      data={statusListData}
                      onChange={filterMultiSelectChange}
                      value={filters.status}
                      textField="code_name"
                      dataItemKey="sub_code"
                    />
                  </td>
                </tr>
                <tr>
                  <th>작성자</th>
                  <td>
                    <Input
                      name="userName"
                      type="text"
                      value={filters.userName}
                      onChange={filterInputChange}
                    />
                  </td>
                  <th>제목 및 내용</th>
                  <td>
                    <Input
                      name="contents"
                      type="text"
                      value={filters.contents}
                      onChange={filterInputChange}
                    />
                  </td>
                </tr>
              </tbody>
            </FilterBox>
          </FilterBoxWrap>
          <Grid
            style={{ height: `100%` }}
            data={process(
              mainDataResult.data.map((row) => ({
                ...row,
                request_date: dateformat2(row.request_date),
                reception_date: dateformat2(row.reception_date),
                be_finished_date: dateformat2(row.be_finished_date),
                completion_date: dateformat2(row.completion_date),
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
            onScroll={onMainScrollHandler}
            //정렬기능
            sortable={true}
            onSortChange={onMainSortChange}
            //컬럼순서조정
            reorderable={true}
            //컬럼너비조정
            resizable={true}
          >
            <GridColumn
              field="status"
              title="상태"
              width={80}
              cell={QnaStateCell}
            />
            <GridColumn
              field="request_date"
              title="요청일"
              width={100}
              cell={CenterCell}
            />
            <GridColumn field="customer_name" title="업체명" width={120} />
            <GridColumn field="user_name" title="작성자" width={120} />
            <GridColumn field="title" title="제목" width={150} />
            <GridColumn
              field="reception_date"
              title="접수일"
              width={100}
              cell={CenterCell}
            />
            <GridColumn
              field="be_finished_date"
              title="완료예정일"
              width={100}
              cell={CenterCell}
            />
            <GridColumn
              field="completion_date"
              title="처리완료일"
              width={100}
              cell={CenterCell}
            />
            <GridColumn field="contents" title="내용" width={150} />
          </Grid>
        </GridContainer>
        <GridContainerWrap flexDirection="column">
          <GridTitleContainer>
            <GridTitle>상세정보</GridTitle>
          </GridTitleContainer>

          <GridContainer
            style={
              !isDataLocked || detailData.work_type === "N"
                ? { height: "100%" }
                : { display: "none", height: "100%" }
            }
          >
            <FormBoxWrap
              border
              style={{
                margin: "0 0 10px",
              }}
            >
              <FormBox>
                <tbody>
                  <tr>
                    <th>제목</th>
                    <td colSpan={3}>
                      <Input
                        name="title"
                        type="text"
                        value={detailData.title}
                        onChange={detailDataInputChange}
                        className={isAdmin ? "readonly" : "required"}
                        readOnly={isAdmin}
                      />
                    </td>
                    <th>작성자</th>
                    <td colSpan={3}>
                      <Input
                        name="user_name"
                        type="text"
                        value={detailData.user_name}
                        onChange={detailDataInputChange}
                        className={isAdmin ? "readonly" : "required"}
                        readOnly={isAdmin}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>연락처</th>
                    <td>
                      <Input
                        name="user_tel"
                        type="text"
                        value={detailData.user_tel}
                        onChange={detailDataInputChange}
                        className={isAdmin ? "readonly" : ""}
                        readOnly={isAdmin}
                      />
                    </td>
                    <th>비밀번호</th>
                    <td>
                      <div className="filter-item-wrap">
                        <Input
                          name="password"
                          type="password"
                          value={detailData.password}
                          onChange={detailDataInputChange}
                          className={
                            isAdmin
                              ? "readonly"
                              : detailData.is_lock
                              ? "required"
                              : ""
                          }
                          readOnly={isAdmin}
                        />
                        <Button
                          icon={detailData.is_lock ? "lock" : "unlock"}
                          themeColor={"primary"}
                          fillMode={"flat"}
                          onClick={() =>
                            setDetailData((prev) => ({
                              ...prev,
                              is_lock: !prev.is_lock,
                            }))
                          }
                          disabled={isAdmin}
                        />
                      </div>
                    </td>
                    <th>공개 여부</th>
                    <td colSpan={3}>
                      <RadioGroup
                        name="is_public"
                        data={isPublicListData.filter(
                          (data) => data.value !== "All"
                        )}
                        value={detailData.is_public}
                        onChange={(e) =>
                          setDetailData((prev) => ({
                            ...prev,
                            is_public: e.value,
                          }))
                        }
                        layout="horizontal"
                        className={isAdmin ? "readonly" : "required"}
                        disabled={detailData.is_lock ? false : true}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>요청일</th>
                    <td>
                      {isAdmin ? (
                        <Input
                          name="request_date"
                          type="text"
                          value={dateformat2(
                            convertDateToStr(detailData.request_date)
                          )}
                          className="readonly"
                          readOnly
                        />
                      ) : (
                        <DatePicker
                          name="request_date"
                          value={detailData.request_date}
                          onChange={detailDataInputChange}
                          format="yyyy-MM-dd"
                          className={"required"}
                          placeholder=""
                        />
                      )}
                    </td>
                    <th>완료예정일</th>
                    <td>
                      <Input
                        name="be_finished_date"
                        type="text"
                        value={detailData.be_finished_date}
                        onChange={detailDataInputChange}
                        className="readonly"
                        readOnly
                      />
                    </td>
                    <th>접수일</th>
                    <td>
                      <Input
                        name="reception_date"
                        type="text"
                        value={detailData.reception_date}
                        onChange={detailDataInputChange}
                        className="readonly"
                        readOnly
                      />
                    </td>
                    <th>상태</th>
                    <td>
                      <Input
                        name="status"
                        type="text"
                        value={detailData.status.code_name}
                        onChange={detailDataInputChange}
                        className="readonly"
                        readOnly
                      />
                    </td>
                  </tr>
                </tbody>
              </FormBox>
            </FormBoxWrap>
            <RichEditor id="qEditor" ref={qEditorRef} readonly={isAdmin} />
            <GridTitleContainer>
              <GridTitle>답변</GridTitle>
            </GridTitleContainer>
            <RichEditor id="aEditor" ref={aEditorRef} readonly />
          </GridContainer>
          {isDataLocked && detailData.work_type !== "N" && (
            <QnaPwBox onKeyPress={handleKeyPressSearchDetail}>
              <div className="inner">
                <Icon name="lock" themeColor="primary" size={"xlarge"} />
                <p>비밀번호를 입력해주세요.</p>
                <Input
                  name="password"
                  type="password"
                  value={detailData.password}
                  onChange={detailDataInputChange}
                  ref={pwInputRef}
                />
                <Button
                  themeColor={"primary"}
                  onClick={() => fetchDetail(detailData.password)}
                >
                  확인
                </Button>
              </div>
            </QnaPwBox>
          )}
        </GridContainerWrap>
      </GridContainerWrap>
    </>
  );
};
export default App;
