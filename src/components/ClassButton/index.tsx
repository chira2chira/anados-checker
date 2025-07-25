import { CharClass } from "@/types/unit";
import { displayCharClass } from "@/utils/stringUtil";
import { getImageUrl } from "@/utils/image";
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

        @media (max-width: 411px) {
          width: 42px;
        }
      `}
      {...buttonProps}
      icon={
        <img
          src={getImageUrl("class/" + charClass + ".png")}
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
