import { GridCellProps } from "@progress/kendo-react-grid";

const CenterCell = (props: GridCellProps) => {
  const {
    ariaColumnIndex,
    columnIndex,
    dataItem,
    field = "",
    className = "",
  } = props;
  return (
    <td
      style={{ textAlign: "center" }}
      aria-colindex={ariaColumnIndex}
      data-grid-col-index={columnIndex}
      className={className}
    >
      {dataItem[field]}
    </td>
  );
};

export default CenterCell;
