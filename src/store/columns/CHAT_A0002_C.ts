import {
  TreeListColumnProps,
  TreeListSelectionCell,
  TreeListTextEditor,
} from "@progress/kendo-react-treelist";
import NameTreeListCell from "../../components/Cells/NameTreeListCell";

export const columns: TreeListColumnProps[] = [
  {
    title: " ",
    field: "selected",
    width: "1px",
    // headerSelectionValue: headerSelectionValue(
    //   state.data.slice(),
    //   selectedState
    // ),
    cell: TreeListSelectionCell,
    //headerCell: TreeListHeaderSelectionCell, // 헤더 체크박스 버그 있음
  },
  {
    field: "rowstatus",
    title: " ",
    width: "1px",
    expandable: true,
  },
  {
    field: "question",
    title: "질문",
    width: "350px",
    cell: NameTreeListCell,
    className: "editable-new-only",
  },
  {
    field: "answer",
    title: "답변",
    width: "350px",
    editCell: TreeListTextEditor,
  },
];
