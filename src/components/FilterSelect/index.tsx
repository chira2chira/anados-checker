import { Colors } from "@blueprintjs/core";
import { css } from "@emotion/react";

type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
};
const FilterSelect: React.FC<FilterSelectProps> = (props) => {
  return (
    <div
      className={"bp5-html-select"}
      css={css`
        flex-grow: 1;
      `}
    >
      <select
        style={{
          background: props.value !== "none" ? Colors.BLUE3 : undefined,
        }}
        onChange={(e) => props.onChange(e.currentTarget.value)}
      >
        {props.children}
      </select>
      <span className="bp5-icon bp5-icon-chevron-down"></span>
    </div>
  );
};

export default FilterSelect;
