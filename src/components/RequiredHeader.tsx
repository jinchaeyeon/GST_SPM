import { GridHeaderCellProps } from "@progress/kendo-react-grid";

interface ProductNameHeaderProps extends GridHeaderCellProps {
  children: any;
}

const RequiredHeader = (props: ProductNameHeaderProps) => {
  return (
    <span className="k-cell-inner">
      <a className="k-link" onClick={props.onClick}>
        <span style={{ color: "#ff6358" }}>{props.title}</span>
        {props.children}
      </a>
    </span>
  );
};

export default RequiredHeader;
