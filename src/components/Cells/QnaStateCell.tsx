import { GridCellProps } from "@progress/kendo-react-grid";
import { StatusIcon } from "../../CommonStyled";

const QnAStateCell = (props: GridCellProps) => {
  const { ariaColumnIndex, columnIndex, dataItem, field = "" } = props;
  return (
    <td
      style={{ textAlign: "left" }}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <StatusIcon status={dataItem[field]} />{" "}
        {dataItem[field] === "N"
          ? "대기"
          : dataItem[field] === "R"
          ? "진행중"
          : dataItem[field] === "Y"
          ? "완료"
          : "보류"}
      </div>
    </td>
  );
};

export default QnAStateCell;
