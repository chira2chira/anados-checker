import { Colors, HTMLSelect, OptionProps } from "@blueprintjs/core";
import { css } from "@emotion/react";

type FilterSelectProps = {
  value: string;
  options: OptionProps[];
  onChange: (value: string) => void;
};
const FilterSelect: React.FC<FilterSelectProps> = (props) => {
  return (
    <HTMLSelect
      css={css`
        flex-grow: 1;

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
  );
};

export default FilterSelect;
