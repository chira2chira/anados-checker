import { CharClass } from "@/pages";
import { displayCharClass } from "@/utils/stringUtil";
import { Button, ButtonProps } from "@blueprintjs/core";
import { css } from "@emotion/react";

type ClassButtonProps = {
  charClass: CharClass;
  onClassClick: (className: CharClass) => void;
} & ButtonProps;

const ClassButton: React.FC<ClassButtonProps> = (props) => {
  const { charClass, onClassClick, ...buttonProps } = props;

  const handleClassClick = () => {
    props.onClassClick(props.charClass);
  };

  return (
    <Button
      css={css`
        width: 45px;
      `}
      {...buttonProps}
      icon={
        <img
          src={"/static/image/class/" + charClass + ".png"}
          alt={displayCharClass(charClass)}
          width="20px"
          height="20px"
        />
      }
      onClick={handleClassClick}
    />
  );
};

export default ClassButton;
