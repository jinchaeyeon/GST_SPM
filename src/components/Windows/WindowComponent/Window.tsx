import { Button } from "@progress/kendo-react-buttons";
import {
  WindowActionsEvent,
  Window as WindowKendo,
  WindowMoveEvent,
} from "@progress/kendo-react-dialogs";
import {
  minusIcon,
  windowIcon,
  windowRestoreIcon,
} from "@progress/kendo-svg-icons";
import { ReactNode, useEffect, useState } from "react";
import { IWindowPosition } from "../../../hooks/interfaces";

type TChildren = {
  children: ReactNode;
  positions: any;
  titles: any;
  modals: any;
  Close(): void;
  className?: string;
  onChangePostion(position: any): void;
};

const minButton = (props: any) => {
  return (
    <Button
      svgIcon={minusIcon}
      fillMode="flat"
      onClick={(e) => {
        if (props.onClick) {
          props.onClick(e);
        }
      }}
    />
  );
};

const maxButton = (props: any) => {
  return (
    <Button
      svgIcon={windowIcon}
      fillMode="flat"
      onClick={(e) => {
        if (props.onClick) {
          props.onClick(e);
        }
      }}
    />
  );
};

const maxRestoreButton = (props: any) => {
  return (
    <Button
      svgIcon={windowRestoreIcon}
      fillMode="flat"
      onClick={(e) => {
        if (props.onClick) {
          props.onClick(e);
        }
      }}
    />
  );
};

const NoneDiv = () => {
  return <div></div>;
};
const Window = ({
  children,
  positions,
  titles,
  modals,
  Close,
  className = "",
  onChangePostion,
}: TChildren) => {
  let deviceWidth = document.documentElement.clientWidth;
  let deviceHeight = document.documentElement.clientHeight;
  let isMobile = deviceWidth <= 1200;
  const [windowStage, setWindowStage] = useState<
    "MINIMIZED" | "full" | "DEFAULT" | undefined
  >("DEFAULT");
  const [position, setPosition] = useState<IWindowPosition>(positions);
  const [defaultPositions, setDefaultPostions] = useState<IWindowPosition>();
  useEffect(() => {
    if (
      (defaultPositions == undefined || defaultPositions == null) &&
      positions.width != 0
    )
      setDefaultPostions(positions);
  }, []);
  const handleMove = (event: WindowMoveEvent) => {
    if (!isMobile) {
      setPosition({ ...position, left: event.left, top: event.top });
      onChangePostion({ ...position, left: event.left, top: event.top });
    }
  };
  const handleResize = (event: WindowMoveEvent) => {
    if (!isMobile) {
      setPosition({
        left: event.left,
        top: event.top,
        width: event.width,
        height: event.height,
      });
      onChangePostion({
        left: event.left,
        top: event.top,
        width: event.width,
        height: event.height,
      });
    }
  };
  const onClose = () => {
    Close();
  };

  const handleStageChange = (e: WindowActionsEvent) => {
    if (!isMobile) {
      if (e.state == "FULLSCREEN" && windowStage != "full") {
        setWindowStage("full");
        setDefaultPostions(positions);
        setPosition({
          top: 0,
          left: 0,
          width: deviceWidth,
          height: deviceHeight,
        });
        e.target.setState((prev) => ({
          ...prev,
          stage: "DEFAULT",
          top: 0,
          left: 0,
          width: deviceWidth,
          height: deviceHeight,
        }));
        onChangePostion({
          top: 0,
          left: 0,
          width: deviceWidth,
          height: deviceHeight,
        });
      } else if (e.state == "MINIMIZED") {
        setWindowStage("MINIMIZED");
        e.target.setState((prev) => ({
          ...prev,
          stage: "MINIMIZED",
        }));
      } else if (windowStage == "full") {
        setWindowStage("DEFAULT");
        setPosition(
          defaultPositions == undefined ? positions : defaultPositions
        );
        e.target.setState((prev) => ({
          ...prev,
          stage: "DEFAULT",
          top:
            defaultPositions == undefined
              ? positions.top
              : defaultPositions.top,
          left:
            defaultPositions == undefined
              ? positions.left
              : defaultPositions.left,
          width:
            defaultPositions == undefined
              ? positions.width
              : defaultPositions.width,
          height:
            defaultPositions == undefined
              ? positions.height
              : defaultPositions.height,
        }));
        onChangePostion({
          top:
            defaultPositions == undefined
              ? positions.top
              : defaultPositions.top,
          left:
            defaultPositions == undefined
              ? positions.left
              : defaultPositions.left,
          width:
            defaultPositions == undefined
              ? positions.width
              : defaultPositions.width,
          height:
            defaultPositions == undefined
              ? positions.height
              : defaultPositions.height,
        });
      } else if (windowStage == "MINIMIZED") {
        setWindowStage("DEFAULT");
        e.target.setState((prev) => ({
          ...prev,
          stage: "DEFAULT",
        }));
      }
    }
  };

  return (
    <WindowKendo
      stage={windowStage == "full" ? "DEFAULT" : windowStage}
      onStageChange={handleStageChange}
      title={titles}
      width={position.width}
      height={position.height}
      top={position.top}
      left={position.left}
      className={className == "" ? undefined : className}
      onMove={handleMove}
      onResize={handleResize}
      onClose={onClose}
      modal={modals}
      doubleClickStageChange={false}
      minimizeButton={
        isMobile ? NoneDiv : windowStage == "DEFAULT" ? minButton : NoneDiv
      }
      maximizeButton={
        isMobile
          ? NoneDiv
          : windowStage == "DEFAULT"
          ? maxButton
          : maxRestoreButton
      }
    >
      {children}
    </WindowKendo>
  );
};

export default Window;
