import Dexie from 'dexie';
import User from '../types/user';
import Bike from '../types/bike';
import Activity from '../types/activity';
import ZoneSystem from '../types/zoneSystem';
import Segment from '../types/segment';
import SegmentResult from '../types/segmentResult';
import ActivitySegmentResult from '../types/activitySegmentResult';

export default class Database extends Dexie {
  private static instance: Database;

  users: Dexie.Table<User, number>;

  bikes: Dexie.Table<Bike, number>;

  activities: Dexie.Table<Activity, number>;

  segments: Dexie.Table<Segment, number>;

  segmentResults: Dexie.Table<SegmentResult, number>;

  zoneSystems: Dexie.Table<ZoneSystem, number>;

  private constructor() {
    super('CyclingTrainingAnalyticsDatabase');
    this.version(1).stores({
      users: 'userId++',
      bikes: 'bikeId++, userId',
      activities:
        'activityId++, userId, bikeId, date, distanceInMeters, durationInSeconds, averagePower, averageHeartRate, averageCadence, averageSpeedInKilometersPerHour, maxPower, maxHeartRate, maxCadence, maxSpeedInKilometersPerHour',
      segments: 'segmentId++, userId,  minLatitude, maxLatitude, minLongitude, maxLongitude',
      segmentResults: 'segmentResultId++, segmentId,  activityId, date, durationInSeconds',
      zoneSystems: 'zoneSystemId++, zoneSystemType',
    });

    this.users = this.table('users');
    this.bikes = this.table('bikes');
    this.activities = this.table('activities');
    this.segments = this.table('segments');
    this.segmentResults = this.table('segmentResults');
    this.zoneSystems = this.table('zoneSystems');
    this.populateDatabase = this.populateDatabase.bind(this);
    this.on('populate', this.populateDatabase);
  }

  private async populateDatabase(): Promise<void> {
    await this.zoneSystems.bulkPut([
      { zoneSystemId: undefined, zoneSystemName: 'Coggan', zoneSystemType: 'Power' },
      { zoneSystemId: undefined, zoneSystemName: 'Polarized', zoneSystemType: 'Power' },
      { zoneSystemId: undefined, zoneSystemName: 'Coggan', zoneSystemType: 'HeartRate' },
    ]);
  }

  public static getDatabaseInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // #region Users
  public async getAllUsers(): Promise<User[]> {
    return this.users.toArray();
  }

  public async saveUser(user: User): Promise<User> {
    const userId = await this.users.put(user);
    const result = await this.users.get(userId);

    if (result !== undefined) {
      return result;
    }
    throw new Error('An error occured when saving User.');
  }
  // #endregion

  // #region Bikes
  public async saveBike(bike: Bike): Promise<Bike> {
    const bikeId = await this.bikes.put(bike);
    const result = await this.bikes.get(bikeId);

    if (result !== undefined) {
      return result;
    }
    throw new Error('An error occured when saving Bike.');
  }

  public async getBikes(userId: number): Promise<Bike[]> {
    return this.bikes.where('userId').equals(userId).toArray();
  }
  // #endregion

  // #region Activities
  public async saveActivity(activity: Activity): Promise<Activity> {
    const activityId = await this.activities.put(activity);
    const result = await this.activities.get(activityId);

    if (result !== undefined) {
      return result;
    }
    throw new Error('An error occured when saving Activity.');
  }

  public async getTotalActivityCount(userId: number): Promise<number> {
    return (await this.activities.where('userId').equals(userId).toArray()).length;
  }

  public async getActivity(activityId: number): Promise<Activity> {
    const result = await this.activities.get(activityId);
    if (result !== undefined) {
      return result;
    }
    throw new Error('An error occured when retrieving Activity.');
  }

  public async getMostRecentActivities(userId: number, limit: number, offset: number): Promise<Activity[]> {
    return this.activities
      .orderBy('date')
      .reverse()
      .and((x) => x.userId === userId)
      .offset(offset)
      .limit(limit)
      .toArray();
  }

  public async getActivitiesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Activity[]> {
    return this.activities
      .where('userId')
      .equals(userId)
      .and((x) => x.date > startDate && x.date < endDate)
      .toArray();
  }

  public async deleteActivity(activityId: number): Promise<void> {
    await this.activities.delete(activityId);
  }
  // #endregion

  // #region Segments
  public async saveSegment(segment: Segment): Promise<Segment> {
    const segmentId = await this.segments.put(segment);
    const result = await this.segments.get(segmentId);

    if (result !== undefined) {
      return result;
    }
    throw new Error('An error occured when saving Segment.');
  }

  public async getSegment(segmentId: number): Promise<Segment> {
    const result = await this.segments.get(segmentId);

    if (result !== undefined) {
      return result;
    }
    throw new Error('An error occured when retireving Segment.');
  }

  public async getAllSegments(userId: number): Promise<Array<Segment>> {
    return this.segments.where('userId').equals(userId).toArray();
  }

  public async getSegments(segmentIds: Array<number>): Promise<Array<Segment>> {
    const result = await this.segments.bulkGet(segmentIds);

    if (result !== undefined) {
      return result.filter((x): x is Segment => x !== undefined);
    }
    throw new Error('An error occured when retireving Segments.');
  }
  // #endregion

  // #region SegmentResults
  public async saveSegmentResult(segmentResult: SegmentResult): Promise<SegmentResult> {
    const segmentResultId = await this.segmentResults.put(segmentResult);
    const result = await this.segmentResults.get(segmentResultId);

    if (result !== undefined) {
      return result;
    }
    throw new Error('An error occured when saving SegmentResult.');
  }

  public async getSegmentResults(segmentId: number): Promise<Array<SegmentResult>> {
    const results = await this.segmentResults.where('segmentId').equals(segmentId).toArray();
    return results.sort((a, b) => a.durationInSeconds - b.durationInSeconds);
  }

  public async getActivitySegmentResults(activityId: number): Promise<Array<ActivitySegmentResult>> {
    const segmentResults = await this.segmentResults.where('activityId').equals(activityId).toArray();
    const segmentIds = [...new Set(segmentResults.map((x) => x.segmentId))];
    const segments = await this.getSegments(segmentIds);
    const promises: Array<Promise<Array<SegmentResult>>> = [];
    segmentIds.forEach((x) => {
      promises.push(this.getSegmentResults(x));
    });
    const overallSegmentResults = await (await Promise.all(promises)).flat();

    const result: Array<ActivitySegmentResult> = [];
    segmentResults.forEach((x) => {
      const overallOrderedSegmentResults = overallSegmentResults
        .filter((z) => z.segmentId === x.segmentId)
        .sort((a, b) => a.durationInSeconds - b.durationInSeconds);
      result.push({
        segmentId: x.segmentId,
        segmentName: segments.find((y) => y.segmentId === x.segmentId)?.segmentName ?? 'N/A',
        segmentResultRank: overallOrderedSegmentResults.findIndex((c) => c.segmentResultId === x.segmentResultId) + 1,
        segmentResultTimeDifferenceInSeconds: x.durationInSeconds - overallOrderedSegmentResults[0].durationInSeconds,
        startIndexOnActivity: x.startIndexOnActivity,
        endIndexOnActivity: x.endIndexOnActivity,
        durationInSeconds: x.durationInSeconds,
        averagePower: x.averagePower,
        averageHeartRate: x.averageHeartRate,
        averageCadence: x.averageCadence,
        averageSpeedInKilometersPerHour: x.averageSpeedInKilometersPerHour,
      });
    });
    return result;
  }

  public async deleteActivitySegmentResults(activityId: number): Promise<void> {
    await this.segmentResults.where('activityId').equals(activityId).delete();
  }
  // #endregion
}
