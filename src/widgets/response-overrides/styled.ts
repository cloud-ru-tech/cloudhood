import styled from '@emotion/styled';

import { themeVars } from '@snack-uikit/figma-tokens';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeVars.space.accordionPrimary.gap};
  width: 100%;
  padding: 4px 6px 14px;
`;

export const SortableItem = styled.div`
  width: 100%;

  &.sortable-ghost {
    opacity: 0.28;
  }

  &.sortable-fallback {
    opacity: 0.96;
    border-radius: ${themeVars.radius.accordion.collapseBlock.primary.round};
    box-shadow: ${themeVars.boxShadow.elevation.level3};
  }
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeVars.space.accordion.collapseBlock.primary.gap};
  box-sizing: border-box;
  width: 100%;
  padding: calc(${themeVars.space.accordion.collapseBlock.primary.verticalPadding} / 2)
    calc(${themeVars.space.accordion.collapseBlock.primary.horizontalPadding} / 2);
  border: ${themeVars.borderWidth.accordion.collapseBlock.primary} solid transparent;
  border-radius: ${themeVars.radius.accordion.collapseBlock.primary.round};
  background-color: ${themeVars.sys.neutral.background2Level};
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${themeVars.space.accordion.collapseBlock.title.gap};
  min-height: 24px;
`;

export const TitleCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
`;

export const Title = styled.span`
  ${themeVars.sans.title.m};
  color: ${themeVars.sys.neutral.textMain};
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TitleFieldWrapper = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${themeVars.space.accordion.collapseBlock.title.functionLayout};
  flex-shrink: 0;
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const RequestRow = styled.div`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 4px;
  align-items: start;
  width: 100%;
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 4px;
  align-items: start;
  width: 100%;
`;
