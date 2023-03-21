import { useEffect, useState, useCallback, useRef } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import {
  BottomContainer,
  ButtonContainer,
  GridContainer,
  LandscapePrint,
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

type barcode = {
  barcode: string;
  custnm: string;
  indt: string;
  insiz: string;
  itemacnt: string;
  itemnm: string;
  lotnum: string;
  qty: string;
};
type IWindow = {
  data: barcode;
  setVisible(t: boolean): void;
};

const CopyWindow = ({ setVisible, data }: IWindow) => {
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: 800,
    height: 470,
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
          <table style={{ width: "650px" }}>
            <tbody>
              <tr>
                <th>입고일자</th>
                <td>{data.indt}</td>
                <th>품목계정</th>
                <td>{data.itemacnt}</td>
              </tr>
              <tr>
                <th>품명</th>
                <td colSpan={3}>{data.itemnm}</td>
              </tr>
              <tr>
                <th>규격</th>
                <td>{data.insiz}</td>
                <th>수량</th>
                <td>{data.qty}</td>
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
                  <Barcode type="Code128" width={630} value={data.barcode} />
                </td>
              </tr>
            </tbody>
          </table>
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
