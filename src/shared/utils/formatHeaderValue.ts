import { RequestHeader } from '#entities/request-profile/types';
import { DELIMITER } from '#features/selected-profile-request-headers/paste/constant';

type ProcessValue = {
  pastedValue: string;
  header?: RequestHeader;
};

export const formatHeaderValue = ({ pastedValue, header }: ProcessValue): { name: string; value: string } => {
  const [name, value] = pastedValue.split(DELIMITER).map(element => element.trim());

  return {
    name: name.length ? name : header?.name || '',
    value: value.length ? value : header?.value || '',
  };
};
