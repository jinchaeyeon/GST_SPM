import React, { ReactNode, useEffect, useRef, useState } from 'react';

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
  fontSize,
  children, 
}) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const [newFontSize, setNewFontSize] = useState<string | number>("72px");

  useEffect(() => {
    // 이미지 컨테이너의 크기에 따라 폰트 크기를 조정
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const calculatedFontSize = containerWidth * 0.05;
      setNewFontSize(`${calculatedFontSize}px`);
    }
  }, [containerRef.current]);
  
  const watermarkFontSize = fontSize || newFontSize; // 지정된 폰트 크기없으면 이미지 크기에 따라

  const waterMarkTextStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%", 
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-25deg)",
    color: "rgba(128, 128, 128, 0.2)",
    fontSize: watermarkFontSize,
    fontWeight: "bold",
    pointerEvents: "none",
    zIndex: 1000,
    whiteSpace: "nowrap",
  };
  
  const waterMarkContainerStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  };

  return (
    <div style={{ ...waterMarkContainerStyle, ...containerStyle }} ref={containerRef}>
      {children} {/* 자식 컴포넌트를 렌더링 */}
      <div style={{ ...waterMarkTextStyle, ...textStyle }}>{text}</div>
    </div>
  );
};

export default Watermark;
