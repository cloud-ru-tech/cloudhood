import { Autocomplete, Box, TextField } from '@mui/material';
import { useUnit } from 'effector-react';
import React from 'react';

import { $profilesNameOptions } from '#widgets/sidebar/model';

type Props = {
  checkedList: string[];
  onChangeCheckedList: (list: string[]) => void;
};

export function CheckedHeaderList({ checkedList, onChangeCheckedList }: Props) {
  const [profilesNameOptions] = useUnit([$profilesNameOptions]);

  return (
    <Box mb={3}>
      <Autocomplete
        fullWidth
        multiple
        value={profilesNameOptions.filter(({ id }) => checkedList.includes(id))}
        size='small'
        limitTags={3}
        options={profilesNameOptions}
        getOptionLabel={(option: { id: string; name: string }) => option.name}
        renderInput={params => <TextField {...params} label='Profiles' />}
        onChange={(_, value) => onChangeCheckedList(value.map(({ id }) => id))}
      />
    </Box>
  );
}
