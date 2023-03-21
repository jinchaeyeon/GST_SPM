import React, { useRef, useCallback, useEffect, useState } from "react";
import { ButtonContainer, LandscapePrint } from "../../CommonStyled";
import { useApi } from "../../hooks/api";
import { Iparameters } from "../../store/types";
import { convertDateToStr, numberWithCommas } from "../CommonFunction";
import ReactToPrint from "react-to-print";
import { Button } from "@progress/kendo-react-buttons";

const WorkDailyReport = (data: any) => {
  const processApi = useApi();
  const [mainDataResult, setMainDataResult] = useState<any>(null);

  useEffect(() => {
    if (data !== null) {
      fetchMainData(data.data);
    }
  }, [data]);

  //그리드 데이터 조회
  const fetchMainData = async (para: any) => {
    let data: any;

    const parameters: Iparameters = {
      procedureName: "P_PR_B3000W_Q",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "REPORT",
        "@p_orgdiv": para.orgdiv,
        "@p_location": para.location,
        "@p_frdt": convertDateToStr(para.ymdFrdt),
        "@p_todt": convertDateToStr(para.ymdTodt),
        "@p_itemcd": para.itemcd,
        "@p_itemnm": para.itemnm,
        "@p_proccd": para.cboProccd,
        "@p_prodmac": para.cboProdmac,
        "@p_prodemp": para.cboProdemp,
        "@p_lotnum": para.lotnum,
        "@p_custcd": para.custcd,
        "@p_custnm": para.custnm,
        "@p_service_id": para.service_id,
      },
    };

    try {
      data = await processApi<any>("procedure", parameters);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      //요약
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;
      if (totalRowCnt > 0) setMainDataResult(rows);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  const componentRef = useRef(null);

  return (
    <LandscapePrint>
      <ButtonContainer>
        <></>
        <ReactToPrint
          trigger={() => (
            <Button fillMode="outline" themeColor={"primary"} icon="print">
              출력
            </Button>
          )}
          content={() => componentRef.current}
        />
      </ButtonContainer>

      <div
        id="WorkDailyReport"
        className="printable landscape"
        ref={componentRef}
      >
        <div className="title_container">
          <h1 className="title">작 업 일 보</h1>
          <table className="tb_approval right">
            <tbody>
              <tr>
                <th>담당</th>
                <th>검토</th>
                <th>승인</th>
              </tr>
              <tr className="contents">
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {mainDataResult !== null &&
          mainDataResult.map((item1: any, idx1: number) =>
            idx1 === 0 || idx1 % 10 === 0 ? (
              <>
                <table className="main_tb">
                  <colgroup>
                    <col width="3%" />
                    <col width="9%" />
                    <col width="10%" />
                    <col width="10%" />
                    <col width="6%" />
                    <col width="6%" />
                    <col width="6%" />
                    <col width="auto" />
                    <col width="9%" />
                    <col width="9%" />
                    <col width="8%" />
                    <col width="8%" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>NO</th>
                      <th>생산일자</th>
                      <th>품명</th>
                      <th>공정</th>
                      <th>설비</th>
                      <th>작성자</th>
                      <th>수량</th>
                      <th>LOT NO</th>
                      <th>시작시간</th>
                      <th>종료시간</th>
                      <th>소요시간(시:분)</th>
                      <th>비고</th>
                    </tr>
                    {mainDataResult.map((item2: any, idx2: number) =>
                      idx1 + 10 > idx2 && idx1 <= idx2 ? (
                        <tr key={item2.rownum}>
                          <td className="center">{item2.rownum}</td>
                          <td className="center">{item2.proddt}</td>
                          <td>{item2.itemnm}</td>
                          <td>{item2.proccd}</td>
                          <td>{item2.prodmac}</td>
                          <td>{item2.prodemp}</td>
                          <td className="number">
                            {numberWithCommas(item2.qty)}
                          </td>
                          <td>{item2.lotnum}</td>
                          <td className="center">{item2.strtime}</td>
                          <td className="center">{item2.endtime}</td>
                          <td className="center">{item2.leadtime}</td>
                          <td className="center">{item2.remark}</td>
                        </tr>
                      ) : (
                        ""
                      )
                    )}
                  </tbody>
                </table>
                <div style={{ pageBreakBefore: "always" }} />
              </>
            ) : (
              ""
            )
          )}
      </div>
    </LandscapePrint>
  );
};

export default WorkDailyReport;
