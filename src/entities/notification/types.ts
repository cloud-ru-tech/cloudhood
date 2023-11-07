export enum NotificationVariant {
  Default = 'default',
  ImportProfileSuccess = 'importProfileSuccess',
  ImportProfileError = 'importProfileError',
}

export type NotificationInfo = {
  message: string | null;
  variant: NotificationVariant;
};
