import { themeVars } from '@cloud-ru/ds-figma-variables';

type ColorMap = {
  background: string;
  border: string;
  font: string;
};

export const profileColorList: ColorMap[] = [
  {
    background: themeVars.sn.theme.color.primary.accent,
    border: themeVars.sn.theme.color.primary.text,
    font: themeVars.sn.theme.color.primary.onAccent,
  },
  {
    background: themeVars.sn.theme.color.violet.accent,
    border: themeVars.sn.theme.color.violet.text,
    font: themeVars.sn.theme.color.violet.onAccent,
  },
  {
    background: themeVars.sn.theme.color.pink.accent,
    border: themeVars.sn.theme.color.pink.text,
    font: themeVars.sn.theme.color.pink.onAccent,
  },
  {
    background: themeVars.sn.theme.color.red.accent,
    border: themeVars.sn.theme.color.red.text,
    font: themeVars.sn.theme.color.red.onAccent,
  },
  {
    background: themeVars.sn.theme.color.orange.accent,
    border: themeVars.sn.theme.color.orange.text,
    font: themeVars.sn.theme.color.orange.onAccent,
  },
  {
    background: themeVars.sn.theme.color.orange.decor,
    border: themeVars.sn.theme.color.orange.accent,
    font: themeVars.sn.theme.color.orange.text,
  },
  {
    background: themeVars.sn.theme.color.yellow.accent,
    border: themeVars.sn.theme.color.yellow.text,
    font: themeVars.sn.theme.color.yellow.onAccent,
  },
  {
    background: themeVars.sn.theme.color.green.decor,
    border: themeVars.sn.theme.color.green.accent,
    font: themeVars.sn.theme.color.green.text,
  },
  {
    background: themeVars.sn.theme.color.green.accent,
    border: themeVars.sn.theme.color.green.text,
    font: themeVars.sn.theme.color.green.onAccent,
  },
  {
    background: themeVars.sn.theme.color.blue.accent,
    border: themeVars.sn.theme.color.blue.text,
    font: themeVars.sn.theme.color.blue.onAccent,
  },
];
