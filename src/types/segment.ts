type Segment = {
  segmentId: number | undefined;
  userId: number;
  segmentName: string;
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  distanceInMeters: number;
  latitudeLongitudeData: Array<{ latitude: number; longitude: number }>;
  elevationDataInMeters: Array<number> | undefined;
  gradientData: Array<number> | undefined;
  distanceDataInMeters: Array<number>;
};

export default Segment;
