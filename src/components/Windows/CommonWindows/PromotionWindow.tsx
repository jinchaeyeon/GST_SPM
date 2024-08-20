import styled from "@emotion/styled";
import ImageIcon from "@mui/icons-material/Image";
import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from "@mui/material";
import { DataResult, process, State } from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import { Dialog } from "@progress/kendo-react-dialogs";
import { ComboBoxChangeEvent } from "@progress/kendo-react-dropdowns";
import { Buffer } from "buffer";
import { bytesToBase64 } from "byte-base64";
import {
  createContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  GridContainerWrap,
  GridTitle,
  GridTitleContainer,
} from "../../../CommonStyled";
import { useApi } from "../../../hooks/api";
import { IWindowPosition } from "../../../hooks/interfaces";
import { isLoading, loginResultState } from "../../../store/atoms";
import { dataTypeColumns } from "../../../store/columns/common-columns";
import { Iparameters, TEditorHandle } from "../../../store/types";
import CustomMultiColumnComboBox from "../../ComboBoxes/CustomMultiColumnComboBox";
import {
  getHeight,
  getWindowDeviceHeight,
  UseParaPc,
} from "../../CommonFunction";
import { GAP } from "../../CommonString";
import RichEditor from "../../RichEditor";
import Window from "../WindowComponent/Window";
import { removeBeforeUnloadListener } from "../../PanelBarNavContainer";
import SwiperCore from "swiper";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/react";

type IWindow = {
  setVisible(t: boolean): void;
  datas: any;
  modal?: boolean;
};

type TItemInfo = {
  files: string;
  url: string;
};

interface Hashtag {
  seq: number;
  name: string;
  rowstatus: string;
}

interface InformationType {
  work_type: string;
  document_id: string;
  title: string;
  image: string;
  isHot: boolean;
  isNew: boolean;
  tagnames: Hashtag[];
  type: string;
}

const defaultItemInfo = {
  files: "",
  url: "",
};
let temp = 0;
export const FormContext = createContext<{
  itemInfo: TItemInfo;
  setItemInfo: (d: React.SetStateAction<TItemInfo>) => void;
}>({} as any);

const SmallCheckbox = styled(Checkbox)(({ theme }) => ({
  "& .MuiSvgIcon-root": {
    fontSize: 22,
  },
  "&.Mui-checked": {
    color: "#7a76ce",
  },
}));

const CustomTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "#e8e8e8 !important", // Custom color for border
    },
    "&:hover fieldset": {
      borderColor: "#7a76ce", // Custom color for hover border
    },
    "&.Mui-focused fieldset": {
      borderColor: "#7a76ce", // Custom color for focused border
    },
    "&.Mui-disabled": {
      "& input": {
        color: "black", // Custom color for disabled text
        WebkitTextFillColor: "black", // Fix for Chrome, Safari
      },
    },
  },
});

var height = 0;
var height2 = 0;
var height3 = 0;
var height4 = 0;
var index = 0;

const PromotionWindow = ({ setVisible, datas, modal = false }: IWindow) => {
  let deviceWidth = window.innerWidth;
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;
  const setLoading = useSetRecoilState(isLoading);
  const [mobileheight, setMobileHeight] = useState(0);
  const [mobileheight2, setMobileHeight2] = useState(0);
  const [webheight, setWebHeight] = useState(0);
  const [webheight2, setWebHeight2] = useState(0);
  const [webheight3, setWebHeight3] = useState(0);
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [swiper, setSwiper] = useState<SwiperCore>();

  useLayoutEffect(() => {
    console.log("***");
    height = getHeight(".k-window-titlebar"); //공통 해더
    height2 = getHeight(".ButtonContainer"); //하단 버튼부분
    height3 = getHeight(".ButtonContainer2"); //태그높이
    height4 = getHeight(".ButtonContainer3"); //스와이퍼버튼

    setMobileHeight(
      getWindowDeviceHeight(false, deviceHeight) -
        height -
        height2 -
        height4 +
        15
    );
    setMobileHeight2(
      getWindowDeviceHeight(false, deviceHeight) - height - height2 - height4 - 5
    );
    setWebHeight(getWindowDeviceHeight(false, position.height) - height);
    setWebHeight2(
      getWindowDeviceHeight(false, position.height) - height - height2
    );
    setWebHeight3(
      getWindowDeviceHeight(false, position.height) - height - height2
    );
  }, [webheight, webheight2, webheight3]);

  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : (deviceWidth - 1250) / 2,
    top: isMobile == true ? 0 : (deviceHeight - 670) / 2,
    width: isMobile == true ? deviceWidth : 1250,
    height: isMobile == true ? deviceHeight : 670,
  });

  const onChangePostion = (position: any) => {
    setPosition(position);
    setWebHeight(
      getWindowDeviceHeight(false, position.height) - height - height2 - 25
    );
  };

  const processApi = useApi();
  const [loginResult] = useRecoilState(loginResultState);
  const isAdmin = loginResult && loginResult.role === "ADMIN";
  const userId = loginResult ? loginResult.userId : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const editorRef = useRef<TEditorHandle>(null);
  const [typesData, setTypesData] = useState<any[]>([]);
  const [Information, setInformation] = useState<InformationType>({
    work_type: datas ? "U" : "N",
    document_id: "",
    title: "",
    image: "",
    isHot: false,
    isNew: false,
    tagnames: [],
    type: "",
  });

  const [imgBase64, setImgBase64] = useState<string>(); // 파일 base64
  const [itemInfo, setItemInfo] = useState<TItemInfo>(defaultItemInfo);

  const setHtmlOnEditor = (content: string) => {
    if (editorRef.current) {
      if (!isAdmin) editorRef.current.updateEditable(true);
      if (!isAdmin) editorRef.current.updateEditable(false);
      editorRef.current.setHtml(content);
    }
  };

  const extractTextFromHtmlContent = (htmlString: string) => {
    let extractString: string = "";

    const regex = /<body[^>]*>([\s\S]*?)<\/body>/i;
    const match = htmlString.match(regex);

    if (match && match[1]) {
      extractString = match[1]; // body 태그 안의 내용만 처리
    }

    extractString = extractString.replace(/(<([^>]+)>)/gi, ""); // 태그 제거
    extractString = extractString.replace(/\s\s+/g, " "); // 연달아 있는 줄바꿈, 공백, 탭을 공백 1개로 줄임

    return extractString;
  };

  const onClose = () => {
    setVisible(false);
    // removeBeforeUnloadListener();
  };

  //조회조건 초기값
  const [filters, setFilters] = useState({
    work_type: "",
    title: "",
    category: "",
    tagnames_s: "",
    documentId: datas?.document_id,
    findRowValue: "",
    pgNum: 1,
    pgSize: 12,
    isSearch: false,
  });

  const fetchDetail = async () => {
    let data: any;
    setLoading(true);
    //조회조건 파라미터
    const parameters: Iparameters = {
      procedureName: "pw6_sel_promotion",
      pageNumber: filters.pgNum,
      pageSize: filters.pgSize,
      parameters: {
        "@p_work_type": "detail",
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
      setMainDataResult({
        data: rows,
        total: TotalRowCount == -1 ? 0 : TotalRowCount,
      });
      const rows2 = data.tables[1].Rows;
      if (rows2) {
        const fetchedTags = rows2.map(
          (rows2: { seq: number; tagname: string }) => ({
            seq: rows2.seq,
            name: rows2.tagname,
            rowstatus: "",
          })
        );

        setInformation((prev) => ({
          ...prev,
          document_id: rows[0].document_id,
          image: rows[0].thumbnail,
          title: rows[0].title,
          isHot: rows[0].is_hot == "Y" ? true : false,
          isNew: rows[0].is_new == "Y" ? true : false,
          type: rows[0].category,
          tagnames: fetchedTags,
        }));
      }
      setLoading(false);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }

    // if (datas && datas.result.isSuccess === true) {
    //   // Edior에 HTML & CSS 세팅
    //   const document = datas.document;
    //   setHtmlOnEditor(document);
    // }
    // setImgBase64("data:image/png;base64," + Information.image);
  };

  const fetchDetail2 = async () => {
    let data: any;
    let reference = "";

    setLoading(true);

    if (mainDataResult.total < 0) {
      return false;
    }

    const para = {
      folder: "promotion",
      id: filters.documentId,
    };

    try {
      data = await processApi<any>("html-query", para);
    } catch (error) {
      data = null;
    }

    if (data !== null && data.document !== "") {
      reference = data.document;
      // Edior에 HTML & CSS 세팅
      if (editorRef.current) {
        editorRef.current.setHtml(reference);
      }
      // Edior에 HTML & CSS 세팅
      setHtmlOnEditor(reference);
    }
    setLoading(false);
  };

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

  useEffect(() => {
    fetchTypes();
    if (datas?.document_id) {
      setFilters((prev) => {
        if (prev.documentId !== datas.document_id) {
          return { ...prev, documentId: datas.document_id };
        }
        return prev;
      });
    } else {
      setInformation({
        work_type: "N",
        document_id: "",
        title: "",
        image: "",
        isHot: false,
        isNew: false,
        tagnames: [],
        type: "",
      });
      setHtmlOnEditor("");
    }
  }, [datas]);

  useEffect(() => {
    if (datas?.document_id) {
      fetchDetail();
      fetchDetail2();
    }
  }, [filters]);

  // 저장
  const onSave = async () => {
    if (!navigator.onLine) {
      alert("네트워크 연결상태를 확인해주세요.");
      setLoading(false);
      return false;
    }
    let data: any;
    setLoading(true);
    if (!Information.title) {
      alert("제목은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    } else if (!Information.type || Information.type === "") {
      alert("구분은(는) 필수 입력 항목입니다.");
      setLoading(false);
      return false;
    }

    let editorContent = "";
    if (editorRef.current) {
      editorContent = editorRef.current.getContent();
    }

    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent));

    const filteredTags = Information.tagnames.filter(
      (tag) => tag.rowstatus === "N" || tag.rowstatus === "D"
    );

    const tagNames = filteredTags.map((tag) => tag.name).join("|");
    const tagStatuses = filteredTags.map((tag) => tag.rowstatus).join("|");
    const tagSeqs = filteredTags.map((tag) => tag.seq).join("|");

    const para = {
      pageNumber: 0,
      pageSize: 0,
      folder: "html-doc?folder=" + "promotion",
      fileBytes: convertedEditorContent,
      procedureName: "pw6_sav_promotion",
      parameters: {
        "@p_work_type": Information.work_type,
        "@p_document_id": Information.document_id,
        "@p_title": Information.title,
        "@p_category": Information.type,
        "@p_thumbnail": Information.image
          ? Information.image.split(",")[1]
          : "",
        "@p_contents": extractTextFromHtmlContent(editorContent),
        "@p_is_new": Information.isNew == true ? "Y" : "N",
        "@p_is_hot": Information.isHot == true ? "Y" : "N",
        "@p_tags_s": tagNames,
        "@p_seq_s": tagSeqs,
        "@p_row_status_s": tagStatuses,
        "@p_form_id": "Promotion",
        "@p_id": userId,
        "@p_pc": pc,
      },
    };

    try {
      data = await processApi<any>("html-save", para);
    } catch (error) {
      data = null;
    }

    if (data && data.isSuccess === true) {
      alert("성공적으로 저장되었습니다.");
      setVisible(false);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
    setVisible(false);
  };

  // 문의하기
  const onLink = () => {
    removeBeforeUnloadListener();
    const origin = window.location.origin;
    window.location.href = origin + `/QnA?title=${datas.title}`;
  };

  // 삭제하기
  const onDelete = async () => {
    if (!window.confirm("[" + datas.title + "] 정말 삭제하시겠습니까?"))
      return false;
    setLoading(true);
    let data: any;
    let editorContent = "";
    if (editorRef.current) {
      editorContent = editorRef.current.getContent();
    }

    const bytes = require("utf8-bytes");
    const convertedEditorContent = bytesToBase64(bytes(editorContent));

    const para = {
      pageNumber: 0,
      pageSize: 0,
      fileBytes: convertedEditorContent,
      folder: "html-doc?folder=" + "promotion",
      procedureName: "pw6_sav_promotion",
      parameters: {
        "@p_work_type": "D",
        "@p_document_id": Information.document_id,
        "@p_title": Information.title,
        "@p_category": Information.type,
        "@p_thumbnail": Information.image
          ? Information.image.split(",")[1]
          : "",
        "@p_contents": extractTextFromHtmlContent(editorContent),
        "@p_is_new": Information.isNew == true ? "Y" : "N",
        "@p_is_hot": Information.isHot == true ? "Y" : "N",
        "@p_tags_s": "",
        "@p_seq_s": "",
        "@p_row_status_s": "",
        "@p_form_id": "Promotion",
        "@p_id": userId,
        "@p_pc": pc,
      },
    };
    try {
      data = await processApi<any>("html-save", para);
    } catch (error) {
      data = null;
    }

    if (data && data.isSuccess === true) {
      alert("삭제되었습니다.");
      setVisible(false);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
    setLoading(false);
  };

  const [newHashtag, setNewHashtag] = useState<string>("");

  // 해시태그
  const handleAddHashtag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && newHashtag.trim() !== "") {
      const trimmedHashtag = newHashtag.trim();
      const existingTag = Information.tagnames.find(
        (tag) => tag.name === trimmedHashtag
      );

      if (existingTag && existingTag.rowstatus === "D") {
        // 이미 존재하는 태그를 복구
        setInformation((prev) => ({
          ...prev,
          tagnames: prev.tagnames.map((tag) =>
            tag.name === trimmedHashtag ? { ...tag, rowstatus: "" } : tag
          ),
        }));
      } else if (
        !Information.tagnames.some((tag) => tag.name === trimmedHashtag) &&
        Information.tagnames.filter((tag) => tag.rowstatus !== "D").length < 5
      ) {
        // 현재 최대 seq 값 찾기
        const maxSeq = Information.tagnames.reduce(
          (max, tag) => (tag.seq > max ? tag.seq : max),
          0
        );

        // 새로운 해시태그 추가
        setInformation((prev) => ({
          ...prev,
          tagnames: [
            ...prev.tagnames,
            {
              seq: maxSeq + 1,
              name: trimmedHashtag,
              rowstatus: "N",
            },
          ],
        }));
      }
      setNewHashtag("");
    }
  };

  const handleDeleteHashtag = (hashtagToDelete: Hashtag) => {
    setInformation((prev) => ({
      ...prev,
      tagnames: prev.tagnames
        // 신규 태그는 seq로 필터링하여 삭제
        .filter((tag) =>
          tag.rowstatus === "N" ? tag.seq !== hashtagToDelete.seq : true
        )
        // 기존 태그는 seq로 찾아 rowstatus를 'D'로 변경
        .map((tag) =>
          tag.seq === hashtagToDelete.seq && tag.rowstatus !== "N"
            ? { ...tag, rowstatus: "D" }
            : tag
        ),
    }));
  };

  const onInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setInformation((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onComboBoxChange = (e: ComboBoxChangeEvent) => {
    const { value } = e.target;
    const name = e.target.props.name ?? "";

    setInformation((prev) => ({
      ...prev,
      [name]: value.sub_code,
    }));
  };

  // 이미지 업로드
  useEffect(() => {
    if (!isFileUploaded) return;
    let newImgBase64 = "";
    if (
      itemInfo.files.slice(0, 1) === "0" &&
      itemInfo.files.slice(1, 2) === "x" &&
      itemInfo.url !== undefined
    ) {
      newImgBase64 = itemInfo.url.toString();
    } else {
      newImgBase64 = itemInfo.files;
    }
    setImgBase64(newImgBase64);
  });

  const onAttWndClick2 = () => {
    const uploadInput2 = document.getElementById("uploadAttachment2");
    uploadInput2!.click();
  };
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const getAttachmentsData = async (files: FileList | null) => {
    if (files != null) {
      const file = files[0];
      const maxSizeInBytes = 1 * 1024 * 1024; // 1MB 크기 제한

      if (file.size > maxSizeInBytes) {
        alert("파일 크기는 1MB 이하로 제한됩니다. 다른 파일을 선택해주세요.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("선택한 파일이 이미지가 아닙니다. 이미지 파일을 선택해주세요.");
        return;
      }

      let uint8 = new Uint8Array(await file.arrayBuffer());
      let arrHexString = Buffer.from(uint8).toString("hex");
      const reader = new FileReader();
      reader.readAsDataURL(file);
      return new Promise((resolve) => {
        reader.onload = () => {
          if (reader.result != null) {
            const base64String = reader.result.toString();
            setInformation((prev) => ({
              ...prev,
              image: base64String,
            }));
            setItemInfo({
              files: "0x" + arrHexString,
              url: reader.result.toString(),
            });
            setIsFileUploaded(true);
          }
        };
      });
    } else {
      alert("새로고침 후 다시 업로드해주세요.");
    }
  };

  const onDeleteClick = () => {
    setIsFileUploaded(true);
    setItemInfo({ files: "0x", url: "" });
    setInformation((prev) => ({
      ...prev,
      image: "",
    }));
  };

  const [openDialog, setOpenDialog] = useState(false);

  const handleImageClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const [positions, setPositions] = useState({ top: "50%", left: "50%" });

  return (
    <Window
      titles={"상세정보"}
      positions={position}
      Close={onClose}
      modals={true}
      onChangePostion={onChangePostion}
    >
      {isMobile ? (
        <>
          <Swiper
            onSwiper={(swiper) => {
              setSwiper(swiper);
            }}
            onActiveIndexChange={(swiper) => {
              index = swiper.activeIndex;
            }}
          >
            <SwiperSlide key={0}>
              <GridContainer
                width="10%"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: mobileheight,
                }}
              >
                <GridTitleContainer>
                  <GridTitle></GridTitle>
                  <ButtonContainer className="ButtonContainer3">
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
                </GridTitleContainer>
                {!isAdmin && (
                  <Box display="flex" mt={1} ml={0.2}>
                    <Box alignItems="flex-start" justifyContent="flex-start">
                      <Typography
                        component="div"
                        fontWeight={600}
                        sx={{
                          fontSize: "15px",
                          color: "#6a68ba",
                        }}
                      >
                        {
                          typesData.find(
                            (type) => type.sub_code === Information.type
                          )?.code_name
                        }
                      </Typography>
                      <Box
                        display="flex"
                        alignItems="center"
                        flexDirection={"row"}
                      >
                        <Typography
                          component="div"
                          variant="h3"
                          fontWeight={600}
                          style={{
                            fontSize: "22px",
                            color: "#424242",
                          }}
                        >
                          {Information.title}
                        </Typography>
                        <Box ml={0.5} display="flex">
                          {Information.isHot && (
                            <Box
                              bgcolor="#ef5350"
                              color="white"
                              width="15px"
                              height="15px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              borderRadius="50%"
                              mr={0.5}
                              fontWeight="bold"
                              fontSize="8px"
                              lineHeight="14px"
                            >
                              H
                            </Box>
                          )}
                          {Information.isNew && (
                            <Box
                              bgcolor="#fbc02d"
                              color="white"
                              width="15px"
                              height="15px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              borderRadius="50%"
                              fontWeight="bold"
                              fontSize="8px"
                              lineHeight="14px"
                            >
                              N
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
                {Information.image != "" && Information.image != null ? (
                  <>
                    <Box
                      sx={{
                        height: webheight2,
                        overflow: "auto",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        mb: 1,
                        mt: 1.3,
                      }}
                    >
                      <Box
                        component="img"
                        src={Information.image}
                        alt={Information.title}
                        onClick={handleImageClick}
                        sx={{
                          borderRadius: 1,
                          width: "auto",
                          height: "auto",
                          maxWidth: "100%",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                      />
                      {isAdmin ? (
                        <Box display={"flex"} justifyContent={"center"} gap={1}>
                          <Button
                            style={{ margin: "10px 0" }}
                            onClick={onAttWndClick2}
                            fillMode="outline"
                            themeColor={"primary"}
                          >
                            이미지 수정
                          </Button>
                          <input
                            id="uploadAttachment2"
                            style={{ display: "none" }}
                            type="file"
                            accept="image/*"
                            // ref={excelInput2}
                            onChange={(
                              event: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              getAttachmentsData(event.target.files);
                            }}
                          />
                          <Button
                            style={{ margin: "10px 0" }}
                            onClick={onDeleteClick}
                            fillMode="outline"
                            themeColor={"primary"}
                          >
                            이미지 삭제
                          </Button>
                        </Box>
                      ) : (
                        <Box
                          mt={2}
                          display="flex"
                          flexWrap="wrap"
                          minHeight="40px"
                          style={{
                            width: "100%",
                            justifyContent: "flex-start",
                            gap: "4px",
                          }}
                        >
                          {Information.tagnames
                            .filter((hashtag) => hashtag.rowstatus !== "D")
                            .slice(0, 5)
                            .map((hashtag, index) => (
                              <Chip
                                key={hashtag.seq}
                                label={"#" + hashtag.name}
                                onDelete={
                                  isAdmin
                                    ? () => handleDeleteHashtag(hashtag)
                                    : undefined
                                }
                                style={{
                                  color: "#7a76ce",
                                  backgroundColor: "#f0ecfc",
                                }}
                              />
                            ))}
                          {Information.tagnames.filter(
                            (hashtag) => hashtag.rowstatus !== "D"
                          ).length < 5 &&
                            isAdmin && (
                              <Box
                                display="flex"
                                alignItems="center"
                                style={{
                                  marginLeft:
                                    Information.tagnames.length > 0 ? 10 : 0,
                                  marginRight: "5px",
                                }}
                              >
                                <Typography
                                  variant="body1"
                                  color={"#a0a0a0"}
                                  mr={0.2}
                                >
                                  #
                                </Typography>
                                <TextField
                                  variant="standard"
                                  size="small"
                                  placeholder="태그입력"
                                  value={newHashtag}
                                  onChange={(e) =>
                                    setNewHashtag(e.target.value)
                                  }
                                  onKeyDown={handleAddHashtag}
                                  InputProps={{
                                    disableUnderline: true,
                                    style: {
                                      fontSize: "12px",
                                      paddingTop: "3px",
                                    },
                                  }}
                                />
                              </Box>
                            )}
                        </Box>
                      )}
                    </Box>
                  </>
                ) : (
                  <>
                    {isAdmin ? (
                      <>
                        <Box
                          height={200}
                          display="flex"
                          flexDirection={"column"}
                          alignItems="center"
                          justifyContent="center"
                          // bgcolor="#d3d3d3"
                          border="1px solid #e0e0e0"
                          borderRadius={1}
                          minWidth="100%"
                          mt={1.3}
                        >
                          <ImageIcon
                            style={{ marginRight: "8px", color: "gray" }}
                          />
                          <Typography variant="body2" color="gray">
                            이미지 업로드는
                          </Typography>
                          <Typography variant="body2" color="gray">
                            최대 1MB까지 가능합니다.
                          </Typography>
                        </Box>
                        <Button
                          onClick={onAttWndClick2}
                          themeColor={"primary"}
                          style={{ margin: "10px 0" }}
                        >
                          이미지 업로드
                        </Button>
                        <input
                          id="uploadAttachment2"
                          style={{ display: "none" }}
                          type="file"
                          accept="image/*"
                          // ref={excelInput2}
                          onChange={(
                            event: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            getAttachmentsData(event.target.files);
                          }}
                        />
                      </>
                    ) : (
                      <Box
                        mt={2}
                        display="flex"
                        flexWrap="wrap"
                        minHeight="40px"
                        style={{
                          width: "100%",
                          justifyContent: "flex-start",
                          gap: "4px",
                        }}
                      >
                        {Information.tagnames
                          .filter((hashtag) => hashtag.rowstatus !== "D")
                          .slice(0, 5)
                          .map((hashtag, index) => (
                            <Chip
                              key={hashtag.seq}
                              label={"#" + hashtag.name}
                              onDelete={
                                isAdmin
                                  ? () => handleDeleteHashtag(hashtag)
                                  : undefined
                              }
                              style={{
                                color: "#7a76ce",
                                backgroundColor: "#f0ecfc",
                              }}
                            />
                          ))}
                        {Information.tagnames.filter(
                          (hashtag) => hashtag.rowstatus !== "D"
                        ).length < 5 &&
                          isAdmin && (
                            <Box
                              display="flex"
                              alignItems="center"
                              style={{
                                marginLeft:
                                  Information.tagnames.length > 0 ? 10 : 0,
                                marginRight: "5px",
                              }}
                            >
                              <Typography
                                variant="body1"
                                color={"#a0a0a0"}
                                mr={0.2}
                              >
                                #
                              </Typography>
                              <TextField
                                variant="standard"
                                size="small"
                                placeholder="태그입력"
                                value={newHashtag}
                                onChange={(e) => setNewHashtag(e.target.value)}
                                onKeyDown={handleAddHashtag}
                                InputProps={{
                                  disableUnderline: true,
                                  style: {
                                    fontSize: "12px",
                                    paddingTop: "3px",
                                  },
                                }}
                              />
                            </Box>
                          )}
                      </Box>
                    )}
                  </>
                )}
              </GridContainer>
            </SwiperSlide>
            <SwiperSlide key={1}>
              <GridContainer width={"100%"} style={{ height: mobileheight2 }}>
                <GridTitleContainer>
                  <ButtonContainer className="ButtonContainer3">
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
                </GridTitleContainer>
                {isAdmin && (
                  <>
                    <Box display="flex">
                      <CustomMultiColumnComboBox
                        name="type"
                        data={typesData}
                        value={
                          typesData.find(
                            (item) => item.sub_code === Information.type
                          ) || {}
                        }
                        columns={dataTypeColumns}
                        textField={"code_name"}
                        onChange={onComboBoxChange}
                        // filterable={true}
                        clearButton={false}
                        style={{
                          width: "170px",
                          height: "35px",
                          marginTop: "10px",
                        }}
                      />

                      <FormGroup
                        row
                        sx={{
                          flexGrow: 1,
                          justifyContent: "flex-end", // 오른쪽 끝에 정렬
                          alignItems: "center", // 세로 방향 중앙 정렬
                          paddingTop: 1,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <SmallCheckbox
                              checked={Information.isHot}
                              onChange={onInputChange}
                              name="isHot"
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "14px", marginLeft: 0 }}
                            >
                              HOT
                            </Typography>
                          }
                          sx={{ marginRight: 1.5 }}
                        />
                        <FormControlLabel
                          control={
                            <SmallCheckbox
                              checked={Information.isNew}
                              onChange={onInputChange}
                              name="isNew"
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "14px" }}
                            >
                              NEW
                            </Typography>
                          }
                          sx={{ marginRight: 0 }}
                        />
                      </FormGroup>
                    </Box>
                    <CustomTextField
                      name="title"
                      type="text"
                      value={Information.title}
                      onChange={onInputChange}
                      className={!isAdmin ? "readonly" : "required"}
                      InputProps={{
                        sx: {
                          height: "35px",
                          margin: "10px 0px 5px 0px",
                          fontFamily: "Noto Sans KR",
                          fontSize: "15px",
                        },
                      }}
                      sx={{
                        flex: 1,
                        backgroundColor: "white",
                      }}
                      disabled={!isAdmin}
                    />
                  </>
                )}
                <RichEditor id="editor" ref={editorRef} hideTools={!isAdmin} />
                {isAdmin && (
                  <Box
                    mt={2}
                    display="flex"
                    flexWrap="wrap"
                    alignItems="center"
                    minHeight="40px"
                    gap={"4px"}
                    className="ButtonContainer2"
                  >
                    {Information.tagnames
                      .filter((hashtag) => hashtag.rowstatus !== "D")
                      .slice(0, 5)
                      .map((hashtag, index) => (
                        <Chip
                          key={hashtag.seq}
                          label={"#" + hashtag.name}
                          onDelete={
                            isAdmin
                              ? () => handleDeleteHashtag(hashtag)
                              : undefined
                          }
                          style={{
                            color: "#7a76ce",
                            backgroundColor: "#f0ecfc",
                            marginRight: "2px",
                          }}
                        />
                      ))}
                    {Information.tagnames.filter(
                      (hashtag) => hashtag.rowstatus !== "D"
                    ).length < 5 &&
                      isAdmin && (
                        <Box
                          display="flex"
                          alignItems="center"
                          style={{
                            marginLeft:
                              Information.tagnames.length > 0 ? 10 : 0,
                            marginRight: "5px",
                          }}
                        >
                          <Typography
                            variant="body1"
                            color={"#a0a0a0"}
                            mr={0.2}
                          >
                            #
                          </Typography>
                          <TextField
                            variant="standard"
                            size="small"
                            placeholder="태그입력"
                            value={newHashtag}
                            onChange={(e) => setNewHashtag(e.target.value)}
                            onKeyDown={handleAddHashtag}
                            InputProps={{
                              disableUnderline: true,
                              style: {
                                fontSize: "12px",
                                paddingTop: "3px",
                              },
                            }}
                          />
                        </Box>
                      )}
                  </Box>
                )}
              </GridContainer>
            </SwiperSlide>
          </Swiper>
          <BottomContainer className="BottomContainer">
            {!isAdmin ? (
              <div style={{ width: "100%" }} className="ButtonContainer">
                <Button
                  themeColor={"primary"}
                  onClick={onLink}
                  style={{
                    width: "100%",
                    height: "40px",
                    // letterSpacing: "0.5em",
                    fontSize: "15px",
                  }}
                >
                  문의하기
                </Button>
              </div>
            ) : (
              <div
                style={{ width: "100%", display: "flex", gap: GAP }}
                className="ButtonContainer"
              >
                <Button
                  themeColor={"primary"}
                  onClick={onDelete}
                  fillMode={"outline"}
                  style={{
                    height: "40px",
                    fontSize: "15px",
                    flex: 1,
                  }}
                >
                  삭 제
                </Button>
                <Button
                  themeColor={"primary"}
                  onClick={onSave}
                  style={{
                    height: "40px",
                    fontSize: "15px",
                    flex: 1,
                  }}
                >
                  저 장
                </Button>
              </div>
            )}
          </BottomContainer>
        </>
      ) : (
        <GridContainerWrap>
          <GridContainer
            width="38%"
            style={{
              display: "flex",
              flexDirection: "column",
              height: webheight,
            }}
          >
            {!isAdmin && (
              <Box display="flex" mt={1} ml={0.2}>
                <Box alignItems="flex-start" justifyContent="flex-start">
                  <Typography
                    component="div"
                    fontWeight={600}
                    sx={{
                      fontSize: "15px",
                      color: "#6a68ba",
                    }}
                  >
                    {
                      typesData.find(
                        (type) => type.sub_code === Information.type
                      )?.code_name
                    }
                  </Typography>
                  <Box display="flex" alignItems="center" flexDirection={"row"}>
                    <Typography
                      component="div"
                      variant="h3"
                      fontWeight={600}
                      style={{
                        fontSize: "22px",
                        color: "#424242",
                      }}
                    >
                      {Information.title}
                    </Typography>
                    <Box ml={0.5} display="flex">
                      {Information.isHot && (
                        <Box
                          bgcolor="#ef5350"
                          color="white"
                          width="15px"
                          height="15px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          borderRadius="50%"
                          mr={0.5}
                          fontWeight="bold"
                          fontSize="8px"
                          lineHeight="14px"
                        >
                          H
                        </Box>
                      )}
                      {Information.isNew && (
                        <Box
                          bgcolor="#fbc02d"
                          color="white"
                          width="15px"
                          height="15px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          borderRadius="50%"
                          fontWeight="bold"
                          fontSize="8px"
                          lineHeight="14px"
                        >
                          N
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
            {Information.image != "" && Information.image != null ? (
              <>
                <Box
                  sx={{
                    height: webheight2,
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    mb: 1,
                    mt: 1.3,
                  }}
                >
                  <Box
                    component="img"
                    src={Information.image}
                    alt={Information.title}
                    onClick={handleImageClick}
                    sx={{
                      borderRadius: 1,
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  />
                  {isAdmin ? (
                    <Box display={"flex"} justifyContent={"center"} gap={1}>
                      <Button
                        style={{ margin: "10px 0" }}
                        onClick={onAttWndClick2}
                        fillMode="outline"
                        themeColor={"primary"}
                      >
                        이미지 수정
                      </Button>
                      <input
                        id="uploadAttachment2"
                        style={{ display: "none" }}
                        type="file"
                        accept="image/*"
                        // ref={excelInput2}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          getAttachmentsData(event.target.files);
                        }}
                      />
                      <Button
                        style={{ margin: "10px 0" }}
                        onClick={onDeleteClick}
                        fillMode="outline"
                        themeColor={"primary"}
                      >
                        이미지 삭제
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      mt={2}
                      display="flex"
                      flexWrap="wrap"
                      minHeight="40px"
                      style={{
                        width: "100%",
                        justifyContent: "flex-start",
                        gap: "4px",
                      }}
                    >
                      {Information.tagnames
                        .filter((hashtag) => hashtag.rowstatus !== "D")
                        .slice(0, 5)
                        .map((hashtag, index) => (
                          <Chip
                            key={hashtag.seq}
                            label={"#" + hashtag.name}
                            onDelete={
                              isAdmin
                                ? () => handleDeleteHashtag(hashtag)
                                : undefined
                            }
                            style={{
                              color: "#7a76ce",
                              backgroundColor: "#f0ecfc",
                            }}
                          />
                        ))}
                      {Information.tagnames.filter(
                        (hashtag) => hashtag.rowstatus !== "D"
                      ).length < 5 &&
                        isAdmin && (
                          <Box
                            display="flex"
                            alignItems="center"
                            style={{
                              marginLeft:
                                Information.tagnames.length > 0 ? 10 : 0,
                              marginRight: "5px",
                            }}
                          >
                            <Typography
                              variant="body1"
                              color={"#a0a0a0"}
                              mr={0.2}
                            >
                              #
                            </Typography>
                            <TextField
                              variant="standard"
                              size="small"
                              placeholder="태그입력"
                              value={newHashtag}
                              onChange={(e) => setNewHashtag(e.target.value)}
                              onKeyDown={handleAddHashtag}
                              InputProps={{
                                disableUnderline: true,
                                style: {
                                  fontSize: "12px",
                                  paddingTop: "3px",
                                },
                              }}
                            />
                          </Box>
                        )}
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <>
                {isAdmin ? (
                  <>
                    <Box
                      height={200}
                      display="flex"
                      flexDirection={"column"}
                      alignItems="center"
                      justifyContent="center"
                      // bgcolor="#d3d3d3"
                      border="1px solid #e0e0e0"
                      borderRadius={1}
                      minWidth="100%"
                      mt={1.3}
                    >
                      <ImageIcon
                        style={{ marginRight: "8px", color: "gray" }}
                      />
                      <Typography variant="body2" color="gray">
                        이미지 업로드는
                      </Typography>
                      <Typography variant="body2" color="gray">
                        최대 1MB까지 가능합니다.
                      </Typography>
                    </Box>
                    <Button
                      onClick={onAttWndClick2}
                      themeColor={"primary"}
                      style={{ margin: "10px 0" }}
                    >
                      이미지 업로드
                    </Button>
                    <input
                      id="uploadAttachment2"
                      style={{ display: "none" }}
                      type="file"
                      accept="image/*"
                      // ref={excelInput2}
                      onChange={(
                        event: React.ChangeEvent<HTMLInputElement>
                      ) => {
                        getAttachmentsData(event.target.files);
                      }}
                    />
                  </>
                ) : (
                  <Box
                    mt={2}
                    display="flex"
                    flexWrap="wrap"
                    minHeight="40px"
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      gap: "4px",
                    }}
                  >
                    {Information.tagnames
                      .filter((hashtag) => hashtag.rowstatus !== "D")
                      .slice(0, 5)
                      .map((hashtag, index) => (
                        <Chip
                          key={hashtag.seq}
                          label={"#" + hashtag.name}
                          onDelete={
                            isAdmin
                              ? () => handleDeleteHashtag(hashtag)
                              : undefined
                          }
                          style={{
                            color: "#7a76ce",
                            backgroundColor: "#f0ecfc",
                          }}
                        />
                      ))}
                    {Information.tagnames.filter(
                      (hashtag) => hashtag.rowstatus !== "D"
                    ).length < 5 &&
                      isAdmin && (
                        <Box
                          display="flex"
                          alignItems="center"
                          style={{
                            marginLeft:
                              Information.tagnames.length > 0 ? 10 : 0,
                            marginRight: "5px",
                          }}
                        >
                          <Typography
                            variant="body1"
                            color={"#a0a0a0"}
                            mr={0.2}
                          >
                            #
                          </Typography>
                          <TextField
                            variant="standard"
                            size="small"
                            placeholder="태그입력"
                            value={newHashtag}
                            onChange={(e) => setNewHashtag(e.target.value)}
                            onKeyDown={handleAddHashtag}
                            InputProps={{
                              disableUnderline: true,
                              style: {
                                fontSize: "12px",
                                paddingTop: "3px",
                              },
                            }}
                          />
                        </Box>
                      )}
                  </Box>
                )}
              </>
            )}
            <div style={{ flexGrow: 1 }} />
            {!isAdmin ? (
              <div style={{ width: "100%" }} className="ButtonContainer">
                <Button
                  themeColor={"primary"}
                  onClick={onLink}
                  style={{
                    width: "100%",
                    height: "40px",
                    // letterSpacing: "0.5em",
                    fontSize: "15px",
                  }}
                >
                  문의하기
                </Button>
              </div>
            ) : (
              <div
                style={{ width: "100%", display: "flex", gap: GAP }}
                className="ButtonContainer"
              >
                <Button
                  themeColor={"primary"}
                  onClick={onDelete}
                  fillMode={"outline"}
                  style={{
                    height: "40px",
                    fontSize: "15px",
                    flex: 1,
                  }}
                >
                  삭 제
                </Button>
                <Button
                  themeColor={"primary"}
                  onClick={onSave}
                  style={{
                    height: "40px",
                    fontSize: "15px",
                    flex: 1,
                  }}
                >
                  저 장
                </Button>
              </div>
            )}
          </GridContainer>
          <GridContainer
            width={`calc(62% - ${GAP}px)`}
            style={{ height: webheight }}
          >
            {isAdmin && (
              <Box display="flex">
                <CustomMultiColumnComboBox
                  name="type"
                  data={typesData}
                  value={
                    typesData.find(
                      (item) => item.sub_code === Information.type
                    ) || {}
                  }
                  columns={dataTypeColumns}
                  textField={"code_name"}
                  onChange={onComboBoxChange}
                  // filterable={true}
                  clearButton={false}
                  style={{ width: "170px", height: "35px", marginTop: "10px" }}
                />
                <CustomTextField
                  name="title"
                  type="text"
                  value={Information.title}
                  onChange={onInputChange}
                  className={!isAdmin ? "readonly" : "required"}
                  InputProps={{
                    sx: {
                      height: "35px",
                      margin: "10px 10px 10px 5px",
                      fontFamily: "Noto Sans KR",
                      fontSize: "15px",
                    },
                  }}
                  sx={{
                    marginRight: 1,
                    flex: 1,
                    backgroundColor: "white",
                  }}
                  disabled={!isAdmin}
                />
                {isAdmin && (
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <SmallCheckbox
                          checked={Information.isHot}
                          onChange={onInputChange}
                          name="isHot"
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "14px", marginLeft: 0 }}
                        >
                          HOT
                        </Typography>
                      }
                      sx={{ marginRight: 1.5 }}
                    />
                    <FormControlLabel
                      control={
                        <SmallCheckbox
                          checked={Information.isNew}
                          onChange={onInputChange}
                          name="isNew"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontSize: "14px" }}>
                          NEW
                        </Typography>
                      }
                      sx={{ marginRight: 0 }}
                    />
                  </FormGroup>
                )}
              </Box>
            )}
            <RichEditor id="editor" ref={editorRef} hideTools={!isAdmin} />
            {isAdmin && (
              <Box
                mt={2}
                display="flex"
                flexWrap="wrap"
                alignItems="center"
                minHeight="40px"
              >
                {Information.tagnames
                  .filter((hashtag) => hashtag.rowstatus !== "D")
                  .slice(0, 5)
                  .map((hashtag, index) => (
                    <Chip
                      key={hashtag.seq}
                      label={"#" + hashtag.name}
                      onDelete={
                        isAdmin ? () => handleDeleteHashtag(hashtag) : undefined
                      }
                      style={{
                        color: "#7a76ce",
                        backgroundColor: "#f0ecfc",
                        marginRight: "2px",
                      }}
                    />
                  ))}
                {Information.tagnames.filter(
                  (hashtag) => hashtag.rowstatus !== "D"
                ).length < 5 &&
                  isAdmin && (
                    <Box
                      display="flex"
                      alignItems="center"
                      style={{
                        marginLeft: Information.tagnames.length > 0 ? 10 : 0,
                        marginRight: "5px",
                      }}
                    >
                      <Typography variant="body1" color={"#a0a0a0"} mr={0.2}>
                        #
                      </Typography>
                      <TextField
                        variant="standard"
                        size="small"
                        placeholder="태그입력"
                        value={newHashtag}
                        onChange={(e) => setNewHashtag(e.target.value)}
                        onKeyDown={handleAddHashtag}
                        InputProps={{
                          disableUnderline: true,
                          style: {
                            fontSize: "12px",
                            paddingTop: "3px",
                          },
                        }}
                      />
                    </Box>
                  )}
              </Box>
            )}
          </GridContainer>
        </GridContainerWrap>
      )}
      {/* 이미지 원본 크기로 보기 */}
      {openDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", // 반투명 검은색 배경
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Dialog
            onClose={handleCloseDialog}
            style={{
              width: "auto",
              height: "auto",
              transform: "translate(-50%, -50%)", // translate를 사용해 정확히 중앙에 위치
              position: "fixed", // 고정된 위치로 설정
              top: positions.top,
              left: positions.left,
            }}
          >
            <img
              src={Information.image}
              alt="원본 이미지"
              style={{
                maxWidth: "90vw",
                maxHeight: "95vh",
                display: "block",
                margin: "0 auto",
              }}
              onClick={handleCloseDialog} // 이미지 클릭 시 다이얼로그 닫기
            />
            {/* <DialogActionsBar>
            <button className="k-button" onClick={handleCloseDialog}>
              닫기
            </button>
          </DialogActionsBar> */}
          </Dialog>
        </div>
      )}
    </Window>
  );
};

export default PromotionWindow;
