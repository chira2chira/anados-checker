import { css } from "@emotion/react";

export const main = css`
  max-width: 65em;
  margin: auto;
  padding: 40px 15px 0;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;

  & .char-list {
    opacity: 1;
    transition: opacity 0.7s ease;
  }

  &.flash .char-list {
    opacity: 0;
    transition: none;
  }
`;

export const title = css`
  margin-bottom: 20px;

  &:link,
  &:visited {
    color: #f6f7f9;
  }
`;
