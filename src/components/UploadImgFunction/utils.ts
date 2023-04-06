import { EditorUtils } from "@progress/kendo-react-editor";
import { TInsertImageFiles } from "../../store/types";

export const insertImageFiles = ({
  view,
  files = [],
  nodeType,
  position = "",
  attrs = {},
}: TInsertImageFiles) => {
  if (EditorUtils.canInsert(view.state, nodeType)) {
    files.forEach((file: any) => {
      let reader = new FileReader();
      reader.onload = function (e: any) {
        const image = nodeType.createAndFill({
          ...attrs,
          src: e.target.result,
        });
        if (position) {
          view.dispatch(view.state.tr.insert(position.pos, image));
        } else {
          EditorUtils.insertNode(view, image, true);
        }
      };
      reader.readAsDataURL(file);
    });
  }
};
