import { Colors, HTMLSelect, OptionProps } from "@blueprintjs/core";
import { css } from "@emotion/react";

type RateEmojiSelectProps = {
  value: string;
  options: OptionProps[];
  onChange: (value: string) => void;
};
const RateEmojiSelect: React.FC<RateEmojiSelectProps> = (props) => {
  return (
    <HTMLSelect
      iconName="caret-down"
      value={props.value}
      options={props.options}
      onChange={(e) => props.onChange(e.currentTarget.value)}
    />
  );
};

export default RateEmojiSelect;
