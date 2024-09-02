import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Container,
  Fab,
  Grid,
  IconButton,
  Pagination,
  PaginationItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataResult,
  filterBy,
  process,
  State,
} from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { Icon } from "@progress/kendo-react-common";
import {
  ComboBoxChangeEvent,
  ComboBoxFilterChangeEvent,
} from "@progress/kendo-react-dropdowns";
import { Input, InputChangeEvent } from "@progress/kendo-react-inputs";
import { bytesToBase64 } from "byte-base64";
import { FilterDescriptor } from "devextreme/data";
import { useEffect, useLayoutEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  ButtonContainer,
  FilterBox,
  FilterBoxWrap,
  InfoTitle,
  Title,
  TitleContainer,
} from "../CommonStyled";
import CustomMultiColumnComboBox from "../components/ComboBoxes/CustomMultiColumnComboBox";
import { getDeviceHeight, getHeight } from "../components/CommonFunction";
import PromotionWindow from "../components/Windows/CommonWindows/PromotionWindow";
import { useApi } from "../hooks/api";
import { isLoading, loginResultState, titles } from "../store/atoms";
import { dataTypeColumns } from "../store/columns/common-columns";
import { Iparameters } from "../store/types";
import  secureLocalStorage  from  "react-secure-storage";

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var height5 = 0;

const Promotion = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1200);
  const [webHeight, setWebHeight] = useState(0);
  const [count, setCount] = useState(1);
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const isLoadingState = useRecoilValue(isLoading);
  const [loginResult] = useRecoilState(loginResultState);
  const isAdmin = loginResult && loginResult.role === "ADMIN";
  const userId = loginResult ? loginResult.userId : "";
  const [title, setTitle] = useRecoilState(titles);
  const [promotionWindowVisible, setPromotionWindowVisible] =
    useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [typeFilterTop, setTypeFilterTop] = useState<FilterDescriptor>();
  const handleFilterChangeTop = (event: ComboBoxFilterChangeEvent) => {
    if (event) {
      if (event.target.name == "category") {
        const filterValue = event.filter.value.toLowerCase();
        const filteredData = typesData.filter((item) =>
          item.code_name.toLowerCase().includes(filterValue)
        );
        setTypeFilterTop(filteredData);
      }
    }
  };
  const [typesData, setTypesData] = useState<any[]>([]);
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );

  const [page, setPage] = useState(1);

  useLayoutEffect(() => {
    const updateHeight = () => {
      height = getHeight(".TitleContainer");
      height5 = getHeight(".ButtonContainer");
      height2 = getHeight(".ButtonContainer2");
      setWebHeight(getDeviceHeight(false) - height5 - 30);
      height3 = (getDeviceHeight(false) - 400 - height5) / 3;
      height4 = (getDeviceHeight(false) - 290 - height - height5) / 2;
    };

    const handleWindowResize = () => {
      setIsMobile(window.innerWidth <= 1200);
      updateHeight();
    };

    updateHeight();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  useEffect(() => {
    if (secureLocalStorage.getItem("accessToken")) {
      setTitle("서비스소개");
      fetchTypes();
      fetchMainGrid(filters);
    }
  }, [setTitle]);

  //조회조건 초기값
  const [filters, setFilters] = useState({
    work_type: "",
    title: "",
    category: "",
    tagnames_s: "",
    documentId: "",
    findRowValue: "",
    pgNum: 1,
    pgSize: isMobile ? 2 : 12,
    isSearch: false,
    isHot: false,
    isNew: false,
  });

  const [information, setInformation] = useState({
    work_type: "",
    title: "",
    category: "",
    tagnames_s: "",
    documentId: "",
    findRowValue: "",
    pgNum: 1,
    pgSize: isMobile ? 2 : 12,
    isSearch: false,
  });

  //조회조건 사용자 옵션 디폴트 값 세팅 후 최초 한번만 실행
  useEffect(() => {
    if (filters.isSearch) {
      const _ = require("lodash");
      const deepCopiedFilters = _.cloneDeep(filters);
      setFilters((prev) => ({ ...prev, find_row_value: "", isSearch: false })); // 한번만 조회되도록
      fetchMainGrid(deepCopiedFilters);
    }
    const calculatedCount = Math.ceil(
      mainDataResult.total / (isMobile ? 2 : 12)
    );
    setCount(calculatedCount);
  }, [filters]);

  const history = useHistory();
  const location = useLocation();
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      pgNum: 1,
      pgSize: isMobile ? 2 : 12,
      isSearch: true,
    }));
    setPage(1);
  }, [isMobile]);

  // 구분 조회
  const fetchTypes = async () => {
    let data: any;
    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(
      bytes(
        "SELECT sub_code, code_name FROM comCodeMaster WHERE group_code = 'SP010'"
      )
    );

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
      setTypesData(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const fetchMainGrid = async (filters: any) => {
    let data: any;
    setLoading(true);
    const queryParams = new URLSearchParams(location.search);
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_promotion",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": "list",
        "@p_title": filters.title,
        "@p_category": filters.category,
        "@p_tagnames_s": filters.tagnames_s,
        "@p_document_id": filters.documentId,
        "@p_find_row_value": queryParams.has("go")
          ? (queryParams.get("go") as string)
          : filters.findRowValue,
        "@p_id": userId,
        "@p_is_open": isAdmin ? "" : "Y",
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess == true) {
      const TotalRowCount = data.tables[0].TotalRowCount;
      const rows = data.tables[0].Rows.map((row: any) => ({
        ...row,
        thumbnail: row.thumbnail
          ? `data:image/png;base64,${row.thumbnail}`
          : null,
      }));
      if (TotalRowCount > 0) {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.has("go")) {
          const item = rows.filter(
            (item: any) => item.document_id == (queryParams.get("go") as string)
          )[0];
          history.replace({}, "");
          setSelectedProduct(item);
          setPromotionWindowVisible(true);
          setPage(data.pageNumber);
        }
        setMainDataResult({
          data: rows,
          total: TotalRowCount == -1 ? 0 : TotalRowCount,
        });
      } else {
        setMainDataResult(process([], mainDataState));
      }
      // 필터 isSearch false처리, pgNum 세팅
      setFilters((prev) => ({
        ...prev,
        pgNum:
          data && data.hasOwnProperty("pageNumber")
            ? data.pageNumber
            : prev.pgNum,
        isSearch: false,
      }));
      setLoading(false);
    }
  };

  const handleCardClick = (item: any) => {
    setSelectedProduct(item);
    setPromotionWindowVisible(true);
  };

  const handleAddNewProduct = () => {
    setSelectedProduct(null);
    setPromotionWindowVisible(true);
  };

  useEffect(() => {
    if (!promotionWindowVisible) {
      fetchMainGrid(filters);
    }
  }, [promotionWindowVisible]);

  // const handleHashtagClick = (hashtag: string) => {
  //   setFilteredProducts(
  //     products.filter((product) => product.hashtags.includes(hashtag))
  //   );
  // };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44 ||
        e.key === "PrtSc" ||
        (e.ctrlKey && e.code === "KeyP") ||
        (e.ctrlKey && e.code === "KeyC") ||
        (e.ctrlKey && e.shiftKey && e.code === "KeyS") ||
        (e.ctrlKey && e.shiftKey && e.code === "KeyI") ||
        (e.ctrlKey && e.code === "KeyS") ||
        (e.key === "Meta" && e.shiftKey && e.code === "KeyS") ||
        (e.key === "PrintScreen" && e.altKey)
      ) {
        e.preventDefault();
        alert("해당 기능을 사용하실 수 없습니다.");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44 ||
        e.key === "PrtSc" ||
        (e.key === "PrintScreen" && e.altKey)
      ) {
        e.preventDefault();
        alert("해당 기능을 사용하실 수 없습니다.");
        navigator.clipboard
          .writeText("")
          .then(() => {
            console.log("클립보드가 비워졌습니다.");
          })
          .catch((err) => {
            console.error("클립보드를 비울 수 없습니다.", err);
          });
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handlePageChange = (event: any, value: number) => {
    setPage(value);
    setFilters((prev) => ({
      ...prev,
      pgNum: value,
      isSearch: true,
    }));
  };

  const handleTagClick = (tag: string) => {
    setPromotionWindowVisible(false); // 모달 닫기
    setFilters((prev) => ({
      ...prev,
      tagnames_s: tag,
      pgNum: 1,
      pgSize: isMobile ? 2 : 12,
      isSearch: true,
    }));
    setInformation((prev) => ({
      ...prev,
      title: "#" + tag,
    }));
  };

  const handleInputChange = (e: InputChangeEvent) => {
    const { value, name }: any = e.target;
    setInformation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setFilters((prev) => {
        const isTag = information.title.startsWith("#");
        return {
          ...prev,
          title: isTag ? "" : information.title,
          tagnames_s: isTag ? information.title.slice(1) : "",
          pgNum: 1,
          isSearch: true,
        };
      });
    }
  };

  const handleClear = () => {
    setInformation((prev) => ({
      ...prev,
      title: "",
    }));
  };

  const [showDetails, setShowDetails] = useState(false);
  const toggleDetails = () => {
    setShowDetails((prev) => !prev);
  };

  const [placeholder, setPlaceholder] = useState("Search...");

  const FilterComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";
    if (value && value.sub_code) {
      setInformation((prev) => ({
        ...prev,
        [name]: value.sub_code,
      }));
    } else {
      setInformation((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const search = () => {
    setMainDataResult(process([], mainDataState));
    // 그리드 재조회
    setFilters((prev) => ({
      ...prev,
      category: information.category,
      pgNum: 1,
      pgGap: 0,
      isSearch: true,
    }));
  };

  const handleChipClick = (type: "isHot" | "isNew") => {
    setFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <>
      {isMobile && (
        <TitleContainer className="TitleContainer">
          <Title>서비스소개</Title>
        </TitleContainer>
      )}
      <Box
        display="flex"
        flexDirection="column"
        style={{ userSelect: "none", paddingBottom: "20px" }}
        width="100%"
      >
        <Box flexGrow={1} overflow="auto" sx={{ paddingBottom: "20px" }}>
          <Container maxWidth={false}>
            <Box>
              <div
                className="ButtonContainer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "white",
                  marginTop: "10px",
                  marginLeft: "15px",
                  padding: "8px 16px",
                  borderRadius: showDetails ? "25px 25px 0 0" : "25px",
                  // border: showDetails ? "2px 2px 0 0 solid #9d9acd" : "2px solid #9d9acd",
                  boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
                  maxWidth: "600px",
                  width: "100%",
                  maxHeight: "40px",
                }}
              >
                <SearchIcon style={{ marginRight: "10px", color: "#7a76ce" }} />
                <Input
                  placeholder={placeholder}
                  name="title"
                  value={information.title}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                  }}
                  onFocus={() => setPlaceholder("")}
                  onBlur={() => setPlaceholder("Search...")}
                  onKeyPress={handleKeyPress}
                />
                {information.title != "" && (
                  <CloseIcon
                    onClick={handleClear}
                    style={{
                      color: "#b0b0b0",
                      cursor: "pointer",
                    }}
                  />
                )}
                <IconButton
                  onClick={toggleDetails}
                  style={{ marginLeft: "10px" }}
                >
                  <Tooltip title="상세조건" arrow>
                    <FilterListIcon
                      style={{ color: showDetails ? "#7a76ce" : "#b0b0b0" }}
                    />
                  </Tooltip>
                </IconButton>
              </div>

              {showDetails && (
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "20px",
                    borderBottomLeftRadius: "25px",
                    borderBottomRightRadius: "25px",
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.15)",
                    maxWidth: "600px",
                    width: "100%",
                    marginTop: "0px",
                    // borderTop: "1px solid #eee",
                    marginLeft: "15px",
                  }}
                >
                  {/* <GridTitle>상세조건</GridTitle> */}
                  {/* <Box display="flex" mb={1}> // hot, new 검색 나중에 사용가능
                    <Chip
                      label="HOT"
                      onClick={() => handleChipClick("isHot")}
                      sx={{
                        backgroundColor: filters.isHot ? "#ef5350" : "#fff",
                        color: filters.isHot ? "white" : "#ef5350",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "12px",
                        lineHeight: "14px",
                        mr: 1,
                        border: `1px solid ${
                          filters.isHot ? "#ef5350" : "#ef5350"
                        }`,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: filters.isHot ? "#ef5350" : "#fff",
                        },
                      }}
                    />
                    <Chip
                      label="NEW"
                      onClick={() => handleChipClick("isNew")}
                      sx={{
                        backgroundColor: filters.isNew ? "#fbc02d" : "#fff",
                        color: filters.isNew ? "white" : "#fbc02d",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "12px",
                        lineHeight: "14px",
                        border: `1px solid ${
                          filters.isNew ? "#fbc02d" : "#fbc02d"
                        }`,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: filters.isNew ? "#fbc02d" : "#fff",
                        },
                      }}
                    />
                  </Box> */}
                  <FilterBoxWrap>
                    <FilterBox>
                      <tbody>
                        <tr>
                          <th>카테고리</th>
                          <td>
                            <CustomMultiColumnComboBox
                              name="category"
                              data={
                                typeFilterTop
                                  ? filterBy(typesData, typeFilterTop)
                                  : typesData
                              }
                              value={
                                typesData.find(
                                  (item) =>
                                    item.sub_code === information.category
                                ) || {}
                              }
                              columns={dataTypeColumns}
                              textField={"code_name"}
                              onChange={FilterComboBoxChange}
                              filterable={false}
                              onFilterChange={handleFilterChangeTop}
                              clearButton={true}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </FilterBox>
                  </FilterBoxWrap>
                  <ButtonContainer>
                    <Button
                      themeColor={"primary"}
                      style={{ padding: "10px 30px" }}
                      onClick={search}
                    >
                      검색
                    </Button>
                    <Button
                      onClick={() => setShowDetails(false)}
                      fillMode={"outline"}
                      themeColor={"primary"}
                      style={{ padding: "10px 30px" }}
                    >
                      닫기
                    </Button>
                  </ButtonContainer>
                </div>
              )}
            </Box>
            {mainDataResult.total == 0 ? (
              <InfoTitle style={{ padding: "20px" }}>
                {isLoadingState ? "" : "조회 결과가 없습니다."}
              </InfoTitle>
            ) : (
              <Grid
                container
                spacing={isMobile ? 1 : 2.5}
                minHeight={webHeight}
                style={{
                  padding: "10px 10px 0 10px",
                }}
              >
                {mainDataResult.data.map((item) => (
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={3}
                    // mt={0.5}
                    key={item.document_id}
                  >
                    <Card
                      onClick={() => handleCardClick(item)}
                      sx={{
                        borderRadius: 2,
                        padding: "10px 10px 0 10px",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
                        transition: "0.7s",
                        "&:hover": {
                          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                          cursor: "pointer",
                          transform: "translateY(-3px)",
                        },
                      }}
                    >
                      <Box position="relative">
                        {item.thumbnail ? (
                          <CardMedia
                            component="img"
                            height={isMobile ? height4 : height3}
                            image={item.thumbnail}
                            alt={item.title}
                            sx={{
                              borderRadius: 1,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <Box
                            height={isMobile ? height4 : height3}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bgcolor="lightgray"
                            borderRadius={1}
                            width="100%"
                          >
                            <ImageOutlinedIcon
                              style={{ marginRight: "8px", color: "gray" }}
                            />
                            <Typography variant="body2" color="gray">
                              이미지 준비 중
                            </Typography>
                          </Box>
                        )}
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          display="flex"
                          p={1}
                        >
                          {item.is_hot == "Y" && (
                            <Box
                              bgcolor="#ef5350"
                              color="white"
                              p={1}
                              borderRadius="8px"
                              mr={1}
                              fontWeight={"bold"}
                              fontSize="12px"
                              lineHeight="14px"
                            >
                              HOT
                            </Box>
                          )}
                          {item.is_new == "Y" && (
                            <Box
                              bgcolor="#fbc02d"
                              color="white"
                              p={1}
                              borderRadius="8px"
                              fontWeight={"bold"}
                              fontSize="12px"
                              lineHeight="14px"
                            >
                              NEW
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <CardContent>
                        <Box display="flex" flexDirection="column">
                          <Box
                            display="flex"
                            flexDirection="row"
                            alignItems="flex_start"
                            flexWrap="nowrap"
                            justifyContent="space-between"
                            width={"100%"}
                          >
                            <Typography
                              component="div"
                              fontWeight={600}
                              sx={{
                                fontSize: "13px",
                                color: "#6a68ba",
                              }}
                            >
                              {
                                typesData.find(
                                  (type) => type.sub_code === item.category
                                )?.code_name
                              }
                            </Typography>
                            <Typography
                              variant="body2"
                              color={"gray"}
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              <VisibilityIcon
                                style={{
                                  fontSize: "16px",
                                  verticalAlign: "middle",
                                  marginRight: "2px",
                                }}
                              />
                              {item.max_seq == null ? 0 : item.max_seq}
                            </Typography>
                          </Box>
                          <Box
                            display="flex"
                            alignItems="center"
                            flexShrink={0}
                          >
                            <Typography
                              component="div"
                              fontWeight={600}
                              sx={{
                                fontSize: "17px",
                                display: "block",
                                maxWidth: "100%",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis", // 잘린 부분에 줄임표 표시
                              }}
                            >
                              {item.is_open === "N" && (
                                <Icon
                                  name="lock" // 자물쇠 아이콘
                                  style={{
                                    color: "#6a68ba",
                                    fontSize: "14px",
                                    marginRight: "4px",
                                    paddingBottom: "2px",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              {item.title}
                            </Typography>
                          </Box>
                        </Box>
                        {/* 해시태그 주석- 추후에 사용 */}
                        {/* <Box
              mt={1}
              display="flex"
              flexWrap="wrap"
              gap={0.5}
              minHeight="25px"
            >
              {item.tagnames
                .split("|")
                .filter((hashtag: string) => hashtag.trim() !== "")
                .map((hashtag: string, index: any) => (
                  <Chip
                    key={index}
                    label={"#" + hashtag}
                    // onClick={() => handleHashtagClick(hashtag)}
                    // variant="outlined"
                    size="small"
                    style={{
                      color: "#7a76ce",
                      backgroundColor: "#f0ecfc",
                    }}
                  />
                ))}
            </Box> */}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Container>
        </Box>
        {/* 페이지네이션 버튼 */}
        <div
          className="ButtonContainer2"
          style={{
            marginTop: "-20px",
          }}
        >
          <Box display="flex" justifyContent="center" p={2}>
            <Stack spacing={2}>
              <Pagination
                count={count}
                showFirstButton
                showLastButton
                onChange={handlePageChange}
                page={page}
                siblingCount={isMobile ? 0 : undefined}
                boundaryCount={isMobile ? 0 : undefined}
                renderItem={(item) => {
                  if (isMobile) {
                    // 모바일에서만 특정 로직 적용
                    if (item.type === "page" && item.page === page) {
                      return <PaginationItem {...item} />;
                    }
                    if (item.type === "previous" || item.type === "next") {
                      return <PaginationItem {...item} />;
                    }
                    return null; // 나머지 항목은 렌더링하지 않음
                  } else {
                    // 비모바일에서는 기본 PaginationItem 반환
                    return <PaginationItem {...item} />;
                  }
                }}
                defaultPage={1}
              />
            </Stack>
          </Box>
        </div>

        {/* 신규 버튼 */}
        {isAdmin && (
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleAddNewProduct}
            sx={{
              position: "fixed",
              bottom: isMobile ? 20 : 100,
              right: 40,
              backgroundColor: "#7a76ce",
              "&:hover": {
                backgroundColor: "#6a68ba",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
              },
            }}
          >
            <AddIcon />
          </Fab>
        )}
        {promotionWindowVisible && (
          <PromotionWindow
            datas={selectedProduct}
            setVisible={setPromotionWindowVisible}
            modal={true}
            visible={promotionWindowVisible}
            onTagClick={handleTagClick}
          />
        )}
      </Box>
    </>
  );
};

export default Promotion;
