type Activity = {
  activityId: number | undefined;
  userId: number;
  bikeId: number | undefined;
  date: Date;
  title: string;
  description: string | undefined;
  distanceInMeters: number;
  durationInSeconds: number;
  averagePower: number | undefined;
  averageHeartRate: number | undefined;
  averageCadence: number | undefined;
  averageSpeedInKilometersPerHour: number | undefined;
  maxPower: number | undefined;
  maxHeartRate: number | undefined;
  maxCadence: number | undefined;
  maxSpeedInKilometersPerHour: number | undefined;
  minLatitude: number | undefined;
  maxLatitude: number | undefined;
  minLongitude: number | undefined;
  maxLongitude: number | undefined;
  latitudeLongitudeData: Array<[number | null, number | null]> | undefined;
  distanceData: Array<number | null> | undefined;
  powerData: Array<number | null> | undefined;
  criticalPowerData: Array<[number, number]> | undefined; // DurationInSeconds, Power
  heartRateData: Array<number | null> | undefined;
  criticalHeartRateData: Array<[number, number]> | undefined; // DurationInSeconds, HeartRate
  cadenceData: Array<number | null> | undefined;
  speedDataInKilometersPerHour: Array<number | null> | undefined;
  elevationDataInMeters: Array<number | null> | undefined;
  gradientData: Array<number | null> | undefined;
  tss: number | undefined;
  intensityFactor: number | undefined;
};

export default Activity;
