type Bike = {
  bikeId: number | undefined;
  userId: number;
  description: string;
  distanceCoveredInKm: number;
  ridingTimeInSeconds: number;
  isDefaultBike: boolean;
};

export default Bike;
