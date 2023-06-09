import React, { useState, useEffect } from "react";

const CurrentTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // component unmount시 interval을 제거합니다.
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div>
      {time.toLocaleDateString("ko-KR")} (
      {["일", "월", "화", "수", "목", "금", "토"][time.getDay()]}){" "}
      {time.toLocaleTimeString("ko-KR")}
    </div>
  );
};

export default CurrentTime;
