import { Colors, HTMLSelect, OptionProps } from "@blueprintjs/core";
import { css } from "@emotion/react";

type UserLabelEmojiSelectProps = {
  value: string;
  options: OptionProps[];
  onChange: (value: string) => void;
};
const UserLabelEmojiSelect: React.FC<UserLabelEmojiSelectProps> = (props) => {
  return (
    <HTMLSelect
      iconName="caret-down"
      value={props.value}
      options={props.options}
      onChange={(e) => props.onChange(e.currentTarget.value)}
    />
  );
};

export default UserLabelEmojiSelect;
