import { Button } from "@progress/kendo-react-buttons";

interface IFilterHideToggleButtonBox {
  isFilterHide: boolean;
  toggleFilterHide: () => void;
}

const FilterHideToggleButtonBox = ({
  isFilterHide,
  toggleFilterHide,
}: IFilterHideToggleButtonBox) => {
  return (
    <Button
      onClick={toggleFilterHide}
      themeColor={"secondary"}
      fillMode={"flat"}
      icon={isFilterHide ? "chevron-down" : "x"}
      style={{
        paddingRight: 0,
      }}
    >
      조회조건
    </Button>
  );
};

export default FilterHideToggleButtonBox;
