import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  InputGroup,
} from "@blueprintjs/core";
import { css } from "@emotion/react";
import { sendEvent } from "@/utils/gtag";
import { CustomLabelContext } from "@/providers/CustomLabelProvider";

export const INITIAL_LABELS = ["💖", "💛", "💚", "💙", "💜", "🖤", "🤍"];

type CustomLabelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CustomLabelModal: React.FC<CustomLabelProps> = (props) => {
  const { customLabels, setCustomLabels } = useContext(CustomLabelContext);
  const [editedLabels, setEditedLabels] = useState(customLabels);
  const { t } = useTranslation("still");

  const save = () => {
    setCustomLabels(editedLabels);
    props.onClose();
    sendEvent({
      action: "save",
      category: "customLabel",
      label: "success",
    });
  };

  const reset = () => {
    setEditedLabels(customLabels);
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onOpening={reset}
      onClose={props.onClose}
      title={t("button.labelSettings")}
    >
      <DialogBody>
        {editedLabels.map((x, i) => (
          <FormGroup key={i} inline label={`#${i + 1}`}>
            <InputGroup
              css={css`
                width: 8em;
              `}
              value={x}
              onChange={(e) =>
                setEditedLabels((v) => {
                  const tmp = [...v];
                  tmp[i] = e.target.value;
                  return tmp;
                })
              }
            />
          </FormGroup>
        ))}
      </DialogBody>

      <DialogFooter
        actions={
          <>
            <Button minimal onClick={props.onClose}>
              {t("button.labelCancel")}
            </Button>
            <Button intent="primary" onClick={save}>
              {t("button.labelSave")}
            </Button>
          </>
        }
      >
        <Button icon="reset" onClick={() => setEditedLabels(INITIAL_LABELS)}>
          {t("button.labelReset")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
