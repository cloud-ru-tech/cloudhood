import { useUnit } from 'effector-react';

import { Button } from '@cloud-ru/ds-button';
import { Divider } from '@cloud-ru/ds-divider';
import { FieldSelect } from '@cloud-ru/ds-fields';
import { DaySVG, DownloadSVG, LaptopPhoneSVG, NightSVG } from '@cloud-ru/ds-icons/interface/system';
import { ItemId } from '@cloud-ru/ds-list';
import { Typography } from '@cloud-ru/ds-typography';

import { $currentTheme, currentThemeChanged } from '#entities/themeMode/model';
import { $isExportingDebugLogs, generalDebugLogsExported, profileDebugLogsExported } from '#features/export-debug-logs';
import { ThemeMode } from '#shared/constants';

import packageJson from '../../../package.json';
import * as S from './styled';

const THEME_OPTIONS = [
  { id: ThemeMode.Light, content: { label: 'Light' }, beforeContent: <DaySVG /> },
  { id: ThemeMode.Dark, content: { label: 'Dark' }, beforeContent: <NightSVG /> },
  { id: ThemeMode.System, content: { label: 'System' }, beforeContent: <LaptopPhoneSVG /> },
];

export function Settings() {
  const [currentTheme, isExportingDebugLogs, onThemeChanged, onGeneralDebugLogsExported, onProfileDebugLogsExported] =
    useUnit([
      $currentTheme,
      $isExportingDebugLogs,
      currentThemeChanged,
      generalDebugLogsExported,
      profileDebugLogsExported,
    ]);

  const handleThemeChange = (value: ItemId | undefined) => {
    if (value === ThemeMode.Light || value === ThemeMode.Dark || value === ThemeMode.System) {
      onThemeChanged(value);
    }
  };

  return (
    <S.Root>
      <S.Header>
        <Typography variant='title' size='l'>
          Settings
        </Typography>
      </S.Header>

      <Divider orientation='horizontal' />

      <S.Content data-test-id='settings-page'>
        <S.Section>
          <Typography variant='title' size='m'>
            Appearance
          </Typography>
          <FieldSelect
            label='Theme'
            selection='single'
            size='l'
            value={currentTheme}
            items={THEME_OPTIONS}
            onChange={handleThemeChange}
            showClearButton={false}
            searchable={false}
            data-test-id='settings-theme-select'
          />
        </S.Section>

        <S.Section>
          <Typography variant='title' size='m'>
            Diagnostics
          </Typography>
          <S.SectionDescription>
            Download recent debug logs from the background worker.
            <br />
            Extension logs include everything.
            <br />
            Profile logs keep entries for the current profile.
          </S.SectionDescription>
          <S.Actions>
            <Button
              view='filled'
              appearance='neutral'
              size='m'
              fullWidth
              label='Download extension logs'
              icon={<DownloadSVG />}
              loading={isExportingDebugLogs}
              onClick={() => onGeneralDebugLogsExported()}
              data-test-id='export-debug-logs-button'
            />
            <Button
              view='filled'
              appearance='neutral'
              size='m'
              fullWidth
              label='Download profile logs'
              icon={<DownloadSVG />}
              loading={isExportingDebugLogs}
              onClick={() => onProfileDebugLogsExported()}
              data-test-id='export-profile-debug-logs-button'
            />
          </S.Actions>
        </S.Section>

        <S.Section>
          <Typography variant='title' size='m'>
            About
          </Typography>
          <S.SectionDescription data-test-id='settings-version'>Cloudhood {packageJson.version}</S.SectionDescription>
        </S.Section>
      </S.Content>
    </S.Root>
  );
}
