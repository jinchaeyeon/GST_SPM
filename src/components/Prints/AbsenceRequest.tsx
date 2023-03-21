import React, { useCallback, useEffect, useState } from "react";
import { useApi } from "../../hooks/api";
import { Iparameters } from "../../store/types";
import { dateformat3 } from "../CommonFunction";

const AbsenceRequest = (data: any) => {
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
      procedureName: "sys_sel_prints_web",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "W",
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
      const totalRowCnt = data.tables[0].RowCount;
      const rows = data.tables[0].Rows;

      if (totalRowCnt > 0) setMainDataResult(rows[0]);
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };
  return (
    <>
      {mainDataResult !== null ? (
        <div id="AbsenceRequest" className="printable">
          <h1 className="title">근 태 허 가 신 청 서</h1>
          <table className="tb_approval right">
            <tbody>
              <tr>
                <th>{mainDataResult.appline1}</th>
                <th>{mainDataResult.appline2}</th>
                <th>{mainDataResult.appline3}</th>
              </tr>
              <tr className="contents">
                <td>{mainDataResult.resno1}</td>
                <td>{mainDataResult.resno2}</td>
                <td>{mainDataResult.resno3}</td>
              </tr>
              <tr>
                <td>{mainDataResult.restime1}</td>
                <td>{mainDataResult.restime2}</td>
                <td>{mainDataResult.restime3}</td>
              </tr>
            </tbody>
          </table>
          <table className="tb_mid">
            <colgroup>
              <col width="auto" />
              <col width="auto" />
              <col width="auto" />
              <col width="auto" />
            </colgroup>
            <tbody>
              <tr>
                <th>근태구분</th>
                <td colSpan={3}>{mainDataResult.stddivnm}</td>
              </tr>
              <tr>
                <th>소&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;속</th>
                <td>{mainDataResult.dptnm}</td>
                <th>직&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;책</th>
                <td>{mainDataResult.postnm2}</td>
              </tr>
              <tr>
                <th>성&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명</th>
                <td colSpan={3}>{mainDataResult.resno1}</td>
              </tr>
              <tr>
                <th>사&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;유</th>
                <td colSpan={3}>{mainDataResult.stddivnm}</td>
              </tr>
              <tr>
                <th>기&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;간</th>
                <td colSpan={3}>
                  {dateformat3(mainDataResult.startdate) +
                    " " +
                    mainDataResult.shh +
                    "시 " +
                    mainDataResult.smm +
                    "분부터"}
                  <br />
                  {dateformat3(mainDataResult.enddate) +
                    " " +
                    mainDataResult.ehh +
                    "시 " +
                    mainDataResult.emm +
                    "까지"}
                </td>
              </tr>
            </tbody>
          </table>
          <div id="reason">
            본인은 상기 사유로 인하여 근태계를 제출하오니
            <br />
            재가하여 주시기 바랍니다.
          </div>
          <div id="date" className="bottom right"></div>
          <div className="bottom right">
            제출자 : <span id="name" />
            {mainDataResult.resno1}
            (인)
          </div>
          <div id="company"></div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default AbsenceRequest;
