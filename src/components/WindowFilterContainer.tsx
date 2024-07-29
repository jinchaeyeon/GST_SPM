import { ReactNode, useState } from "react";
import { useRecoilState } from "recoil";
import { FilterBoxWrap } from "../CommonStyled";
import { isFilterHideState2 } from "../store/atoms";
import FilterHideToggleButtonBox from "./Buttons/FilterHideToggleButton";

type TChildren = {
  children: ReactNode;
};
const WindowFilterContainer = ({ children }: TChildren) => {
  let deviceWidth = document.documentElement.clientWidth;
  let isMobile = deviceWidth <= 1200;
  const [isFilterHideStates2, setisFilterHideStates2] =
    useRecoilState(isFilterHideState2);

  const toggleFilterHide = () => {
    setisFilterHideStates2((prev) => !prev);
  };

  return (
    <>
      <div className="visible-mobile-only2" style={{ textAlign: "right" }}>
        <FilterHideToggleButtonBox
          isFilterHide={isFilterHideStates2}
          toggleFilterHide={toggleFilterHide}
        />
      </div>
      {(!isFilterHideStates2 || !isMobile) && (
        <div className="filterBox2">
          <FilterBoxWrap>{children}</FilterBoxWrap>
        </div>
      )}
    </>
  );
};

export default WindowFilterContainer;
