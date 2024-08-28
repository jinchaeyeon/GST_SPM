import React, { ReactNode } from 'react';

interface WatermarkProps {
  text: string;
  textStyle?: React.CSSProperties; 
  containerStyle?: React.CSSProperties; 
  children: ReactNode;
  fontSize?: string | number;
}

const Watermark: React.FC<WatermarkProps> = ({
  text,
  textStyle,
  containerStyle,
  fontSize = "72px",
  children, 
}) => {
  const waterMarkTextStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%", 
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-25deg)",
    color: "rgba(128, 128, 128, 0.2)",
    fontSize: fontSize,
    fontWeight: "bold",
    pointerEvents: "none",
    zIndex: 1000,
    whiteSpace: "nowrap",
  };
  
  const waterMarkContainerStyle: React.CSSProperties = {
    position: "relative",
    display: "block",
    width: "100%",
    height: "100%",
  };
  
  return (
    <div style={{ ...waterMarkContainerStyle, ...containerStyle }}>
      {children} {/* 자식 컴포넌트를 렌더링 */}
      <div style={{ ...waterMarkTextStyle, ...textStyle }}>{text}</div>
    </div>
  );
};

export default Watermark;
