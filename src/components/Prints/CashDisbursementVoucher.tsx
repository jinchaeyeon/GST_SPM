import React, { useCallback, useEffect, useState } from "react";
import { useApi } from "../../hooks/api";
import { Iparameters } from "../../store/types";
import { numberWithCommas } from "../../components/CommonFunction";

const CashDisbursementVoucher = (data: any) => {
  const processApi = useApi();
  const [mainDataResult, setMainDataResult] = useState<any>(null);
  const [detailDataResult, setDetailDataResult] = useState<any>(null);

  useEffect(() => {
    if (data !== null) {
      fetchMainData(data.data);
    }
  }, [data]);

  //그리드 데이터 조회
  const fetchMainData = async (para: any) => {
    let data: any;

    const parameters: Iparameters = {
      procedureName: "sys_sel_prints_web",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "Z",
        "@p_orgdiv": "01",
        "@p_key1": para.ref_key.split("-")[0],
        "@p_key2": para.ref_key.split("-")[1],
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
      if (totalRowCnt > 0) setMainDataResult(rows[0]);

      //상세
      const totalRowCnt2 = data.tables[1].RowCount;
      const rows2 = data.tables[1].Rows;
      if (totalRowCnt2 > 0) setDetailDataResult(rows2);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  return (
    <>
      {mainDataResult !== null ? (
        <div id="CashDisbursementVoucher" className="printable">
          <table className="top_tb">
            <colgroup>
              <col width="8%" />
              <col width="auto" />
              <col width="8%" />
              <col width="auto" />
              <col width="3%" />
              <col width="11%" />
              <col width="11%" />
              <col width="11%" />
              <col width="11%" />
              <col width="11%" />
            </colgroup>
            <tbody>
              <tr>
                <th colSpan={4}>
                  <span className="logo" />
                </th>
                <th colSpan={6} className="title">
                  지 출 결 의 서
                </th>
              </tr>
              <tr>
                <th>발의일</th>
                <td>{mainDataResult.expensedt}</td>
                <th>발의인</th>
                <td>{mainDataResult.prsnnm}</td>
                <th rowSpan={3}>
                  결<br />재
                </th>
                <th>{mainDataResult.appline1}</th>
                <th>{mainDataResult.appline2}</th>
                <th>{mainDataResult.appline3}</th>
                <th>{mainDataResult.appline4}</th>
                <th>{mainDataResult.appline5}</th>
              </tr>
              <tr>
                <th rowSpan={2} className="important-cell">
                  지출
                  <br />
                  총액
                </th>
                <td rowSpan={2} colSpan={3} className="important-cell">
                  一金 {mainDataResult.han}
                  <br />( {mainDataResult.totamt} 원整)
                </td>
                <td>{mainDataResult.resno1}</td>
                <td>{mainDataResult.resno2}</td>
                <td>{mainDataResult.resno3}</td>
                <td>{mainDataResult.resno4}</td>
                <td>{mainDataResult.resno5}</td>
              </tr>
              <tr>
                <td>{mainDataResult.restime1}</td>
                <td>{mainDataResult.restime2}</td>
                <td>{mainDataResult.restime3}</td>
                <td>{mainDataResult.restime4}</td>
                <td>{mainDataResult.restime5}</td>
              </tr>
            </tbody>
          </table>
          <table className="title_tb important-cell">
            <tbody>
              <tr>
                <th>사용일자</th>
                <th colSpan={2}>지불처</th>
                <th colSpan={2}>고객사명</th>
                <th colSpan={2}>결의서 NO</th>
              </tr>
              <tr>
                <th>증빙서류</th>
                <th>예산항목</th>
                <th colSpan={2}>계정과목</th>
                <th>공급가액</th>
                <th>세액</th>
                <th>합계금액</th>
              </tr>
            </tbody>
          </table>
          <table className="main_tb">
            <tbody>
              {detailDataResult !== null &&
                detailDataResult.map((item: any) => (
                  <>
                    <tr>
                      <td>{item.expensedt}</td>
                      <td colSpan={2}>{item.rcvcustnm}</td>
                      <td colSpan={2}>{item.custnm}</td>
                      <td colSpan={2}>{item.exp_key}</td>
                    </tr>
                    <tr>
                      <td>{item.usekind}</td>
                      <td>{item.itemnm}</td>
                      <td colSpan={2}>{item.acntnm}</td>
                      <td className="number">{numberWithCommas(item.amt)}</td>
                      <td className="number">
                        {numberWithCommas(item.taxamt)}
                      </td>
                      <td className="number">
                        {numberWithCommas(item.totamt)}
                      </td>
                    </tr>
                    <tr>
                      <th className="important-cell">비고</th>
                      <td colSpan={6}>{item.remark}</td>
                    </tr>
                  </>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default CashDisbursementVoucher;
