type User = {
  userId: number | undefined;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  weight: number;
  weightUnit: string;
  distanceUnit: string;
  elevationUnit: string;
  dateFormat: string;
  firstDayOfWeek: number;
  ftp: number;
  ftpHistory: Array<{ value: number; date: Date }>;
  tssHistory: Array<{ value: number; date: Date }>;
  powerZoneSystem: string;
  lthr: number;
  lthrHistory: Array<{ value: number; date: Date }>;
  heartRateZoneSystem: string;
  defaultBikeId: number | undefined;
};

export default User;
