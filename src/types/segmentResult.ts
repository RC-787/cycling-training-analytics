type SegmentResult = {
  segmentResultId: number | undefined;
  segmentId: number;
  activityId: number;
  startIndexOnActivity: number;
  endIndexOnActivity: number;
  date: Date;
  durationInSeconds: number;
  averagePower: number | undefined;
  averageHeartRate: number | undefined;
  averageCadence: number | undefined;
  averageSpeedInKilometersPerHour: number | undefined;
  maxPower: number | undefined;
  maxHeartRate: number | undefined;
  maxCadence: number | undefined;
  maxSpeedInKilometersPerHour: number | undefined;
  powerData: Array<number | null> | undefined;
  heartRateData: Array<number | null> | undefined;
  cadenceData: Array<number | null> | undefined;
  speedDataInKilometersPerHour: Array<number | null> | undefined;
};

export default SegmentResult;
