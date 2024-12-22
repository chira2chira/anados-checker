import { Colors, HTMLSelect, OptionProps } from "@blueprintjs/core";
import { css } from "@emotion/react";

type FilterSelectProps = {
  style?: React.CSSProperties;
  value: string;
  options: OptionProps[];
  onChange: (value: string) => void;
};
const FilterSelect: React.FC<FilterSelectProps> = (props) => {
  return (
    <div style={{ ...props.style, flexGrow: 1 }}>
      <HTMLSelect
        css={css`
          width: 100%;

          && select,
          && select:hover {
            background-color: ${props.value !== "none"
              ? Colors.BLUE3
              : undefined};
          }
        `}
        iconName="caret-down"
        options={props.options}
        onChange={(e) => props.onChange(e.currentTarget.value)}
      />
    </div>
  );
};

export default FilterSelect;
