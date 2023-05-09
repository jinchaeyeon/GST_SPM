import { GridCellProps } from "@progress/kendo-react-grid";
import { StatusIcon } from "../../CommonStyled";

const QnaStateCell = (props: GridCellProps) => {
  const { ariaColumnIndex, columnIndex, dataItem, field = "" } = props;
  return (
    <td
      style={{ textAlign: "left", display: "flex", alignItems: "center" }}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
    >
      <StatusIcon status={dataItem[field]} />{" "}
      {dataItem[field] === "N"
        ? "대기"
        : dataItem[field] === "R"
        ? "진행중"
        : dataItem[field] === "Y"
        ? "완료"
        : "보류"}
    </td>
  );
};

export default QnaStateCell;
