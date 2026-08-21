import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';
import { TruncateString } from '@snack-uikit/truncate-string';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  flex: 1;
  padding: 4px 6px 14px;
  overflow-anchor: auto;
`;

export const StateScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 180px;
  padding: 24px 16px;
  text-align: center;
`;

export const StateTitle = styled.p`
  ${themeVars.sans.title.m};
  margin: 0;
  color: ${themeVars.sys.neutral.textMain};
`;

export const StateBody = styled.p`
  ${themeVars.sans.body.m};
  margin: 0;
  color: ${themeVars.sys.neutral.textMain};
`;

export const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${themeVars.sys.neutral.decorDefault};
  border-top-color: ${themeVars.sys.primary.accentDefault};
  border-radius: 50%;
  animation: cloudhood-captured-requests-spin 0.8s linear infinite;

  @keyframes cloudhood-captured-requests-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const SearchRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  flex-shrink: 0;
`;

export const SearchField = styled.div`
  flex: 1 1 0;
  min-width: 0;
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-anchor: auto;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 32px;
  padding: 4px 6px;
  box-sizing: border-box;
  overflow-anchor: auto;
  color: ${themeVars.sys.neutral.textMain};
`;

export const Method = styled.span`
  ${themeVars.sans.title.s};
  flex-shrink: 0;
  color: ${themeVars.sys.neutral.textMain};
`;

export const Status = styled.span`
  ${themeVars.sans.body.s};
  flex-shrink: 0;
  min-width: 72px;
  color: ${themeVars.sys.neutral.textMain};
`;

export const Url = styled.div`
  display: grid;
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  ${themeVars.sans.body.s};
  color: ${themeVars.sys.neutral.textMain};

  > * {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  & * {
    color: inherit;
    min-width: 0;
    max-width: 100%;
  }
`;

export const UrlText = styled(TruncateString)`
  && {
    ${themeVars.sans.body.s};
    color: inherit;
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
    max-width: 100%;
  }
`;

export const MockAction = styled.div`
  flex-shrink: 0;
`;
