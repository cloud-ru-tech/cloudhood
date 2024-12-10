import { themeVars } from '@snack-uikit/figma-tokens';

type ColorMap = {
  background: string;
  border: string;
  font: string;
};

export const profileColorList: ColorMap[] = [
  {
    background: themeVars.sys.primary.accentDefault,
    border: themeVars.sys.primary.textMain,
    font: themeVars.sys.primary.onAccent,
  },
  {
    background: themeVars.sys.violet.accentDefault,
    border: themeVars.sys.violet.textMain,
    font: themeVars.sys.violet.onAccent,
  },
  {
    background: themeVars.sys.pink.accentDefault,
    border: themeVars.sys.pink.textMain,
    font: themeVars.sys.pink.onAccent,
  },
  {
    background: themeVars.sys.red.accentDefault,
    border: themeVars.sys.red.textMain,
    font: themeVars.sys.red.onAccent,
  },
  {
    background: themeVars.sys.orange.accentDefault,
    border: themeVars.sys.orange.textMain,
    font: themeVars.sys.orange.onAccent,
  },
  {
    background: themeVars.sys.orange.textDisabled,
    border: themeVars.sys.orange.textSupport,
    font: themeVars.sys.orange.textMain,
  },
  {
    background: themeVars.sys.yellow.accentDefault,
    border: themeVars.sys.yellow.textMain,
    font: themeVars.sys.yellow.onAccent,
  },
  {
    background: themeVars.sys.green.textDisabled,
    border: themeVars.sys.green.textSupport,
    font: themeVars.sys.green.textMain,
  },
  {
    background: themeVars.sys.green.accentDefault,
    border: themeVars.sys.green.textMain,
    font: themeVars.sys.green.onAccent,
  },
  {
    background: themeVars.sys.blue.accentDefault,
    border: themeVars.sys.blue.textMain,
    font: themeVars.sys.blue.onAccent,
  },
];
