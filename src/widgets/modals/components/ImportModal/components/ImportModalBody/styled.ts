import styled from '@emotion/styled';
import { IconButton as _IconButton, Typography, TypographyProps } from '@mui/material';

export const IconButton = styled(_IconButton)`
  padding: 0;
  width: 32px;
  transform: translateX(8px);
`;

export const HelperText = styled(Typography)<TypographyProps & { component: React.ElementType }>`
  display: block;
  height: 20px;
`;
