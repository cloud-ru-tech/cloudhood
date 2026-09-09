import { useUnit } from 'effector-react';

import { ButtonFilled, ButtonFunction } from '@snack-uikit/button';
import { Divider } from '@snack-uikit/divider';
import { FieldSelect } from '@snack-uikit/fields';
import { ChevronLeftSVG, DaySVG, DownloadSVG, LaptopPhoneSVG, NightSVG } from '@snack-uikit/icons';

import { settingsClosed } from '#entities/app-view';
import { $currentTheme, currentThemeChanged } from '#entities/themeMode/model';
import { $isExportingDebugLogs, debugLogsExported } from '#features/export-debug-logs';
import { ThemeMode } from '#shared/constants';

import packageJson from '../../../package.json';
import * as S from './styled';

const THEME_OPTIONS = [
  { value: ThemeMode.Light, option: 'Light', beforeContent: <DaySVG /> },
  { value: ThemeMode.Dark, option: 'Dark', beforeContent: <NightSVG /> },
  { value: ThemeMode.System, option: 'System', beforeContent: <LaptopPhoneSVG /> },
];

export function Settings() {
  const [currentTheme, isExportingDebugLogs, onSettingsClosed, onThemeChanged, onDebugLogsExported] = useUnit([
    $currentTheme,
    $isExportingDebugLogs,
    settingsClosed,
    currentThemeChanged,
    debugLogsExported,
  ]);

  return (
    <>
      <S.Header>
        <ButtonFunction
          appearance='neutral'
          size='m'
          icon={<ChevronLeftSVG />}
          onClick={() => onSettingsClosed()}
          data-test-id='settings-back-button'
        />
        <S.Title>Settings</S.Title>
      </S.Header>

      <Divider orientation='horizontal' />

      <S.Content data-test-id='settings-page'>
        <S.Section>
          <S.SectionTitle>Appearance</S.SectionTitle>
          <FieldSelect
            label='Theme'
            selection='single'
            size='m'
            value={currentTheme}
            options={THEME_OPTIONS}
            onChange={value => {
              if (typeof value === 'string') {
                onThemeChanged(value as ThemeMode);
              }
            }}
            showClearButton={false}
            searchable={false}
            data-test-id='settings-theme-select'
          />
        </S.Section>

        <S.Section>
          <S.SectionTitle>Diagnostics</S.SectionTitle>
          <S.SectionDescription>
            Download recent debug logs from the background worker to help diagnose header application issues.
          </S.SectionDescription>
          <ButtonFilled
            size='m'
            label='Download debug logs'
            icon={<DownloadSVG />}
            loading={isExportingDebugLogs}
            onClick={() => onDebugLogsExported()}
            data-test-id='export-debug-logs-button'
          />
        </S.Section>

        <S.Section>
          <S.SectionTitle>About</S.SectionTitle>
          <S.SectionDescription data-test-id='settings-version'>Cloudhood {packageJson.version}</S.SectionDescription>
        </S.Section>
      </S.Content>
    </>
  );
}
