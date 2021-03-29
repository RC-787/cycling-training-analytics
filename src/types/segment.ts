type Segment = {
  segmentId: number | undefined;
  userId: number;
  segmentName: string;
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  distanceInMeters: number;
  latitudeLongitudeData: Array<[number | null, number | null]>;
  elevationDataInMeters: Array<number | null> | undefined;
  gradientData: Array<number | null> | undefined;
  distanceDataInMeters: Array<number | null>;
};

export default Segment;
