import React, { useCallback, useEffect, useState } from "react";
import {
  Chat,
  ChatMessageSendEvent,
} from "@progress/kendo-react-conversational-ui";
import { bytesToBase64 } from "byte-base64";
import { useApi } from "../hooks/api";
import { Iparameters } from "../store/types";
import {
  UseGetValueFromSessionItem,
  UseParaPc,
} from "../components/CommonFunction";

interface IData {
  id: string;
  question: string;
  parent_question: string;
  answer: string;
}

interface IQnaData {
  id: string;
  value: string;
  parent: string;
  type: string;
  content: string;
}

const user = {
  id: 1,
  avatarUrl:
    "https://demos.telerik.com/kendo-ui/content/web/Customers/RICSU.jpg",
};

const bot = { id: 0 };
// const solutions = [
//   {
//     type: "reply",
//     value: "ERP",
//     content: "중소·중견기업의 경영혁신을 위한 전사적 자원관리시스템",
//   },
//   {
//     type: "reply",
//     value: "SCM",
//     content: "자재공급망관리",
//   },
//   // {
//   //   type: "reply",
//   //   value: "MES",
//   //   content: "제조실행 시스템 및 생산 시점 관리시스템",
//   // },
// ];
const initialMessages = [
  {
    author: bot,
    timestamp: new Date(),
    suggestedActions: [],
    text: "안녕하세요. GST ERP 챗봇입니다. 무엇이든 물어보세요.",
  },
];

const CHAT_BOT: React.FC = () => {
  const processApi = useApi();
  const [messages, setMessages] = useState(initialMessages);
  const [qnaData, setQnaData] = useState<IQnaData[]>([]);
  const userid = UseGetValueFromSessionItem("user_id");
  const [pc, setPc] = useState("");
  UseParaPc(setPc);

  const addNewMessage = (event: ChatMessageSendEvent) => {
    const backToInit = "처음으로";
    const welcomeAnswer = "무엇이든 물어보세요.";
    const ifAskBackToInit = event.message.text === backToInit;

    let botResponse = Object.assign({}, event.message);

    //id 구하기
    const id =
      qnaData.find((item) => item.value === event.message.text)?.id ?? "";
    //id 로그처리
    fetchLogSaved(id);

    // 응답 내용
    botResponse.text = ifAskBackToInit
      ? welcomeAnswer
      : answer(event.message.text);

    botResponse.author = bot;

    // 제안 질문
    let suggestedActions = qnaData.filter(
      (item) => item.parent === event.message.text
    );

    // '첫질문으로' 제안 질문에 추가
    suggestedActions.push({
      id,
      value: backToInit,
      parent: "",
      type: "reply",
      content: welcomeAnswer,
    });

    // '첫질문으로' 질문한 경우 첫번째 제안 질문 제시
    if (ifAskBackToInit) {
      suggestedActions = qnaData.filter((item) => item.parent === "");
    }

    botResponse.suggestedActions = suggestedActions;

    setMessages((prev: any) => [...prev, event.message]);
    setTimeout(() => {
      setMessages((oldMessages: any) => [...oldMessages, botResponse]);
    }, 1000);
  };

  // 질문에 맞는 답변 찾기
  const answer = (question: any) => {
    const content: IQnaData = qnaData.find(
      (solution) => question === solution.value
    )!;

    let answer = content ? content?.content : "다시 입력해주세요.";
    return answer;
  };

  //그리드 데이터 조회
  const fetchMain = async () => {
    // if (!permissions?.view) return;
    let data: any;

    const queryStr = "SELECT * FROM chatBotManager";
    const bytes = require("utf8-bytes");
    const convertedQueryStr = bytesToBase64(bytes(queryStr));

    let query = {
      query: convertedQueryStr,
    };

    try {
      data = await processApi<any>("query", query);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess === true) {
      const totalRowCnt = data.tables[0].RowCount;
      const rows: IQnaData[] = data.tables[0].Rows.map(
        (row: IData, idx: number) => ({
          ...row,
          type: "reply",
          parent: row.parent_question,
          value: row.question,
          content: row.answer,
          id: row.id,
          idx: idx,
        })
      );

      if (totalRowCnt > 0) {
        setQnaData(rows);

        const firstActions = rows.filter((item) => item.parent === "");

        setMessages((prev: any) => [
          {
            ...prev[0],
            suggestedActions: firstActions,
          },
        ]);
      }
    } else {
      console.log("[에러발생]");
      console.log(data);
    }
  };

  // 로그 저장 처리
  const fetchLogSaved = async (id: string) => {
    // if (!permissions?.view) return;
    let data: any;

    //파라미터
    const paraSaved: Iparameters = {
      procedureName: "P_CHAT_A0001_S",
      pageNumber: 0,
      pageSize: 0,
      parameters: {
        "@p_work_type": "N",
        "@p_id": id,
        "@p_userid": userid,
        "@p_pc": pc,
      },
    };

    try {
      data = await processApi<any>("procedure", paraSaved);
    } catch (error) {
      data = null;
    }

    if (data.isSuccess !== true) {
      console.log("[에러발생]");
      console.log(data);
    }
  };
  useEffect(() => {
    fetchMain();
  }, []);

  return (
    <div style={{ height: "80vh", display: "flex" }}>
      <Chat
        user={user}
        messages={messages}
        onMessageSend={addNewMessage}
        placeholder={"Type a message..."}
        width={400}
      />
    </div>
  );
};

export default CHAT_BOT;
