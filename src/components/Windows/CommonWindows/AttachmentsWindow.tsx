import { useEffect, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  Grid,
  GridColumn,
  GridHeaderCellProps,
  GridHeaderSelectionChangeEvent,
  GridItemChangeEvent,
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
  UseParaPc,
  convertDateToStrWithTime2,
  convertDateToStrWithTime3,
  extractDownloadFilename,
  getGridItemChangedData,
} from "../../CommonFunction";
import { EDIT_FIELD, SELECTED_FIELD } from "../../CommonString";
import { useLocation } from "react-router-dom";
import { TAttachmentType } from "../../../store/types";
import { isLoading, loginResultState } from "../../../store/atoms";
import { useRecoilState, useSetRecoilState } from "recoil";
import CheckBoxCell from "../../Cells/CheckBoxCell";
import { CellRender, RowRender } from "../../Renderers/Renderers";
import { Checkbox } from "@progress/kendo-react-inputs";
import CheckBoxReadOnlyCell from "../../Cells/CheckBoxReadOnlyCell";

type permission = {
  upload: boolean;
  download: boolean;
  delete: boolean;
};

type IKendoWindow = {
  type: TAttachmentType;
  setVisible(arg: boolean): void;
  setData?(
    data: object,
    fileList?: FileList | any[],
    savenmList?: string[]
  ): void;
  para: string;
  fileLists?: FileList | any[];
  savenmLists?: string[];
  permission?: permission;
  modal?: boolean;
};

const DATA_ITEM_KEY = "idx";
let idx = 0;
const KendoWindow = ({
  type,
  setVisible,
  setData,
  para = "",
  permission,
  fileLists = [],
  savenmLists = []
}: IKendoWindow) => {
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 1200;
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: isMobile == true ? deviceWidth : 1200,
    height: 800,
  });
  const [loginResult] = useRecoilState(loginResultState);
  const userId = loginResult ? loginResult.userId : "";
  const username = loginResult ? loginResult.userName : "";
  const [pc, setPc] = useState("");
  UseParaPc(setPc);
  const setLoading = useSetRecoilState(isLoading);
  const [attachmentNumber, setAttachmentNumber] = useState(para);
  const [fileList, setFileList] = useState<FileList | any[]>([]);
  const [savenmList, setSavenmList] = useState<string[]>([]);
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");

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
    if (setData) {
      if (fileList) {
        if (savenmList) {
          setData(mainDataResult.data, fileList, savenmList);
        } else {
          setData(mainDataResult.data, fileList);
        }
      } else {
        if (savenmList) {
          setData(mainDataResult.data, [], savenmList);
        } else {
          setData(mainDataResult.data);
        }
      }
    }
    setVisible(false);
  };

  const processApi = useApi();
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], {})
  );

  useEffect(() => {
    fetchGrid();
  }, []);

  //그리드 조회
  const fetchGrid = async () => {
    let data: any;

    if (attachmentNumber === "") {
      if(fileLists.length != 0) {
        for (var i = 0; i < fileLists.length; i++) {
          const newData = {
            attdatnum: !attachmentNumber ? "" : attachmentNumber,
            filesize: fileLists[i].size,
            realnm: fileLists[i].name,
            user_name: username,
            insert_user_id: userId,
            insert_pc: pc,
            insert_time: convertDateToStrWithTime3(new Date()),
            rowstatus: "N",
            idx: idx++,
          };
          setMainDataResult((prev) => ({
            data: [...prev.data, newData],
            total: prev.total + 1,
          }));
          setFileList(fileLists);
        }
      }
    } else {
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
          const rows = data.tables[0].Rows.map((item: any) => ({
            ...item,
            idx: idx++,
            rowstatus: "U",
          }));
  
          if (savenmLists.length != 0) {
            const newData = rows.filter(
              (item: { savenm: string }) =>
                savenmLists.includes(item.savenm) != true
            );
  
            setMainDataResult((prev) => ({
              data: newData,
              total: newData.length,
            }));
            setSavenmList(savenmLists);
          } else {
            setMainDataResult((prev) => {
              return {
                data: rows,
                total: totalRowCnt,
              };
            });
          }
  
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
        if(fileLists.length != 0) {
          for (var i = 0; i < fileLists.length; i++) {
            const newData = {
              attdatnum: !attachmentNumber ? "" : attachmentNumber,
              filesize: fileLists[i].size,
              realnm: fileLists[i].name,
              user_name: username,
              insert_user_id: userId,
              insert_pc: pc,
              insert_time: convertDateToStrWithTime3(new Date()),
              rowstatus: "N",
              idx: idx++,
            };
            setMainDataResult((prev) => ({
              data: [...prev.data, newData],
              total: prev.total + 1,
            }));
            setFileList(fileLists);
          }
        }
      }
    }
  };

  const excelInput: any = React.useRef();

  const upload = () => {
    const uploadInput = document.getElementById("uploadAttachment");
    uploadInput!.click();
  };

  const downloadFiles = async () => {
    const parameters = mainDataResult.data.filter((item) => item.chk == true);

    if (parameters.length === 0) {
      alert("선택된 자료가 없습니다.");
      return false;
    }

    let valid = true;
    parameters.map((item: any) => {
      if (item.rowstatus == "N") {
        valid = false;
      }
    });

    if (valid != true) {
      alert("추가된 행은 다운로드가 불가능합니다.");
      return false;
    }

    setLoading(true);

    let response: any;

    parameters.forEach(async (parameter: any) => {
      try {
        response = await processApi<any>("file-download", {
          attached: parameter.savenm,
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
    const parameters = mainDataResult.data.filter((item) => item.chk == true);

    if (parameters.length === 0) {
      alert("선택된 자료가 없습니다.");
      return false;
    }

    let valid = true;
    parameters.map((item: any) => {
      if (item.rowstatus == "N") {
        valid = false;
      }
    });

    if (valid != true) {
      alert("추가된 행은 삭제가 불가능합니다.");
      return false;
    }

    if (!window.confirm("삭제하시겠습니까?")) {
      return false;
    }

    parameters.map((item: any) => {
      setSavenmList((prev) => ([...prev, ...[item.savenm]]));
    });

    const newData = mainDataResult.data.filter((item) => item.chk != true)
    
    setMainDataResult({
      data: newData,
      total: newData.length,
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

  const handleFileUpload = async (files: FileList | null) => {
    if (files === null) return false;
    for (var i = 0; i < files.length; i++) {
      const newData = {
        attdatnum: !attachmentNumber ? "" : attachmentNumber,
        filesize: files[i].size,
        realnm: files[i].name,
        user_name: username,
        insert_user_id: userId,
        insert_pc: pc,
        insert_time: convertDateToStrWithTime3(new Date()),
        rowstatus: "N",
        idx: idx++,
      };
      setMainDataResult((prev) => ({
        data: [...prev.data, newData],
        total: prev.total + 1,
      }));
    }
    setFileList((prev) => [
      ...prev,
      ...files
    ])
  };

  const onMainItemChange = (event: GridItemChangeEvent) => {
    getGridItemChangedData(
      event,
      mainDataResult,
      setMainDataResult,
      DATA_ITEM_KEY
    );
  };

  const customCellRender = (td: any, props: any) => (
    <CellRender
      originalProps={props}
      td={td}
      enterEdit={enterEdit}
      editField={EDIT_FIELD}
    />
  );

  const customRowRender = (tr: any, props: any) => (
    <RowRender
      originalProps={props}
      tr={tr}
      exitEdit={exitEdit}
      editField={EDIT_FIELD}
    />
  );

  const enterEdit = (dataItem: any, field: string) => {
    if (field == "chk") {
      const newData = mainDataResult.data.map((item) =>
        item[DATA_ITEM_KEY] == dataItem[DATA_ITEM_KEY]
          ? {
              ...item,
              chk : !item.chk,
              [EDIT_FIELD]: field,
            }
          : {
              ...item,
              [EDIT_FIELD]: undefined,
            }
      );
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    }
  };

  const exitEdit = () => {
    const newData = mainDataResult.data.map((item: any) => ({
      ...item,
      [EDIT_FIELD]: undefined,
    }));
    setMainDataResult((prev: { total: any }) => {
      return {
        data: newData,
        total: prev.total,
      };
    });
  };

  
  const [values2, setValues2] = React.useState<boolean>(false);
  const CustomCheckBoxCell2 = (props: GridHeaderCellProps) => {
    function changeCheck(){
      const newData = mainDataResult.data.map((item) => ({
        ...item,
        chk: !values2,
      }));
      setValues2(!values2);
      setMainDataResult((prev) => {
        return {
          data: newData,
          total: prev.total,
        };
      });
    };

    return (
      <div style={{ textAlign: "center" }}>
        <Checkbox value={values2} onClick={changeCheck}></Checkbox>
      </div>
    );
  };


  return (
    <Window
      title={"파일첨부관리"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={true}
    >
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
      {(!permission || (permission && permission.upload)) && (
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
              ? "490px"
              : "600px",
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
        onItemChange={onMainItemChange}
        cellRender={customCellRender}
        rowRender={customRowRender}
        editField={EDIT_FIELD}
      >
          <GridColumn
            field="chk"
            title=" "
            width="45px"
            headerCell={CustomCheckBoxCell2}
            cell={CheckBoxCell}
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
    </Window>
  );
};

export default KendoWindow;
