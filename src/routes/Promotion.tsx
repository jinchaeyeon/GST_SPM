import AddIcon from "@mui/icons-material/Add";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Container,
  Fab,
  Grid,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { bytesToBase64 } from "byte-base64";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { getDeviceHeight, getHeight } from "../components/CommonFunction";
import PromotionWindow from "../components/Windows/CommonWindows/PromotionWindow";
import { useApi } from "../hooks/api";
import { isLoading, loginResultState, titles } from "../store/atoms";
import { Iparameters } from "../store/types";

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;

const Promotion = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1200);
  const [webHeight, setWebHeight] = useState(0);
  const processApi = useApi();
  const setLoading = useSetRecoilState(isLoading);
  const [loginResult] = useRecoilState(loginResultState);
  const isAdmin = loginResult && loginResult.role === "ADMIN";
  const userId = loginResult ? loginResult.userId : "";
  const [title, setTitle] = useRecoilState(titles);
  const [promotionWindowVisible, setPromotionWindowVisible] =
    useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
      height2 = getHeight(".ButtonContainer2");
      setWebHeight(getDeviceHeight(false) - height - height2 + 35);
      height3 = (getDeviceHeight(false) - 400) / 3;
      height4 = (getDeviceHeight(false) - 400) / 2;
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
    if (localStorage.getItem("accessToken")) {
      setTitle("제품 홍보");
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
    pgSize: 12,
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
  }, [filters]);

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
        "@p_find_row_value": filters.findRowValue,
        "@p_id": userId,
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
        setMainDataResult({
          data: rows,
          total: TotalRowCount == -1 ? 0 : TotalRowCount,
        });
      } else {
        console.log("[에러발생]");
        console.log(data);
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

  return (
    <Box
      display="flex"
      overflow="hidden"
      style={{ userSelect: "none" }}
      width="100%"
    >
      {/* <Box width="15%">
        <GridTitleContainer>
          <GridTitle>조회조건</GridTitle>
        </GridTitleContainer>
        <FilterContainer>
          <FilterBox>
            <tbody>
              <tr>
                <th>example</th>
                <td>
                  <Input name="example" type="text" value={[]} />
                </td>
              </tr>
              <tr>
                <th>example</th>
                <td>
                  <Input name="example" type="text" value={[]} />
                </td>
              </tr>
              <tr>
                <th>example</th>
                <td>
                  <Input name="example" type="text" value={[]} />
                </td>
              </tr>
            </tbody>
          </FilterBox>
        </FilterContainer>
      </Box> */}
      <Box flexGrow={1} overflow="auto">
        <Container maxWidth={false}>
          <Grid container spacing={2.5} p={2} minHeight={webHeight}>
            {mainDataResult.data.map((item) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                mt={0.5}
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
                        height={height3}
                        image={item.thumbnail}
                        alt={item.title}
                        sx={{
                          borderRadius: 1,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        height={height3}
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
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Box display="flex" flexDirection="column">
                        <Box
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          flexWrap="nowrap"
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
                        </Box>
                        <Typography
                          component="div"
                          fontWeight={600}
                          sx={{ fontSize: "17px" }}
                        >
                          {item.title}
                        </Typography>
                      </Box>

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
          {/* 페이지네이션 버튼 */}
          <div
            className="ButtonContainer2"
            style={{
              position: "fixed",
              bottom: 30,
              width: "100%",
              zIndex: 100,
              display: "flex",
              justifyContent: "center",
              transform: "translateX(-110px)",
            }}
          >
            <Box display="flex" justifyContent="center" p={2}>
              <Stack spacing={2}>
                <Pagination
                  count={Math.ceil(mainDataResult.total / 12)}
                  showFirstButton
                  showLastButton
                  onChange={handlePageChange}
                  page={page}
                />
              </Stack>
            </Box>
          </div>
        </Container>
      </Box>
      {/* 신규 버튼 */}
      {isAdmin && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleAddNewProduct}
          sx={{
            position: "fixed",
            bottom: 40,
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
        />
      )}
    </Box>
  );
};

export default Promotion;
