import { useEffect, useState } from "react";
import * as React from "react";
import { Window, WindowMoveEvent } from "@progress/kendo-react-dialogs";
import { useApi } from "../../../hooks/api";
import {
  BottomContainer,
  ButtonContainer,
  FormBox,
  FormBoxWrap,
} from "../../../CommonStyled";
import { Button } from "@progress/kendo-react-buttons";
import { UseParaPc, UseGetValueFromSessionItem } from "../../CommonFunction";
import { IWindowPosition } from "../../../hooks/interfaces";
import { useRecoilState, useSetRecoilState } from "recoil";
import { isLoading, loginResultState } from "../../../store/atoms";
import { Input } from "@progress/kendo-react-inputs";

let deletedMainRows: any[] = [];

interface IAnswer {
  accpdt: string;
  answer_attdatnum: string;
  answer_document_id: string;
  answer_files: string;
  attach_exists: string;
  attdatnum: string;
  contents: string;
  custcd: string;
  custnm: string;
  custperson: string;
  docunum: string;
  exphh: number;
  expmm: number;
  files: string;
  findt: string;
  finexpdt: string;
  finyn: string;
  groupcd: string;
  indicator: string;
  insert_pc: string;
  insert_time: string;
  insert_userid: string;
  is_finished: string;
  meeting_attach_exists: string;
  meeting_attdatnum: string;
  meeting_client_finexpdt: string;
  meeting_client_name: string;
  meeting_contents: string;
  meeting_custnm: string;
  meeting_date: string;
  meeting_document_id: string;
  meeting_files: string;
  meeting_finexpdt: string;
  meeting_remark: string;
  meeting_reqdt: string;
  meeting_title: string;
  orgdiv: string;
  person: string;
  progress_status: string;
  recdt: string;
  reception_attdatnum: string;
  reception_document_id: string;
  reception_files: string;
  reception_title: string;
  reception_type: string;
  ref_key: string;
  ref_number: string;
  ref_seq: number;
  ref_type: string;
  ref_type_full: string;
  remark: string;
  update_pc: string;
  update_time: string;
  update_userid: string;
  value_code3: string;
}

type IWindow = {
  setVisible(t: boolean): void;
  para: IAnswer;
};

const SignWindow = ({ setVisible, para }: IWindow) => {
  console.log(para);
  const setLoading = useSetRecoilState(isLoading);
  const [pc, setPc] = useState("");
  const userId = UseGetValueFromSessionItem("user_id");
  UseParaPc(setPc);
  const pathname: string = window.location.pathname.replace("/", "");

  const [loginResult] = useRecoilState(loginResultState);
  const role = loginResult ? loginResult.role : "";
  let deviceWidth = window.innerWidth;
  let isMobile = deviceWidth <= 768;
  const [position, setPosition] = useState<IWindowPosition>({
    left: 300,
    top: 100,
    width: isMobile == true ? deviceWidth : 1050,
    height: 800,
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
    deletedMainRows = [];
    setVisible(false);
  };

  const processApi = useApi();

  useEffect(() => {
    if (para != null && para != undefined) {
      setInformation({
        accpdt: para.accpdt,
        answer_attdatnum: para.answer_attdatnum,
        answer_document_id: para.answer_document_id,
        answer_files: para.answer_files,
        attach_exists: para.attach_exists,
        attdatnum: para.attdatnum,
        contents: para.contents,
        custcd: para.custcd,
        custnm: para.custnm,
        custperson: para.custperson,
        docunum: para.docunum,
        exphh: para.exphh,
        expmm: para.expmm,
        files: para.files,
        findt: para.findt,
        finexpdt: para.finexpdt,
        finyn: para.finyn,
        groupcd: para.groupcd,
        indicator: para.indicator,
        insert_pc: para.insert_pc,
        insert_time: para.insert_time,
        insert_userid: para.insert_userid,
        is_finished: para.is_finished,
        meeting_attach_exists: para.meeting_attach_exists,
        meeting_attdatnum: para.meeting_attdatnum,
        meeting_client_finexpdt: para.meeting_client_finexpdt,
        meeting_client_name: para.meeting_client_name,
        meeting_contents: para.meeting_contents,
        meeting_custnm: para.meeting_custnm,
        meeting_date: para.meeting_date,
        meeting_document_id: para.meeting_document_id,
        meeting_files: para.meeting_files,
        meeting_finexpdt: para.meeting_finexpdt,
        meeting_remark: para.meeting_remark,
        meeting_reqdt: para.meeting_reqdt,
        meeting_title: para.meeting_title,
        orgdiv: para.orgdiv,
        person: para.person,
        progress_status: para.progress_status,
        recdt: para.recdt,
        reception_attdatnum: para.reception_attdatnum,
        reception_document_id: para.reception_document_id,
        reception_files: para.reception_files,
        reception_title: para.reception_title,
        reception_type: para.reception_type,
        ref_key: para.ref_key,
        ref_number: para.ref_number,
        ref_seq: para.ref_seq,
        ref_type: para.ref_type,
        ref_type_full: para.ref_type_full,
        remark: para.remark,
        update_pc: para.update_pc,
        update_time: para.update_time,
        update_userid: para.update_userid,
        value_code3: para.value_code3,
      });
    }
  }, [para]);

  const [Information, setInformation] = useState<{ [name: string]: any }>({
    accpdt: "",
    answer_attdatnum: "",
    answer_document_id: "",
    answer_files: "",
    attach_exists: "",
    attdatnum: "",
    contents: "",
    custcd: "",
    custnm: "",
    custperson: "",
    docunum: "",
    exphh: 0,
    expmm: 0,
    files: "",
    findt: "",
    finexpdt: "",
    finyn: "",
    groupcd: "",
    indicator: "",
    insert_pc: "",
    insert_time: "",
    insert_userid: "",
    is_finished: "",
    meeting_attach_exists: "",
    meeting_attdatnum: "",
    meeting_client_finexpdt: "",
    meeting_client_name: "",
    meeting_contents: "",
    meeting_custnm: "",
    meeting_date: "",
    meeting_document_id: "",
    meeting_files: "",
    meeting_finexpdt: "",
    meeting_remark: "",
    meeting_reqdt: "",
    meeting_title: "",
    orgdiv: "",
    person: "",
    progress_status: "",
    recdt: "",
    reception_attdatnum: "",
    reception_document_id: "",
    reception_files: "",
    reception_title: "",
    reception_type: "",
    ref_key: "",
    ref_number: "",
    ref_seq: 0,
    ref_type: "",
    ref_type_full: "",
    remark: "",
    update_pc: "",
    update_time: "",
    update_userid: "",
    value_code3: "",
  });

  return (
    <Window
      title={"답변 작성"}
      width={position.width}
      height={position.height}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={true}
    >
      <FormBoxWrap>
        <FormBox>
          <tbody>
            <tr>
              <th style={{ width: "5%" }}>업체명</th>
              <td>
                <Input
                  name="remark"
                  type="text"
                  value={Information.custnm}
                  className="readonly"
                />
              </td>
              <th style={{ width: "5%" }}>제목</th>
              <td colSpan={3}>
                <Input
                  name="title"
                  type="text"
                  value={Information.title}
                  className="readonly"
                />
              </td>
            </tr>
            <tr>
            <th style={{ width: "5%" }}>작성자</th>
              <td>
                <Input
                  name="custperson"
                  type="text"
                  value={Information.custperson}
                  className="readonly"
                />
              </td>
              <th style={{ width: "5%" }}>연락처</th>
              <td>
                <Input
                  name="custperson"
                  type="text"
                  value={Information.custperson}
                  className="readonly"
                />
              </td>
              <th style={{ width: "5%" }}>요청일</th>
              <td>
                <Input
                  name="recdt"
                  type="text"
                  value={Information.recdt}
                  className="readonly"
                />
              </td>
            </tr>
          </tbody>
        </FormBox>
      </FormBoxWrap>
      <BottomContainer>
        <ButtonContainer>
          <Button themeColor={"primary"}>확인</Button>
          <Button themeColor={"primary"} fillMode={"outline"} onClick={onClose}>
            취소
          </Button>
        </ButtonContainer>
      </BottomContainer>
    </Window>
  );
};

export default SignWindow;
