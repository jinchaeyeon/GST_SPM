import { useEffect, useState, useCallback, useRef } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  LandscapePrint,
  MainWorkStartEndContainer,
} from "../../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { IWindowPosition } from "../../hooks/interfaces";
import { Barcode } from "@progress/kendo-react-barcodes";
import {
  Grid,
  GridColumn,
  GridCellProps,
  GridDataStateChangeEvent,
} from "@progress/kendo-react-grid";
import { DataResult, getter, process, State } from "@progress/kendo-data-query";
import ReactToPrint from "react-to-print";
import { useApi } from "../../hooks/api";
import { Iparameters } from "../../store/types";
import { TabStripNavigation } from "@progress/kendo-react-layout";

type barcode = {
  barcode: string;
  chk: string;
  custnm: string;
  itemcd: string;
  itemnm: string;
  insiz: string;
  lotnum: string;
  ordkey: string;
  project: string;
  qty: string;
};

type IWindow = {
  data: barcode[];
  setVisible(t: boolean): void;
  total: number;
};

const CopyWindow = ({ setVisible, data, total }: IWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 800,
    height: 900,
  });

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
  const componentRef = useRef(null);
  const processApi = useApi();
  const [mainDataState, setMainDataState] = useState<State>({
    sort: [],
  });
  const [mainDataResult, setMainDataResult] = useState<DataResult>(
    process([], mainDataState)
  );
  const [barcodeFilters, setBarCodeFilters] = useState({
    pgSize: 20,
    lotnum_s: "",
    prntqty_s: "",
  });

  const BarCodeParameters: Iparameters = {
    procedureName: "P_PR_A5000W_Q",
    pageNumber: 1,
    pageSize: barcodeFilters.pgSize,
    parameters: {
      "@p_work_type": "BARCODE",
      "@p_orgdiv": "01",
      "@p_location": "",
      "@p_person": "",
      "@p_frdt": "",
      "@p_todt": "",
      "@p_finyn": "",
      "@p_lotnum_s": barcodeFilters.lotnum_s,
      "@p_prntqty_s": barcodeFilters.prntqty_s,
      "@p_company_code": "2207A046",
    },
  };

  const fetchBarcordGrid = async () => {
    let data: any;
    try {
      data = await processApi<any>("procedure", BarCodeParameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
        const totalRowCnt = data.tables[0].RowCount;
        const rows = data.tables[0].Rows;

        if (totalRowCnt > 0)
          setMainDataResult((prev) => {
            return {
              data: [...prev.data, rows],
              total: totalRowCnt,
            };
          });
    }  
  };

  useEffect(() => {
    fetchBarcordGrid();
  }, [barcodeFilters]);

  useEffect(() => {
    let lotnum: any = [];
    let prntqty: any = [];
    data.map((item: any) => {
      lotnum.push(item.makey);
      prntqty.push(String(item.prntqty));
    });
    setBarCodeFilters({
      pgSize: 20,
      lotnum_s: lotnum.join("|"),
      prntqty_s: prntqty.join("|"),
    });
  }, []);

  React.useEffect(() => {
    if (total > 2) {
      setPosition((prev: any) => ({
        left: 300,
        top: 100,
        width: 800,
        height: 900,
      }));
    } else if (total > 1) {
      setPosition((prev: any) => ({
        left: 300,
        top: 100,
        width: 800,
        height: 720,
      }));
    } else {
      setPosition((prev: any) => ({
        left: 300,
        top: 100,
        width: 800,
        height: 500,
      }));
    }
  }, []);

  return (
    <>
      <Window
        title={"바코드 출력"}
        width={position.width}
        height={position.height}
        onMove={handleMove}
        onResize={handleResize}
        onClose={onClose}
      >
        <ButtonContainer>
          <ReactToPrint
            trigger={() => (
              <Button fillMode="outline" themeColor={"primary"} icon="print">
                출력
              </Button>
            )}
            content={() => componentRef.current}
          />
        </ButtonContainer>
        <div id="BarcodePrint" className="printable barcode" ref={componentRef}>
          {mainDataResult.data[0] != null &&
            mainDataResult.data[0].map((item: any) => (
              <div key={item.ordkey} style={{ marginBottom: "10px" }}>
                <table style={{ width: "650px" }}>
                  <tbody>
                    <tr>
                      <th>품명</th>
                      <td colSpan={2}>{item.itemnm}</td>
                    </tr>
                    <tr>
                      <th>규격</th>
                      <td colSpan={2}>{item.insiz}</td>
                    </tr>
                    <tr>
                      <th>LOT NO</th>
                      <td>{item.lotnum}</td>
                      <td>{item.qty}</td>
                    </tr>
                    <tr>
                      <th></th>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                <table style={{ width: "650px" }}>
                  <tbody>
                    <tr>
                      <th>바코드</th>
                    </tr>
                    <tr>
                      <td>
                        <Barcode
                          type="Code128"
                          width={630}
                          value={item.barcode}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
        </div>
        <BottomContainer>
          <ButtonContainer>
            <Button
              themeColor={"primary"}
              fillMode={"outline"}
              onClick={onClose}
            >
              닫기
            </Button>
          </ButtonContainer>
        </BottomContainer>
      </Window>
    </>
  );
};
export default CopyWindow;
