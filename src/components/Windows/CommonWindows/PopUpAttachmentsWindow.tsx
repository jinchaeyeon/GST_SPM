import { useEffect, useState } from "react";
import * as React from "react";
import {
  Grid,
  GridColumn,
  GridHeaderSelectionChangeEvent,
  GridSelectionChangeEvent,
  getSelectedState,
} from "@progress/kendo-react-grid";
import { DataResult, process, getter } from "@progress/kendo-data-query";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  TitleContainer,
} from "../../../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { IAttachmentData, IWindowPosition } from "../../../hooks/interfaces";
import NumberCell from "../../Cells/NumberCell";
import CenterCell from "../../Cells/CenterCell";
import {
  convertDateToStrWithTime2,
  extractDownloadFilename,
} from "../../CommonFunction";
import { SELECTED_FIELD } from "../../CommonString";
import { useLocation } from "react-router-dom";
import { TAttachmentType } from "../../../store/types";
import { isLoading } from "../../../store/atoms";
import { useSetRecoilState } from "recoil";
import Dialog from "@mui/material/Dialog";
import { DialogContent, DialogTitle } from "@mui/material";
import Paper, { PaperProps } from "@mui/material/Paper";
import Draggable from "react-draggable";

type permission = {
  upload: boolean;
  download: boolean;
  delete: boolean;
};

type IKendoWindow = {
  type: TAttachmentType;
  setVisible(arg: boolean): void;
  setData?(data: object): void;
  para: string;
  permission?: permission;
};

const DATA_ITEM_KEY = "savenm";

function PaperComponent(props: PaperProps) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

const KendoWindow = ({
  type,
  setVisible,
  setData,
  para = "",
  permission,
}: IKendoWindow) => {
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 768;
  const [position, setPosition] = useState<IWindowPosition>({
    left: isMobile == true ? 0 : 350,
    top: isMobile == true ? 0 : 50,
    width: isMobile == true ? deviceWidth : 1200,
    height: isMobile == true ? window.innerHeight : 800,
  });

  const setLoading = useSetRecoilState(isLoading);
  const [attachmentNumber, setAttachmentNumber] = useState(para);

  const location = useLocation();
  const pathname = location.pathname.replace("/", "");

  const onClose = () => {
    setVisible(false);
  };

  const processApi = useApi();
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], {})
  );

  useEffect(() => {
    fetchGrid();
  }, [attachmentNumber]);

  const uploadFile = async (files: File, newAttachmentNumber?: string) => {
    let data: any;

    const queryParams = new URLSearchParams();

    if (attachmentNumber) {
      queryParams.append("attachmentNumber", attachmentNumber);
    } else if (newAttachmentNumber) {
      queryParams.append("attachmentNumber", newAttachmentNumber);
    }

    queryParams.append("type", type);
    queryParams.append("formId", "%28web%29" + pathname);

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

  //그리드 조회
  const fetchGrid = async () => {
    let data: any;

    if (attachmentNumber === "") return false;
    const parameters = {
      attached: "list?type=" + type + "&attachmentNumber=" + attachmentNumber,
    };

    try {
      data = await processApi<any>("file-list", parameters);
    } catch (error) {
      data = null;
    }

    let result: IAttachmentData = {
      attdatnum: "",
      original_name: "",
      rowCount: 0,
    };

    if (data !== null) {
      const totalRowCnt = data.tables[0].RowCount;

      if (totalRowCnt > 0) {
        const rows = data.tables[0].Rows;

        setMainDataResult((prev) => {
          return {
            data: [...rows],
            total: totalRowCnt,
          };
        });

        result = {
          attdatnum: rows[0].attdatnum,
          original_name: rows[0].realnm,
          rowCount: totalRowCnt,
        };
      } else {
        setMainDataResult((prev) => {
          return {
            data: [],
            total: 0,
          };
        });

        result = {
          attdatnum: attachmentNumber,
          original_name: "",
          rowCount: 0,
        };
      }
    }
    if (setData) {
      setData(result);
    }
  };

  const excelInput: any = React.useRef();

  const upload = () => {
    const uploadInput = document.getElementById("uploadAttachment");
    uploadInput!.click();
  };

  const downloadFiles = async () => {
    const parameters = Object.keys(selectedState).filter(
      (key) => selectedState[key] === true
    );

    if (parameters.length === 0) {
      alert("선택된 자료가 없습니다.");
      return false;
    }

    setLoading(true);

    let response: any;

    parameters.forEach(async (parameter) => {
      try {
        response = await processApi<any>("file-download", {
          attached: parameter,
          type,
        });
      } catch (error) {
        response = null;
      }

      if (response !== null) {
        const blob = new Blob([response.data]);
        // 특정 타입을 정의해야 경우에는 옵션을 사용해 MIME 유형을 정의 할 수 있습니다.
        // const blob = new Blob([this.content], {type: 'text/plain'})

        // blob을 사용해 객체 URL을 생성합니다.
        const fileObjectUrl = window.URL.createObjectURL(blob);

        // blob 객체 URL을 설정할 링크를 만듭니다.
        const link = document.createElement("a");
        link.href = fileObjectUrl;
        link.style.display = "none";

        // 다운로드 파일 이름을 지정 할 수 있습니다.
        // 일반적으로 서버에서 전달해준 파일 이름은 응답 Header의 Content-Disposition에 설정됩니다.
        link.download = extractDownloadFilename(response);

        // 링크를 body에 추가하고 강제로 click 이벤트를 발생시켜 파일 다운로드를 실행시킵니다.
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 다운로드가 끝난 리소스(객체 URL)를 해제합니다
      }
      setLoading(false);
    });
  };

  const deleteFiles = () => {
    const parameters = Object.keys(selectedState).filter(
      (key) => selectedState[key] === true
    );

    if (parameters.length === 0) {
      alert("선택된 자료가 없습니다.");
      return false;
    }

    if (!window.confirm("삭제하시겠습니까?")) {
      return false;
    }
    let data: any;

    parameters.forEach(async (parameter) => {
      try {
        data = await processApi<any>("file-delete", {
          type,
          attached: parameter,
        });
      } catch (error) {
        data = null;
      }

      if (data !== null) {
        fetchGrid();
      } else {
        alert("처리 중 오류가 발생하였습니다.");
      }
    });
  };

  const idGetter = getter(DATA_ITEM_KEY);
  const [selectedState, setSelectedState] = useState<{
    [id: string]: boolean | number[];
  }>({});

  const onSelectionChange = React.useCallback(
    (event: GridSelectionChangeEvent) => {
      const newSelectedState = getSelectedState({
        event,
        selectedState: selectedState,
        dataItemKey: DATA_ITEM_KEY,
      });

      setSelectedState(newSelectedState);
    },
    [selectedState]
  );

  const onHeaderSelectionChange = React.useCallback(
    (event: GridHeaderSelectionChangeEvent) => {
      const checkboxElement: any = event.syntheticEvent.target;
      const checked = checkboxElement.checked;
      const newSelectedState: {
        [id: string]: boolean | number[];
      } = {};

      event.dataItems.forEach((item) => {
        newSelectedState[idGetter(item)] = checked;
      });

      setSelectedState(newSelectedState);
    },
    []
  );

  const handleFileUpload = async (files: FileList | null) => {
    if (files === null) return false;

    let newAttachmentNumber = "";
    const promises = [];

    for (const file of files) {
      // 최초 등록 시, 업로드 후 첨부번호를 가져옴 (다중 업로드 대응)
      if (!attachmentNumber && !newAttachmentNumber) {
        newAttachmentNumber = await uploadFile(file);
        const promise = newAttachmentNumber;
        promises.push(promise);
        continue;
      }

      const promise = newAttachmentNumber
        ? await uploadFile(file, newAttachmentNumber)
        : await uploadFile(file);
      promises.push(promise);
    }

    const results = await Promise.all(promises);

    // 실패한 파일이 있는지 확인
    if (results.includes(null)) {
      alert("파일 업로드에 실패했습니다.");
    } else {
      // 모든 파일이 성공적으로 업로드된 경우
      if (!attachmentNumber) {
        setAttachmentNumber(newAttachmentNumber);
      } else {
        fetchGrid();
      }
    }
  };

  return (
    <Dialog
      onClose={onClose}
      open={true}
      PaperComponent={PaperComponent}
      maxWidth="lg"
      style={{
        zIndex: 1000000000,
        width: position.width,
        height: position.height,
        top: position.top,
        left: position.left,
      }}
    >
      <DialogTitle>파일 첨부 관리</DialogTitle>
      <DialogContent>
        <TitleContainer>
          <ButtonContainer>
            <Button
              onClick={upload}
              themeColor={"primary"}
              fillMode={"outline"}
              icon={"upload"}
              disabled={
                permission != undefined
                  ? permission.upload == true
                    ? false
                    : true
                  : false
              }
            >
              업로드
              <input
                id="uploadAttachment"
                style={{ display: "none" }}
                type="file"
                multiple
                ref={excelInput}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  handleFileUpload(event.target.files);
                }}
              />
            </Button>
            <Button
              onClick={downloadFiles}
              themeColor={"primary"}
              fillMode={"outline"}
              icon={"download"}
              disabled={
                permission != undefined
                  ? permission.download == true
                    ? false
                    : true
                  : false
              }
            >
              다운로드
            </Button>
            <Button
              onClick={deleteFiles}
              themeColor={"primary"}
              fillMode={"outline"}
              icon={"delete"}
              disabled={
                permission != undefined
                  ? permission.delete == true
                    ? false
                    : true
                  : false
              }
            >
              삭제
            </Button>
          </ButtonContainer>
        </TitleContainer>
        {isMobile
          ? ""
          : (!permission || (permission && permission.upload)) && (
              <div
                onDrop={(event: React.DragEvent<HTMLInputElement>) => {
                  event.preventDefault();
                  const files = event.dataTransfer.files;
                  handleFileUpload(files);
                }}
                onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                }}
                style={{
                  width: "100% ",
                  lineHeight: "100px",
                  border: "solid 1px rgba(0, 0, 0, 0.08)",
                  marginBottom: "5px",
                  textAlign: "center",
                  color: "rgba(0,0,0,0.8)",
                }}
              >
                <span
                  className="k-icon k-i-file-add"
                  style={{ marginRight: "5px" }}
                ></span>
                업로드할 파일을 마우스로 끌어오세요.
              </div>
            )}
        <Grid
          style={{
            height:
              !permission || (permission && permission.upload)
                ? "390px"
                : "500px",
          }}
          data={process(
            mainDataResult.data.map((row) => ({
              ...row,
              insert_time: convertDateToStrWithTime2(new Date(row.insert_time)),
              [SELECTED_FIELD]: selectedState[idGetter(row)],
            })),
            {}
          )}
          sortable={true}
          groupable={false}
          reorderable={true}
          //onDataStateChange={dataStateChange}
          fixedScroll={true}
          total={mainDataResult.total}
          //onScroll={scrollHandler}
          selectedField={SELECTED_FIELD}
          selectable={{
            enabled: true,
            drag: false,
            cell: false,
            mode: "multiple",
          }}
          onSelectionChange={onSelectionChange}
          onHeaderSelectionChange={onHeaderSelectionChange}
        >
          <GridColumn
            field={SELECTED_FIELD}
            width="45px"
            headerSelectionValue={
              mainDataResult.data.findIndex(
                (item: any) => !selectedState[idGetter(item)]
              ) === -1
            }
          />
          <GridColumn field="realnm" title="파일명" width="600" />
          <GridColumn
            field="filesize"
            title="파일SIZE (byte)"
            width="150"
            cell={NumberCell}
          />
          <GridColumn
            field="user_name"
            title="등록자"
            cell={CenterCell}
            width="150"
          />
          <GridColumn
            field="insert_time"
            title="등록일자"
            width="200"
            cell={CenterCell}
          />
        </Grid>
        <p>※ 최대 파일 크기 (400MB)</p>
        <BottomContainer>
          <ButtonContainer>
            <Button themeColor={"primary"} onClick={onClose}>
              확인
            </Button>
          </ButtonContainer>
        </BottomContainer>
      </DialogContent>
    </Dialog>
  );
};

export default KendoWindow;
