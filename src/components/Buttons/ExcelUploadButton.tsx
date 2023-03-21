import { Button } from "@progress/kendo-react-buttons";
import React, { useRef } from "react";
import { TPermissions } from "../../store/types";
import * as xlsx from "xlsx";

interface IStyle {
  marginLeft?: string;
}
interface IExcelUploadButton {
  saveExcel: (para: any[]) => void;
  permissions: TPermissions;
  style: IStyle;
}

const ExcelUploadButton = ({
  saveExcel,
  permissions,
  style,
}: IExcelUploadButton) => {
  const excelInput: any = useRef();

  const excelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target == null) return false;
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = xlsx.utils.sheet_to_json(worksheet);

        saveExcel(json);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  };

  const upload = () => {
    const uploadInput = document.getElementById("upload");
    uploadInput!.click();
  };

  return (
    <Button
      onClick={upload}
      themeColor={"primary"}
      fillMode={"outline"}
      icon={"upload"}
      style={style}
      disabled={permissions.save ? false : true}
    >
      엑셀업로드
      <input
        id="upload"
        style={{ display: "none" }}
        type="file"
        accept=".xls,.xlsx"
        ref={excelInput}
        onChange={excelUpload}
      />
    </Button>
  );
};

export default ExcelUploadButton;
