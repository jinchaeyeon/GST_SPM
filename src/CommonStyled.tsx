import styled from "styled-components";
import { CLOSED_GNV_WIDTH, GNV_WIDTH } from "./components/CommonString";
import logoSrc from "./img/logo.png";
import loginBgSrc from "./img/login_bg.png";
import loginLogoCscSrc from "./img/login_logo_csc.png";
import loginLogoSpmSrc from "./img/login_logo_spm.png";
import checkedStsSrc from "./img/checked_16.png";
import processStsSrc from "./img/process_16.png";
import stopStsSrc from "./img/stop_16.png";
import waitStsSrc from "./img/wait_16.png";

export const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  padding-bottom: 5px;
  min-height: 40px;

  .iot-title {
    font-size: 26px;
  }
`;

export const MainTopContainer = styled(TitleContainer)`
  margin-top: 10px;

  @media (max-width: 768px) {
    margin-top: 0;
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const MainWorkStartEndContainer = styled.div`
  display: flex;
  margin-left: auto;

  input,
  button {
    margin-left: 5px;
  }

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

export const TextContainer = styled.div`
  display: flex;
  border: solid 1px #8d92ce;
  color: #8d92ce;
  border-radius: 50px;
  width: 180px;
  line-height: 30px;
  align-items: center;
  justify-content: center;
`;

export const Title = styled.h3`
  font-size: 22px;
  font-weight: 600;
  /* color: #424242; */
  color: #7a76ce;
  padding-bottom: 10px;
  padding-top: 10px;
`;
type TButtonContainer = {
  flexDirection?: "column" | "row";
};
export const ButtonContainer = styled.div<TButtonContainer>`
  display: flex;

  flex-direction: ${(props) =>
    props.flexDirection ? props.flexDirection : "row"};
  align-items: center;

  input,
  button {
    margin-left: 5px;
  }

  .iot-btn {
    margin-top: 5px;
    margin-right: 10px;
    max-width: 250px;
    width: 100%;
    height: 120px;
    font-size: 32px;
    font-weight: 600;
    box-shadow: none;
  }
  .iot-btn.green {
    background-color: #6cc56c;
    border-color: #6cc56c;
  }
  .iot-btn.red {
    background-color: #ff4949;
    border-color: #ff4949;
  }
  .iot-btn.gray {
    background-color: gray;
    border-color: gray;
  }
  .iot-btn .k-icon {
    font-size: 32px;
  }
`;

export const BottomContainer = styled(TitleContainer)`
  flex-direction: row-reverse;
  button {
    width: 100px;
    height: 40px;
  }
`;

export const FilterBoxWrap = styled.div`
  padding: 5px 0 10px;
  width: 100%;
`;

export const FilterBox = styled.table`
  /* line-height: 1.5; */
  border: solid 1px #d7d7d7;
  background-color: #fff;
  width: 100%;
  tr th + td {
    min-height: 40px;
  }
  tr th {
    background-color: #fafafa;
    border: solid 1px #d7d7d7;
    width: 120px;
    color: #333333;
    font-weight: 400;
    font-size: 13px;
    text-align: center;
    vertical-align: middle;
  }
  tr td {
    background-color: #ffffff;
    border: solid 1px #d7d7d7;
    width: 270px;
    text-align: center;
    padding: 5px;
    position: relative;
    vertical-align: middle;
  }
  .filter-item-wrap {
    display: flex;
    align-items: center;
  }
  .k-radio-list.k-list-horizontal {
    justify-content: center;
  }

  .PR_A3000W tr th,
  .PR_A3000W tr td {
    height: 80px;
    font-size: 26px;
    font-weight: 600;
  }
  .PR_A3000W tr th {
    font-size: 22px;
  }

  .PR_A3000W tr td .k-input-md,
  .PR_A3000W tr td .k-picker-md {
    height: 65px;
    font-size: 26px;
    font-weight: 600;
    padding-left: 10px;
  }

  @media (max-width: 768px) {
    tr {
      display: flex;
      flex-direction: column;
    }
    tr th,
    tr td {
      width: 100%;
      border: none;
    }
    tr th {
      min-height: 35px;
      line-height: 35px;
    }
  }
`;

type TFormBoxWrap = {
  border?: boolean;
};
export const FormBoxWrap = styled.div<TFormBoxWrap>`
  margin: 5px 0 10px;
  width: 100%;
  padding: 10px;
  border: ${(props) =>
    props.border ? "solid 1px rgba(0, 0, 0, 0.08);" : undefined};
`;
export const FormBox = styled.table`
  /* line-height: 1.5; */
  /* border: solid 1px #d7d7d7;
  background-color: #fff; */
  width: 100%;
  tr th + td {
    min-height: 40px;
  }
  tr th {
    /* background-color: #f5f5f8;
    border: solid 1px #d7d7d7; */
    min-width: 80px;
    color: #333333;
    font-weight: 400;
    font-size: 13px;
    text-align: right;
    vertical-align: middle;
    padding-right: 10px;
  }
  tr td {
    /* background-color: #ffffff;
    border: solid 1px #d7d7d7; */
    width: 270px;
    text-align: center;
    padding: 5px;
    position: relative;
    vertical-align: middle;
  }
  .filter-item-wrap {
    display: flex;
    align-items: center;
  }
  .filter-item-wrap > button {
    position: absolute;
    right: 5px;
  }
  .k-radio-list.k-list-horizontal {
    justify-content: center;
    border: solid 1px rgba(0, 0, 0, 0.08);
    border-radius: 4px;
  }
  @media (max-width: 768px) {
    tr {
      display: flex;
      flex-direction: column;
    }
    tr th,
    tr td {
      width: 100%;
      border: none;
    }
    tr th {
      min-height: 35px;
      line-height: 35px;
    }
  }
`;

type TGridContainerWrap = {
  flexDirection?: "column" | "row" | "row-reverse" | "column-reverse";
  maxWidth?: string | number;
  height?: string | number;
};

export const GridContainerWrap = styled.div<TGridContainerWrap>`
  display: flex;
  gap: ${(props) => (props.flexDirection === "column" ? "0" : "15px")};
  justify-content: space-between;
  flex-direction: ${(props) => props.flexDirection};
  width: 100%;
  max-width: ${(props) =>
    typeof props.maxWidth === "number"
      ? props.maxWidth + "px"
      : props.maxWidth};
  height: ${(props) =>
    typeof props.height === "number" ? props.height + "px" : props.height};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

type TGridContainer = {
  maxWidth?: string;
  minHeight?: string;
  clientWidth?: number;
  height?: string;
  width?: string;
  inTab?: boolean;
  margin?: TMargin;
  type?: string;
};

type TMargin = {
  left?: string;
  top?: string;
  bottom?: string;
  right?: string;
};

export const FormFieldWrap = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const GridContainer = styled.div<TGridContainer>`
  display: flex;
  flex-direction: column;
  max-width: ${(props) => props.maxWidth};
  min-height: ${(props) => props.minHeight};
  width: ${(props) =>
    props.width
      ? props.width
      : props.clientWidth
      ? "calc(" +
        props.clientWidth +
        "px - " +
        (props.inTab ? 65 : 0) + //65: 탭 마진
        "px - 150px)" //150: 기본 마진
      : ""};

  height: ${(props) => props.height ?? "100%"};
  margin-top: ${(props) => (props.margin ? props.margin.top ?? "" : "")};
  margin-bottom: ${(props) => (props.margin ? props.margin.bottom ?? "" : "")};
  margin-left: ${(props) => (props.margin ? props.margin.left ?? "" : "")};
  margin-right: ${(props) => (props.margin ? props.margin.right ?? "" : "")};
  min-width: ${(props) => (props.type === "mainLeft" ? "360px" : "auto")};

  .k-grid .k-command-cell {
    text-align: center;
  }
  .k-grid td {
    white-space: nowrap; //그리드 셀 말줄임표
  }
  .k-chart.QC_A0120_TAB1 {
    width: 400px;
  }
  .k-chart.QC_A0120_TAB2 {
    width: 400px;
  }
  .k-chart.QC_A0120_TAB3 {
    width: 600px;
  }
  .k-radio-list.k-list-horizontal {
    justify-content: center;
  }
  /* .required {
    background-color: #fff0ef;
  } */

  @media (max-width: 768px) {
    width: auto;
    min-width: auto;
  }
`;

type TGridTitle = {
  theme: string;
};
export const GridTitle = styled.h3<TGridTitle>`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.theme === "dark" ? "#fff" : "#424242")};
`;

export const PrimaryP = styled.p`
  color: #8d92ce;
`;

export const PortraitPrint = styled.div`
  @media print {
    @page {
      size: 29.7cm 21cm;
      margin-top: 1cm;
      margin-right: 1cm;
      margin-bottom: 0cm;
      margin-left: 1cm;
    }
    /* html, body { border:0; margin:0; padding:0; margin-top:0px; }
	 */

    .printable {
      display: block;
    }

    #non-printable {
      display: none;
    }
  }
`;
export const LandscapePrint = styled.div`
  @media print {
    @page {
      size: 29.7cm 21cm;
      margin-top: 1cm;
      margin-right: 1cm;
      margin-bottom: 0cm;
      margin-left: 1cm;
    }
    /* html, body { border:0; margin:0; padding:0; margin-top:0px; }
	 */

    .printable {
      display: block;
    }

    #non-printable {
      display: none;
    }
  }
`;

export const GridTitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* margin: 5 0px; */
  min-height: 30px;
`;

export const ButtonInInput = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
`;

export const ButtonInGridInput = styled.div`
  position: absolute;
  top: 3px;
  right: 12px;
`;

export const ButtonInFieldWrap = styled.div`
  position: relative;
`;

export const ButtonInField = styled(ButtonInInput)`
  top: -7px;
  right: 0;
`;

type TFieldWrap = {
  fieldWidth?: string;
};
export const FieldWrap = styled.div<TFieldWrap>`
  display: flex;
  justify-content: flex-start;
  align-items: center;

  > span {
    margin: 0 5px;
  }
  > span:first-child {
    margin-left: 0;
  }
  > span:last-child {
    margin-right: 0;
  }
  > .k-form-field {
    width: ${(props) => props.fieldWidth ?? ""};
  }
  .k-picker,
  .k-picker:hover,
  .k-picker.k-hover {
    background-color: #ffffff;
  }
`;

export const LoginImg = styled.div`
  background: url(${loginBgSrc});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center right;
  height: 100%;
  width: 50%;
  top: 0;
  right: 0;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    display: none;
  }
`;
export const LoginBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 50%;
  border-top-left-radius: 300px;
  background-color: #fff;

  > form {
    width: 400px;
    padding: 50px;
    border-radius: 5px;
  }
  .k-button.login-btn {
    width: 100%;
    margin-top: 40px;
    height: 48px;
    font-size: 18px;
    font-weight: 600;
    background-color: rgb(122 118 206);
    border-color: rgb(122 118 206);
  }
  .k-input {
    height: 44px;
    padding-right: 20px;
    padding-left: 20px;
    font-size: 14px;
    border-color: rgba(0, 0, 0, 0.2);
  }
  .k-form-horizontal .k-form-field > .k-label,
  .k-form-horizontal .k-form-field > kendo-label,
  .k-form-horizontal .k-form-field > .k-form-label {
    align-items: flex-start;
    width: 25% !important;
  }
  .k-form-horizontal .k-form-field-wrap {
    max-width: calc(75% - 10px) !important;
  }
  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const RadioButtonBox = styled.div`
  display: flex;
`;

export const ApprovalBox = styled.div`
  display: flex;
  justify-content: space-evenly;
  width: 350px;
  height: 60px;
  margin-left: 15px;
  border: solid 1px #dfdfdf;
  background-color: #fafafa;

  > div:nth-child(1) > div:last-child {
    background-color: #ffb849;
  }
  > div:nth-child(2) > div:last-child {
    background-color: #49c9ff;
  }
  > div:nth-child(3) > div:last-child {
    background-color: #ff8549;
  }

  @media (max-width: 768px) {
    margin-top: 10px;
    margin-left: 0;
    width: 100%;
  }
`;

export const ApprovalInner = styled.div`
  display: flex;
  justify-content: space-evenly;
  width: 33%;
  height: 100%;
  align-items: center;

  :nth-child(2) {
    border-right: 0;
    border-left: 0;
  }
  > div:last-child {
    width: 40px;
    line-height: 35px;
    border-radius: 5px;
    vertical-align: middle;
    text-align: center;
    font-weight: 600;
    color: #fff;
  }
`;

export const InfoList = styled.ul`
  display: flex;
  gap: 20px;
  display: flex;
  flex-direction: column;
  border: solid 1px #ebebeb;
  padding: 30px;
  border-radius: 15px;
  margin-top: 35px;

  .k-form-fieldset {
    margin: 0;
    border-top: solid 1px gainsboro;
    padding-top: 40px;
    margin-top: 20px;
    padding-bottom: 10px;
  }

  .k-form-field {
    margin: 0;
  }

  .k-form-field > .k-label {
    display: flex;
    justify-content: center;
    padding-top: 0;
  }

  .big-input {
    height: 50px;
    border: solid 1px #8d92ce;
    border-radius: 10px;
    color: #8d92ce;
    text-align: right;
    padding-left: 15px;
    font-size: 18px;
    font-weight: 600;
  }
`;
export const InfoTitle = styled.p`
  text-align: center;
  color: #727272;
  padding-bottom: 10px;
`;
export const InfoItem = styled.li`
  display: flex;
  justify-content: space-between;
`;
export const InfoLabel = styled.span``;
export const InfoValue = styled.span`
  font-weight: 600;
`;

export const NumberKeypad = styled.div`
  width: 100%;
  padding: 1%;
  border: solid 1px #f0f0f0;
  display: inline-block;
  margin: 5px 0;
  margin-left: 5px;
`;
export const NumberKeypadRow = styled.div`
  display: flex;
  justify-content: space-between;
`;
export const NumberKeypadCell = styled.div`
  border: solid 1px #8d92ce;
  color: #8d92ce;
  font-size: 20px;
  text-align: center;
  border-radius: 5px;
  width: 100%;
  margin: 1%;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  :hover {
    background-color: #8d92ce;
    color: #ffffff;
  }
  :focus {
    background-color: #8d92ce;
    color: #ffffff;
  }
  :active {
    background-color: #8d92ce;
    color: #ffffff;
  }
`;

/*=========================================================================
	// PanelBarNavContainer 시작
=========================================================================*/

type TWrapper = {
  isMobileMenuOpend: boolean;
  theme: string;
};

export const Wrapper = styled.div<TWrapper>`
  display: flex;
  width: 100%;
  //overflow: ${(props) => (props.isMobileMenuOpend ? "hidden" : "auto")};
  background-color: ${(props) =>
    props.theme === "dark" ? "#181818" : "#ffffff"};
  margin-bottom: 30px;
  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

type TGnv = {
  isMobileMenuOpend: boolean;
  theme: string;
};
export const Gnv = styled.div<TGnv>`
  min-width: ${GNV_WIDTH}px;
  text-align: center;

  min-height: calc(100vh - 30px);

  background-color: ${(props) =>
    props.theme === "dark" ? "rgb(16, 16,16)" : "#fff"};

  .logout span {
    color: #656565;
  }
  .logout > .k-link {
    justify-content: center;
  }

  .k-panelbar-item-icon.k-icon.k-i-gear,
  .k-panelbar-item-icon.k-icon.k-i-star,
  .k-panelbar-item-icon.k-icon.k-i-star-outline {
    color: #8d92ce;
  }

  .k-selected > .k-panelbar-item-icon.k-icon.k-i-star-outline {
    color: #fff;
  }

  .k-panelbar-item-icon.k-icon.k-i-circle {
    color: transparent;
    /* color: #ebebeb; */
  }

  .k-panelbar > .k-panelbar-item.fav-menu > .k-link,
  .k-panelbar > .k-panelbar-item.fav-menu > div.k-animation-container {
    background-color: rgba(51, 122, 183, 0.05);
  }

  /*=========================================================================
	미디어 쿼리
	##Device = 모바일
	##Screen = 768px 이하 해상도 모바일
  =========================================================================*/
  @media (max-width: 768px) {
    display: ${(props) => (props.isMobileMenuOpend ? "block" : "none")};
    z-index: 10;
    position: fixed;
    min-height: 100vh;

    h1 {
      display: none;
    }
  }
`;

export const Footer = styled.div`
  width: 100%;
  height: 30px;
  position: fixed;
  bottom: 0;
  background-color: #656565;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10000;

  > div {
    display: flex;
  }

  div {
    line-height: 30px;
    color: #fff;
    padding-right: 10px;
    padding-left: 10px;
    font-size: 13px;
    font-weight: 100;
  }
  .default div {
    border-left: solid 1px gray;
  }
  @media (max-width: 768px) {
    display: none;
  }
`;
type ContentType = {
  isMenuOpen: boolean;
};
export const Content = styled.div<ContentType>`
  width: calc(
    100% - ${(props) => (props.isMenuOpen ? GNV_WIDTH : CLOSED_GNV_WIDTH)}px
  );

  /*=========================================================================
  미디어 쿼리
  ##Device = 모바일
  ##Screen = 768px 이하 해상도 모바일
  =========================================================================*/
  @media (max-width: 768px) {
    width: 100%;
    padding-bottom: 5vh;
  }
`;

export const PageWrap = styled.div`
  padding: 0 15px;
  height: calc(100vh - 30px);

  @media (max-width: 768px) {
    min-height: auto;
    height: auto;
    padding-top: 50px;
  }
`;

type TAppName = {
  theme: string;
};
export const AppName = styled.h1<TAppName>`
  font-size: 20px;
  color: #8d92ce;
  font-weight: 400;
  /* padding: 10px 0; */
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3px;
  background-color: ${(props) => (props.theme === "dark" ? "#000" : "#fff")};
  border-right: ${(props) =>
    props.theme === "dark" ? "none" : "1px solid #ebebeb"};
  cursor: pointer;

  @media (max-width: 768px) {
    border-right: 0;
    background-color: ${(props) =>
      props.theme === "dark" ? "#181818" : "#fff"};
  }
`;

export const MenuSearchBox = styled.div`
  padding: 5px;
  border-right: solid 1px #ebebeb;
  position: relative;

  input::placeholder {
    color: #bdbdbd;
  }
  .k-i-search {
    position: absolute;
    z-index: 1;
    top: 10px;
    right: 15px;
    color: #bdbdbd;
  }
`;

type TLoginAppName = {
  type: "SPM" | "CSC";
};
export const LoginAppName = styled.h1<TLoginAppName>`
  background-color: transparent;
  font-size: 22px;
  gap: 5px;
  background: url(${(props) =>
    props.type === "SPM" ? loginLogoSpmSrc : loginLogoCscSrc});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center right;
  width: 502px;
  height: 355px;
`;

export const TopTitle = styled.div`
  min-width: ${GNV_WIDTH}px;
  /* text-align: center; */
  padding: 0 15px;
  display: none;
  justify-content: space-between;
  align-items: center;

  button {
    height: 30px;
  }

  /*=========================================================================
  미디어 쿼리
  ##Device = 모바일
  ##Screen = 768px 이하 해상도 모바일
  =========================================================================*/
  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    z-index: 9;
    width: 100%;
    background-color: #fff;
  }
`;

type TModal = {
  isMobileMenuOpend: boolean;
};
export const Modal = styled.div<TModal>`
  position: fixed;
  z-index: 10;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: ${(props) => (props.isMobileMenuOpend ? "block" : "none")};
  background-color: rgba(0, 0, 0, 0.4);
`;
/*=========================================================================
	// PanelBarNavContainer 종료
=========================================================================*/
type TLogo = { size: string };

export const Logo = styled.div<TLogo>`
  background: url(${logoSrc});
  background-size: contain;
  background-repeat: no-repeat;
  width: 130px;
  height: 32px;
  /* ${(props) => props.size}; */
  background-position: center;
`;

type TStatusIcon = { status: string };

export const StatusIcon = styled.span<TStatusIcon>`
  background: url(${(props) =>
    props.status === "N"
      ? waitStsSrc
      : props.status === "R"
      ? processStsSrc
      : props.status === "Y"
      ? checkedStsSrc
      : stopStsSrc});
  background-size: contain;
  background-repeat: no-repeat;
  width: 15px;
  height: 15px;
  background-position: center;
  display: inline-block;
  margin-right: 5px;
`;

export const QnaPwBox = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: solid 1px #ebebeb;

  .inner {
    display: flex;
    min-width: 300px;
    height: 400px;
    flex-direction: column;
    align-items: center;
  }

  .inner p {
    margin-top: 20px;
    font-size: 15px;
  }
  .inner input {
    height: 40px;
    margin-top: 40px;
  }
  .inner button {
    width: 100%;
    height: 40px;
    margin-top: 20px;
  }
`;

type TTextBox = { type?: "Admin" | "General" };

export const TextBox = styled.div<TTextBox>`
  min-height: ${(props) => (props.type === "Admin" ? "60px" : "150px")};
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(245, 245, 245);
  flex-direction: ${(props) => (props.type === "Admin" ? "row" : "column")};
  justify-content: ${(props) =>
    props.type === "Admin" ? "space-between" : null};
  padding: ${(props) => (props.type === "Admin" ? "0 50px" : null)};
  border-radius: ${(props) => (props.type === "Admin" ? "10px" : null)};

  p span {
    font-weight: 700;
    font-size: 28px;
    margin-left: 5px;
    vertical-align: middle;
  }

  .small {
    font-size: 18px;
  }
  .medium {
    font-size: 24px;
    margin-top: 10px;
    font-weight: 700;
  }
  .large {
    width: ${(props) => (props.type === "Admin" ? "100px" : null)};
    text-align: ${(props) => (props.type === "Admin" ? "center" : null)};
    font-size: ${(props) => (props.type === "Admin" ? "40px" : "64px")};
    margin-top: ${(props) => (props.type === "Admin" ? "0" : "20px")};
    font-weight: 700;
  }
  .time {
    text-align: center;
    font-weight: 400;
    line-height: 25px;
    font-size: 20px;
  }
  .time span {
    margin: 0;
  }

  .dark-gray {
    color: #3a3a3a;
  }
  .gray {
    color: #838383;
  }
  .green {
    color: #6cc56c;
  }
  .yellow {
    color: #ffd519;
  }
  .blue {
    color: #4b5ffa;
  }
  .red {
    color: #ff6358;
  }
`;

type TSmallGnv = {
  theme: "dark" | "light";
};
export const SmallGnv = styled.div<TSmallGnv>`
  padding-top: 10px;
  border-right: ${(props) =>
    props.theme === "dark" ? "solid 1px #454545" : "1px solid #ebebeb"};
  height: 100vh;
  @media (max-width: 768px) {
    display: none;
  }
`;

export const AdminQuestionBox = styled.div`
  min-width: 600px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* cursor: pointer; */

  > div:nth-child(2) {
    width: 400px;
  }

  .title {
    font-size: 16px;
    font-weight: 500;
  }
  .customer {
    font-size: 14px;
    padding-top: 10px;
    font-weight: 400;
  }
  .status {
    width: 62px;
    height: 32px;
    border-radius: 30px;
    padding: 0 5px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #3a3a3a;
    color: #fff;
  }
  .O {
    background-color: #ff6358;
  }
  .N {
    background-color: #838383;
  }
  .R {
    background-color: #6cc56c;
  }

  @media (max-width: 768px) {
    min-width: auto;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    > div:nth-child(2) {
      width: 100%;
    }
  }
`;
export const AdminProjectBox = styled.div`
  min-width: 600px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;

  .sub {
    font-size: 14px;
    font-weight: 400;
  }

  .custnm {
    background-color: #7a76ce;
    padding: 5px;
    color: #fff;
    border-radius: 5px;
    display: inline-block;
    white-space: normal;
  }

  .project {
    padding-top: 5px;
  }
  .curr_title {
    padding-top: 10px;
    font-size: 16px;
    font-weight: 500;
  }
  .days {
    font-size: 20px;
    font-weight: 500;
    margin-left: 30px;
  }

  @media (max-width: 768px) {
    min-width: auto;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    .days {
      margin-left: 0;
    }
  }
`;
export const AdminCustSummaryBox = styled.div`
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .cust {
    padding-top: 10px;
    font-size: 16px;
    font-weight: 500;
  }
  .cnt {
    display: flex;
  }
  .cnt div {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 500;
    width: 30px;
    height: 30px;
    border-radius: 5px;
    color: #fff;
  }
  .cnt .green {
    background-color: #6cc56c;
  }
  .cnt .red {
    margin-left: 10px;
    background-color: #ff6358;
  }
`;

type TScrollableContainer = {
  atBottom?: boolean;
};

export const ScrollableContainer = styled.div<TScrollableContainer>`
  border: solid 1px #ebebeb;
  border-radius: 10px;
  padding: 10px;
  position: relative;
  height: 100%;
  overflow: hidden;

  .scroll-wrapper {
    height: 100%;
    overflow: auto;

    /* Scrollbar styles */
    ::-webkit-scrollbar {
      width: 8px; /* Set the width of the scrollbar */
    }

    ::-webkit-scrollbar-track {
      border-radius: 10px; /* Optional: Add border-radius to track */
    }

    ::-webkit-scrollbar-thumb {
      background-color: #dfdfdf; /* Set the color of the scroll thumb */
      border-radius: 10px; /* Set the border-radius of the scroll thumb */
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: #b6b6b6; /* Set the color when hovering */
    }
  }
  /* ::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 80px; /* control the height of the fade out effect 
    background-image: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 1)
    );
    opacity: ${(props) => (props.atBottom ? 0 : 1)}; /* control the visibility 
    pointer-events: none; /* let users still interact with the content 
  } */

  @media (max-width: 768px) {
    height: calc(100vh / 2 + 20px);
  }
`;
