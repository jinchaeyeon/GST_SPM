import { GridCellProps } from "@progress/kendo-react-grid";

const CheckCell = (props: GridCellProps) => {
  const { ariaColumnIndex, columnIndex, dataItem, field = "" } = props;
  return (
    <td
      style={{ textAlign: "center" }}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
    >
      {dataItem[field] === "Y" ? (
        <div className="k-icon k-i-check-circle"></div>
      ) : (
        ""
      )}
    </td>
  );
};

export default CheckCell;
