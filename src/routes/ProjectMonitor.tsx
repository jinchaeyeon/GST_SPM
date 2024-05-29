import React, { useEffect, useState } from "react";
import {
  Grid,
  GridColumn,
  GridPageChangeEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { GAP, PAGE_SIZE } from "../components/CommonString";
import {
  ChunkProgressBar,
  ProgressBar,
} from "@progress/kendo-react-progressbars";
import {
  FilterBox,
  FormBox,
  FormBoxWrap,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
} from "../CommonStyled";
import { Card, CardBody, CardTitle } from "@progress/kendo-react-layout";
import { Input } from "@progress/kendo-react-inputs";
import { CardBodyProps } from "@progress/kendo-react-layout/dist/npm/card/interfaces/CardBodyProps";
import { CardTitleProps } from "@progress/kendo-react-layout/dist/npm/card/interfaces/CardTitleProps";
import { CardHeaderProps } from "@progress/kendo-react-layout/dist/npm/card/interfaces/CardHeaderProps";
import { Button } from "@progress/kendo-react-buttons";
import { ButtonClickAction } from "@mui/base";

const ProjectProgress: React.FC = () => {
  type TProject = {
    id: number;
    name: string;
    start: string;
    end: string;
    swProgress?: number;
    hwProgress?: number;
    ifProgress?: number;
    inspectorName: string;
    inspectorContact: string;
    auditorName: string;
    auditorContact: string;
    enterprisePM: string;
    supplierPM: string;
  };

  const projectList: TProject[] = [
    {
      id: 1,
      name: "프로젝트 A",
      start: "2024-01-01",
      end: "2024-06-30",
      swProgress: 60,
      hwProgress: 70,
      ifProgress: 80,
      inspectorName: "홍길동",
      inspectorContact: "010-1234-5678",
      auditorName: "이몽룡",
      auditorContact: "010-9876-5432",
      enterprisePM: "김철수",
      supplierPM: "박영희",
    },
    {
      id: 2,
      name: "프로젝트 B",
      start: "2024-02-01",
      end: "2024-07-31",
      swProgress: 10,
      hwProgress: 50,
      ifProgress: 60,
      inspectorName: "김철수",
      inspectorContact: "010-1111-2222",
      auditorName: "이영희",
      auditorContact: "010-3333-4444",
      enterprisePM: "박지성",
      supplierPM: "손흥민",
    },
    {
      id: 3,
      name: "프로젝트 C",
      start: "2024-03-01",
      end: "2024-08-31",
      swProgress: 80,
      hwProgress: 90,
      ifProgress: 85,
      inspectorName: "이순신",
      inspectorContact: "010-5555-6666",
      auditorName: "강감찬",
      auditorContact: "010-7777-8888",
      enterprisePM: "유관순",
      supplierPM: "서봉준",
    },
  ];

  type TProjectDetail = {
    id: number;
    projectId: number;
    name: string;
    category: string; // 구분
    formId: string; // 폼 ID
    menuName: string; // 메뉴명
    progress: number; // 진행률
    includeList: boolean; // LIST 포함 여부
    standardScore: number; // 개발 표준 점수
    modificationRate: number; // 수정률
    functionalityScore: number; // 기능 점수
    designer: string; // 설계자
    developer: string; // 개발담당자
    designPlanDate: string; // 설계 예정 일
    developmentPlanDate: string; // 계발 예정 일
    designStartDate: string; // 설계 시작 일
    developmentStartDate: string; // 개발 시작 일
    completionPlanDate: string; // 완료 예정 일
    completionDate: string; // 완료 일
    responsible: string; // 확인담당자
    confirmationDate: string; // 확인 일
    use: boolean; // 사용 여부
    note: string; // 비고
    inspectionDate: string; // 검수 일자
    companyManager: string; // 업체담당자
    companySign: string; // 업체사인
  };

  const projectListDetail: TProjectDetail[] = [
    {
      id: 1,
      projectId: 1,
      name: "프로젝트 A",
      category: "SW",
      formId: "폼ID A",
      menuName: "메뉴명 A",
      progress: 80, // 진행률
      includeList: true, // LIST 포함 여부
      standardScore: 90, // 개발 표준 점수
      modificationRate: 85, // 수정률
      functionalityScore: 95, // 기능 점수
      designer: "설계자 A",
      developer: "개발담당자 A",
      designPlanDate: "2024-04-01", // 설계 예정 일
      developmentPlanDate: "2024-04-15", // 계발 예정 일
      designStartDate: "2024-05-01", // 설계 시작 일
      developmentStartDate: "2024-05-15", // 개발 시작 일
      completionPlanDate: "2024-06-01", // 완료 예정 일
      completionDate: "2024-06-15", // 완료 일
      responsible: "확인담당자 A",
      confirmationDate: "2024-07-01", // 확인 일
      use: true, // 사용 여부
      note: "비고 A",
      inspectionDate: "2024-07-15", // 검수 일자
      companyManager: "업체담당자 A",
      companySign: "업체사인 A",
    },
    {
      id: 2,
      projectId: 1,
      name: "프로젝트 A",
      category: "HW",
      formId: "폼ID B",
      menuName: "메뉴명 B",
      progress: 70, // 진행률
      includeList: false, // LIST 포함 여부
      standardScore: 85, // 개발 표준 점수
      modificationRate: 80, // 수정률
      functionalityScore: 90, // 기능 점수
      designer: "설계자 B",
      developer: "개발담당자 B",
      designPlanDate: "2024-04-02", // 설계 예정 일
      developmentPlanDate: "2024-04-16", // 계발 예정 일
      designStartDate: "2024-05-02", // 설계 시작 일
      developmentStartDate: "2024-05-16", // 개발 시작 일
      completionPlanDate: "2024-06-02", // 완료 예정 일
      completionDate: "2024-06-16", // 완료 일
      responsible: "확인담당자 B",
      confirmationDate: "2024-07-02", // 확인 일
      use: false, // 사용 여부
      note: "비고 B",
      inspectionDate: "2024-07-16", // 검수 일자
      companyManager: "업체담당자 B",
      companySign: "업체사인 B",
    },
    {
      id: 3,
      projectId: 2,
      name: "프로젝트 B",
      category: "HW",
      formId: "폼ID B",
      menuName: "메뉴명 B",
      progress: 70, // 진행률
      includeList: false, // LIST 포함 여부
      standardScore: 85, // 개발 표준 점수
      modificationRate: 80, // 수정률
      functionalityScore: 90, // 기능 점수
      designer: "설계자 B",
      developer: "개발담당자 B",
      designPlanDate: "2024-04-02", // 설계 예정 일
      developmentPlanDate: "2024-04-16", // 계발 예정 일
      designStartDate: "2024-05-02", // 설계 시작 일
      developmentStartDate: "2024-05-16", // 개발 시작 일
      completionPlanDate: "2024-06-02", // 완료 예정 일
      completionDate: "2024-06-16", // 완료 일
      responsible: "확인담당자 B",
      confirmationDate: "2024-07-02", // 확인 일
      use: false, // 사용 여부
      note: "비고 B",
      inspectionDate: "2024-07-16", // 검수 일자
      companyManager: "업체담당자 B",
      companySign: "업체사인 B",
    },
  ];

  const DATA_ITEM_KEY = "id";
  const initialPageState = { skip: 0, take: PAGE_SIZE };
  const chunks = 3;

  const [selectedProject, setSelectedProject] = useState<TProject | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<
    TProjectDetail[]
  >([]);

  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});
  const [page, setPage] = useState(initialPageState);
  const [page2, setPage2] = useState(initialPageState);

  const pageChange = (event: GridPageChangeEvent) => {
    const { page } = event;

    setDetailFilters((prev) => ({
      ...prev,
      pgNum: 1,
    }));

    setPage2(initialPageState);
    setFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isSearch: true,
    }));

    setPage({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  const pageChange2 = (event: GridPageChangeEvent) => {
    const { page } = event;

    setDetailFilters((prev) => ({
      ...prev,
      pgNum: Math.floor(page.skip / initialPageState.take) + 1,
      isSearch: true,
    }));

    setPage2({
      skip: page.skip,
      take: initialPageState.take,
    });
  };

  const [filters, setFilters] = useState({});
  const [detailFilters, setDetailFilters] = useState<TProjectDetail[]>([]);

  const onSelectionChange = (event: GridSelectionChangeEvent) => {
    const newSelectedState = getSelectedState({
      event,
      selectedState: selectedState,
      dataItemKey: DATA_ITEM_KEY,
    });
    setSelectedState(newSelectedState);

    const selectedIdx = event.startRowIndex;
    const selectedRowData = event.dataItems[selectedIdx];

    setSelectedProject(selectedRowData);
    setDetailFilters([]);
    
  };

  const handleButtonClick = (category: string) => {
    let filteredProjectDetail: TProjectDetail[] = [];

    if (selectedProject) {
      filteredProjectDetail = projectListDetail.filter(
        (project) => project.projectId === selectedProject.id && project.category === category
      ) as TProjectDetail[]; // 해당 카테고리에 맞는 프로젝트 상세 정보 필터링
    }

    setDetailFilters((prevFilters) => {
      const isCategorySelected = prevFilters.some((item) => item.category === category);
  
      if (isCategorySelected) {
        // 이미 선택된 카테고리인 경우 해당 카테고리의 데이터를 제거
        return prevFilters.filter((item) => item.category !== category);
      } else {
        // 선택되지 않은 카테고리인 경우 해당 카테고리의 데이터를 추가
        return [...prevFilters, ...filteredProjectDetail];
      }
    });
  };

  const fetchGrid = async () => {
    const firstRowData = projectList[0];
    setSelectedProject(firstRowData);
  };

  const fetchDetailGrid = async (filters: TProjectDetail) => {
    const firstRowData = projectList[0];
    setSelectedProject(firstRowData);
  };

  useEffect(() => {
    fetchGrid();
  }, []);

  return (
    <>
      <GridContainerWrap>
        <GridContainer width={`21.8%`}>
          <GridTitleContainer>
            <GridTitle>현재 사업</GridTitle>
          </GridTitleContainer>
          <Grid
            data={projectList}
            rowHeight={40}
            selectable={{
              enabled: true,
              mode: "single",
            }}
            selectedField="selected"
            onSelectionChange={onSelectionChange}
            style={{ height: "20vh" }}
          >
            <GridColumn field="name" title="사업명" width={150} />
            <GridColumn field="start" title="시작일" width={100} />
            <GridColumn field="end" title="종료일" width={100} />
          </Grid>
        </GridContainer>
        <GridContainer width={`calc(80% - ${GAP}px)`}>
          <GridTitleContainer>
            <GridTitle>사업정보</GridTitle>
          </GridTitleContainer>

          {selectedProject && (
            <>
              <FormBoxWrap border style={{ height: "20vh" }}>
                <FormBox>
                  <tbody>
                    <tr>
                      <th>사업명</th>
                      <td>
                        <Input
                          name="name"
                          value={selectedProject.name}
                          className="readonly"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>시작일</th>
                      <td>
                        <Input
                          name="start"
                          value={selectedProject.start}
                          className="readonly"
                        />
                      </td>
                      <th>중간점검일</th>
                      <td>
                        <Input></Input>
                      </td>
                      <th>최종점검일</th>
                      <td>
                        <Input></Input>
                      </td>
                      <th>완료점검일</th>
                      <td>
                        <Input></Input>
                      </td>
                    </tr>
                    <tr>
                      <th>점검 위원님성함</th>
                      <td>
                        <Input
                          name="inspectorName"
                          value={selectedProject.inspectorName}
                          className="readonly"
                        />
                      </td>
                      <th>점검 위원님연락처</th>
                      <td>
                        <Input
                          name="inspectorContact"
                          value={selectedProject.inspectorContact}
                          className="readonly"
                        />
                      </td>

                      <th>감리 위원님성함</th>
                      <td>
                        <Input
                          name="start"
                          value={selectedProject.start}
                          className="readonly"
                        />
                      </td>
                      <th>감리 위원님연락처</th>
                      <td>
                        <Input
                          name="start"
                          value={selectedProject.start}
                          className="readonly"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>도입기업 PM</th>
                      <td>
                        <Input></Input>
                      </td>
                      <th>공급기업 PM</th>
                      <td>
                        <Input></Input>
                      </td>
                    </tr>
                  </tbody>
                </FormBox>
              </FormBoxWrap>

              {/* <Grid
                data={[selectedProject]} // 선택된 프로젝트 하나만 보여줄 것이므로 배열로 감싸서 전달
                style={{ height: "20vh" }} // 그리드 높이 설정
              >
                <GridColumn field="name" title="사업명" />
                <GridColumn field="start" title="시작일" width={100} />
                <GridColumn field="start" title="중간점검일" width={100} />
                <GridColumn field="start" title="완료점검일" width={100} />
                <GridColumn field="start" title="최종점검일" width={100} />
                <GridColumn field="end" title="점검 위원님성함" />
                <GridColumn field="end" title="점검 위원님연락처" />
                <GridColumn field="end" title="감리 위원님성함" />
                <GridColumn field="end" title="감리 위원님연락처" />
                <GridColumn field="end" title="도입기업 PM" width={100} />
                <GridColumn field="end" title="공금기업 PM" width={100} />
              </Grid> */}
            </>
          )}
        </GridContainer>
      </GridContainerWrap>
      {selectedProject && (
        <>
          <div style={{ margin: "20px 0 20px 0" }}>
            <GridTitle>일정 진척도</GridTitle>
            <ChunkProgressBar
              value={selectedProject.hwProgress}
              style={{
                backgroundColor: "#d7d7d7",
                marginTop: "15px",
                height: "3vh",
              }}
              chunkCount={chunks}
            />
          </div>

          <GridTitle>시스템 진척율</GridTitle>
          <div
            style={{
              display: "flex",
              gap: "20vh",
              justifyContent: "center",
              margin: "0 40px 20px 20px",
            }}
          >
            <Button
              style={{ width: "20vh" }}
              togglable={true}
              onClick={() => handleButtonClick("SW")}
            >
              <span style={{ fontSize: "25px", fontWeight: "bold" }}>SW</span>
              <br />
              <span style={{ fontSize: "23px" }}>
                {selectedProject?.swProgress || 0}%
              </span>
            </Button>
            <Button togglable={true} style={{ width: "20vh" }} onClick={() => handleButtonClick("HW")}>
              <span style={{ fontSize: "25px", fontWeight: "bold" }}>HW</span>
              <br />
              <span style={{ fontSize: "23px" }}>
                {selectedProject?.hwProgress || 0}%
              </span>
            </Button>
            <Button togglable={true} style={{ width: "20vh" }} onClick={() => handleButtonClick("I/F")}>
              <span style={{ fontSize: "25px", fontWeight: "bold" }}>I/F</span>
              <br />
              <span style={{ fontSize: "23px" }}>
                {selectedProject?.ifProgress || 0}%
              </span>
            </Button>
          </div>
        </>
      )}
      <GridContainer>
        <GridTitleContainer>
          <GridTitle>상세내역</GridTitle>
        </GridTitleContainer>
        <Grid
          data={detailFilters}
          rowHeight={40}
          selectable={{
            enabled: true,
            mode: "single",
          }}
          selectedField="selected"
          onSelectionChange={onSelectionChange}
          style={{ height: "36vh" }}
        >
          <GridColumn field="category" title="구분" width={150} />
          <GridColumn field="formId" title="폼ID" width={100} />
          <GridColumn field="menuName" title="메뉴명" width={100} />
          <GridColumn field="progress" title="진행률" width={100} />
          <GridColumn field="includeList" title="LIST포함여부" width={100} />
          <GridColumn field="standardScore" title="개발표준점수" width={100} />
          <GridColumn field="modificationRate" title="수정률" width={100} />
          <GridColumn field="functionalityScore" title="기능점수" width={100} />
          <GridColumn field="designer" title="설계자" width={100} />
          <GridColumn field="developer" title="개발담당자" width={100} />
          <GridColumn field="designPlanDate" title="설계예정일" width={100} />
          <GridColumn
            field="developmentPlanDate"
            title="계발예정일"
            width={100}
          />
          <GridColumn field="designStartDate" title="설계시작일" width={100} />
          <GridColumn
            field="developmentStartDate"
            title="개발시작일"
            width={100}
          />
          <GridColumn
            field="completionPlanDate"
            title="완료예정일"
            width={100}
          />
          <GridColumn field="completionDate" title="완료일" width={100} />
          <GridColumn field="responsible" title="확인담당자" width={100} />
          <GridColumn field="confirmationDate" title="확인일" width={100} />
          <GridColumn field="use" title="사용여부" width={100} />
          <GridColumn field="note" title="비고" width={100} />
          <GridColumn field="inspectionDate" title="검수일자" width={100} />
          <GridColumn field="companyManager" title="업체담당자" width={100} />
          <GridColumn field="companySign" title="업체사인" width={100} />
        </Grid>
      </GridContainer>
    </>
  );
};

export default ProjectProgress;
