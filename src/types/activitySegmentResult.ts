type ActivitySegmentResult = {
  segmentId: number;
  segmentName: string;
  segmentResultRank: number;
  segmentResultTimeDifferenceInSeconds: number;
  startIndexOnActivity: number;
  endIndexOnActivity: number;
  durationInSeconds: number;
  averagePower: number | undefined;
  averageHeartRate: number | undefined;
  averageCadence: number | undefined;
  averageSpeedInKilometersPerHour: number | undefined;
};

export default ActivitySegmentResult;
