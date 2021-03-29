import { ipcRenderer } from 'electron';
import { SportsLib } from '@sports-alliance/sports-lib';
import { promises as fsPromises } from 'fs';
import { ActivityInterface } from '@sports-alliance/sports-lib/lib/activities/activity.interface';
import { DataInterface } from '@sports-alliance/sports-lib/lib/data/data.interface';
import Database from './common/database';
import Activity from './types/activity';
import Segment from './types/segment';
import SegmentResult from './types/segmentResult';
import User from './types/user';

const database = Database.getDatabaseInstance();

function getDefaultActivityTitle(startDate: Date): string {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${daysOfWeek[startDate.getDay()]} Ride`;
}

function getLatitudeAndLongitudeDataForActivity(importedActivity: ActivityInterface): Array<[number | null, number | null]> | undefined {
  if (importedActivity.hasStreamData('Latitude') && importedActivity.hasStreamData('Longitude')) {
    const latitudeData = importedActivity.getStream('Latitude').getData();
    const longitudeData = importedActivity.getStream('Longitude').getData();

    if (latitudeData != null && longitudeData !== null) {
      const latitudeLongitudeData: Array<[number | null, number | null]> = [];
      for (let i = 0; i < latitudeData.length; i += 1) {
        latitudeLongitudeData.push([latitudeData[i], longitudeData[i]]);
      }
      return latitudeLongitudeData;
    }
  }
  return undefined;
}

function getStream(importedActivity: ActivityInterface, streamName: string): Array<number | null> | undefined {
  if (importedActivity.hasStreamData(streamName)) {
    const streamData = importedActivity.getStream(streamName).getData();
    // Make sure at least one non-zero values exists
    if (streamData.find((x) => x !== null && x !== 0)) {
      return streamData;
    }
  }
  return undefined;
}

function getStat(importedActivity: ActivityInterface, statName: string): number | undefined {
  if (importedActivity.getStat(statName)) {
    const valueAsNumber = Number((importedActivity.getStat(statName) as DataInterface).getValue());
    if (valueAsNumber !== 0) {
      return valueAsNumber;
    }
  }
  return undefined;
}

function getNormalizedPower(powerStream: Array<number | null>): number {
  const rollingAverageWindowSize = 30;
  let currentIndex = 0;
  let windowSum = 0;
  let windowCount = 0;
  let windowAveragesToFourthPowerTotal = 0;

  // Starting at index 0, get the sum of the first rollingAverageWindowSize (30s)
  while (currentIndex < rollingAverageWindowSize) {
    windowSum += powerStream[currentIndex] ?? 0;
    currentIndex += 1;
  }

  // Get the current window average and raise to 4th power
  windowAveragesToFourthPowerTotal += (windowSum / rollingAverageWindowSize) ** 4;
  currentIndex += 1;

  // Now we move forward in the powerStream one step at a time and apply the same logic
  while (currentIndex < powerStream.length) {
    windowSum = windowSum + (powerStream[currentIndex] ?? 0) - (powerStream[currentIndex - rollingAverageWindowSize] ?? 0);
    windowAveragesToFourthPowerTotal += (windowSum / rollingAverageWindowSize) ** 4;
    windowCount += 1;
    currentIndex += 1;
  }

  // Get the average of the windowAveragesToFourthPower
  const averageOfWindowAveragesToFourthPower = windowAveragesToFourthPowerTotal / windowCount;

  // Take the 4th root of the result
  const result = averageOfWindowAveragesToFourthPower ** 0.25;

  return Math.round(result);
}

function convertDegreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

function getDistanceBetweenCoOrdinatesInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const RadiusOfTheEarthInKm = 6371;
  const dLat = convertDegreesToRadians(lat2 - lat1);
  const dLon = convertDegreesToRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(convertDegreesToRadians(lat1)) * Math.cos(convertDegreesToRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInKm = RadiusOfTheEarthInKm * c; // Distance in km
  return distanceInKm * 1000;
}

function getAverage(input: Array<number | null>): number | undefined {
  let sum = 0;
  for (let i = 0; i < input.length; i += 1) {
    sum += input[i] ?? 0;
  }
  return sum / input.length;
}

function getMax(input: Array<number | null>): number | undefined {
  const firstNonNullValue = input.find((x) => x !== null);
  if (firstNonNullValue !== undefined) {
    const nonNullValues = input.filter((x): x is number => x != null);
    return Math.max.apply(null, nonNullValues);
  }
  return undefined;
}

function calculateCriticalData(inputData: Array<number | null>): Array<[number, number]> {
  const criticalData: Array<[number, number]> = [];
  for (let intervalDuration = 1; intervalDuration <= inputData.length; intervalDuration += 1) {
    let sum = 0;
    let index = 0;

    // Starting at index 0, get the first possible average for the specified window
    // For example, if intervalDuration is 10 seconds then this will get the average of the first 10 entries
    while (index < intervalDuration) {
      sum += inputData[index] ?? 0;
      index += 1;
    }
    let intervalMax = sum / intervalDuration;

    // Now we move forward in the array one step at a time and check if we have a better interval max
    while (index < inputData.length) {
      sum = sum + (inputData[index] ?? 0) - (inputData[index - intervalDuration] ?? 0);
      const currentSelectionAverageForInterval = sum / intervalDuration;
      if (currentSelectionAverageForInterval > intervalMax) {
        intervalMax = currentSelectionAverageForInterval;
      }
      index += 1;
    }
    criticalData.push([intervalDuration, Math.round(intervalMax)]);
  }

  return criticalData;
}

async function getActivityFromFile(_event: Electron.IpcRendererEvent, args: { filePath: string; user: User }): Promise<void> {
  const { filePath } = args;
  const fileContent = await fsPromises.readFile(filePath);
  const importResult = await SportsLib.importFromFit(fileContent.buffer);
  const importedActivity = importResult.getFirstActivity();

  const latitudeLongitudeData = getLatitudeAndLongitudeDataForActivity(importedActivity);
  let minLatitude: number | undefined;
  let maxLatitude: number | undefined;
  let minLongitude: number | undefined;
  let maxLongitude: number | undefined;
  if (latitudeLongitudeData !== undefined) {
    const firstNonNullValue = latitudeLongitudeData?.find((x) => x[0] != null && x[1] !== null);
    if (firstNonNullValue !== undefined) {
      minLatitude = Number(firstNonNullValue[0]);
      maxLatitude = minLatitude;
      minLongitude = Number(firstNonNullValue[1]);
      maxLongitude = minLongitude;
      for (let i = 0; i < latitudeLongitudeData.length; i += 1) {
        const latitude = latitudeLongitudeData[i][0];
        const longitude = latitudeLongitudeData[i][1];
        if (latitude !== null && longitude !== null) {
          if (latitude < minLatitude) {
            minLatitude = latitude;
          }
          if (latitude > maxLatitude) {
            maxLatitude = latitude;
          }
          if (longitude < minLongitude) {
            minLongitude = longitude;
          }
          if (longitude > maxLongitude) {
            maxLongitude = longitude;
          }
        }
      }
    }
  }

  const activity: Activity = {
    activityId: undefined,
    userId: -1, // Updated in uploadActivity.tsx
    bikeId: -1, // Updated in uploadActivity.tsx
    date: importedActivity.startDate,
    title: getDefaultActivityTitle(importedActivity.startDate),
    description: undefined,
    distanceInMeters: importedActivity.getDistance().getValue('m'),
    durationInSeconds: importedActivity.getDuration().getValue('s'),
    averagePower: getStat(importedActivity, 'Average Power'),
    averageHeartRate: getStat(importedActivity, 'Average Heart Rate'),
    averageCadence: getStat(importedActivity, 'Average Cadence'),
    averageSpeedInKilometersPerHour: getStat(importedActivity, 'Average speed in kilometers per hour'),
    maxPower: getStat(importedActivity, 'Maximum Power'),
    maxHeartRate: getStat(importedActivity, 'Maximum Heart Rate'),
    maxCadence: getStat(importedActivity, 'Maximum Cadence'),
    maxSpeedInKilometersPerHour: getStat(importedActivity, 'Maximum speed in kilometers per hour'),
    minLatitude,
    maxLatitude,
    minLongitude,
    maxLongitude,
    latitudeLongitudeData,
    distanceData: getStream(importedActivity, 'Distance'),
    powerData: getStream(importedActivity, 'Power'),
    criticalPowerData: undefined,
    heartRateData: getStream(importedActivity, 'Heart Rate'),
    criticalHeartRateData: undefined,
    cadenceData: getStream(importedActivity, 'Cadence'),
    speedDataInKilometersPerHour: getStream(importedActivity, 'Speed in kilometers per hour'),
    elevationDataInMeters: getStream(importedActivity, 'Altitude'),
    gradientData: getStream(importedActivity, 'Grade'),
    tss: undefined,
    intensityFactor: undefined,
  };

  if (activity.powerData !== undefined) {
    activity.criticalPowerData = calculateCriticalData(activity.powerData);

    // Find the user's FTP on the date of the activity
    let ftpAtTimeOfActivity = args.user.ftpHistory
      ?.slice()
      .sort((a, b) => {
        return b.date.getTime() - a.date.getTime();
      })
      .find((x) => x.date < activity.date)?.value;
    // If no FTP entry existed at the time of the activity, just use the first FTP saved after the activity date
    if (ftpAtTimeOfActivity === undefined) {
      ftpAtTimeOfActivity = args.user.ftpHistory
        ?.slice()
        .sort((a, b) => {
          return a.date.getTime() - b.date.getTime();
        })
        .find((x) => x.date > activity.date)?.value;
    }

    if (ftpAtTimeOfActivity !== undefined) {
      const normalizedPower = getNormalizedPower(activity.powerData);
      activity.intensityFactor = normalizedPower / ftpAtTimeOfActivity;
      // TSS = [(s x NP x IF) / (FTP x 3,600)] x 100 where s = length of the workout in seconds, NP = Normalised Power, IF = Intensity Factor
      activity.tss = Math.round(((activity.durationInSeconds * normalizedPower * activity.intensityFactor) / (ftpAtTimeOfActivity * 3600)) * 100);
    }
  }

  if (activity.heartRateData !== undefined) {
    activity.criticalHeartRateData = calculateCriticalData(activity.heartRateData);
  }

  ipcRenderer.send('get-activity-from-file-result', activity);
}

async function checkIfSegmentIsOnActivity(segment: Segment, activity: Activity): Promise<void> {
  if (
    activity.latitudeLongitudeData === undefined ||
    activity.minLatitude === undefined ||
    activity.maxLatitude === undefined ||
    activity.minLongitude === undefined ||
    activity.maxLongitude === undefined
  ) {
    return;
  }

  // Check if segment is within bounding box of the activity
  if (activity.minLatitude > segment.minLatitude) {
    return;
  }
  if (activity.maxLatitude < segment.maxLatitude) {
    return;
  }
  if (activity.minLongitude > segment.minLongitude) {
    return;
  }
  if (activity.maxLongitude < segment.maxLongitude) {
    return;
  }

  const DISTANCE_CONSTRAINT_IN_METERS = 20;
  let indexesOnActivityThatMatchSegmentStartPoint: Array<number> = [];
  const indexesOnActivityThatMatchSegmentEndPoint: Array<number> = [];
  const segmentStartCoOrdinates = segment.latitudeLongitudeData[0];
  const segmentEndCoOrdinates = segment.latitudeLongitudeData[segment.latitudeLongitudeData.length - 1];

  // Check if any point(s) on the activity passed within the specified distance of the segment start or segment end
  for (let i = 0; i < activity.latitudeLongitudeData.length; i += 1) {
    let [latitude, longitude] = activity.latitudeLongitudeData[i];
    if (
      latitude !== null &&
      longitude !== null &&
      latitude >= segment.minLatitude &&
      latitude <= segment.maxLatitude &&
      longitude >= segment.minLongitude &&
      longitude <= segment.maxLongitude
    ) {
      const distanceBetweenPointOnActivityAndSegmentStartInMeters = getDistanceBetweenCoOrdinatesInMeters(
        latitude,
        longitude,
        segmentStartCoOrdinates[0] ?? 0,
        segmentStartCoOrdinates[1] ?? 0
      );
      const distanceBetweenPointOnActivityAndSegmentEndInMeters = getDistanceBetweenCoOrdinatesInMeters(
        latitude,
        longitude,
        segmentEndCoOrdinates[0] ?? 0,
        segmentEndCoOrdinates[1] ?? 0
      );

      if (
        distanceBetweenPointOnActivityAndSegmentStartInMeters <= DISTANCE_CONSTRAINT_IN_METERS ||
        distanceBetweenPointOnActivityAndSegmentEndInMeters <= DISTANCE_CONSTRAINT_IN_METERS
      ) {
        // The current point on the activity is within the specified distance of either the segment start or segment end
        const matchType = distanceBetweenPointOnActivityAndSegmentStartInMeters <= DISTANCE_CONSTRAINT_IN_METERS ? 'SegmentStart' : 'SegmentEnd';
        if (
          matchType === 'SegmentEnd' &&
          (indexesOnActivityThatMatchSegmentStartPoint.length === 0 || indexesOnActivityThatMatchSegmentStartPoint.find((x) => x < i) === undefined)
        ) {
          // If the point on the activity matches the segment end, then make sure we already have at least one match for the segment start within the activity (otherwise the search is pointless)
          // eslint-disable-next-line no-continue
          continue;
        }

        // Lets check if any of the subsequent points on the activity are closer to the segment start/end
        let closestDistanceFromActivityToTargetPointOnSegment =
          matchType === 'SegmentStart' ? distanceBetweenPointOnActivityAndSegmentStartInMeters : distanceBetweenPointOnActivityAndSegmentEndInMeters;
        let indexOfClosestPointOnActivityToTargetPointOnSegment = i;
        if (i + 1 >= activity.latitudeLongitudeData.length) {
          break;
        }
        for (let j = i + 1; j < activity.latitudeLongitudeData.length; j += 1) {
          [latitude, longitude] = activity.latitudeLongitudeData[j];
          if (
            latitude !== null &&
            longitude !== null &&
            latitude >= segment.minLatitude &&
            latitude <= segment.maxLatitude &&
            longitude >= segment.minLongitude &&
            longitude <= segment.maxLongitude
          ) {
            const distanceBetweenCurrentPointAndTargetPointOnSegment = getDistanceBetweenCoOrdinatesInMeters(
              latitude,
              longitude,
              matchType === 'SegmentStart' ? segmentStartCoOrdinates[0] ?? 0 : segmentEndCoOrdinates[0] ?? 0,
              matchType === 'SegmentStart' ? segmentStartCoOrdinates[1] ?? 0 : segmentEndCoOrdinates[1] ?? 0
            );
            if (distanceBetweenCurrentPointAndTargetPointOnSegment < closestDistanceFromActivityToTargetPointOnSegment) {
              // Current point is closer to the segment start/end
              closestDistanceFromActivityToTargetPointOnSegment = distanceBetweenCurrentPointAndTargetPointOnSegment;
              indexOfClosestPointOnActivityToTargetPointOnSegment = j;
              j += 1;
            } else if (distanceBetweenCurrentPointAndTargetPointOnSegment < DISTANCE_CONSTRAINT_IN_METERS) {
              // Current point is still within the allowed constraint
              j += 1;
            } else {
              // We have already passed the closest point
              if (matchType === 'SegmentStart') {
                indexesOnActivityThatMatchSegmentStartPoint.push(indexOfClosestPointOnActivityToTargetPointOnSegment);
              } else {
                indexesOnActivityThatMatchSegmentEndPoint.push(indexOfClosestPointOnActivityToTargetPointOnSegment);
              }
              i = j;
              break;
            }
          }
        }
      }
    }
  }

  // No potential matches found
  if (indexesOnActivityThatMatchSegmentStartPoint.length === 0 || indexesOnActivityThatMatchSegmentEndPoint.length === 0) {
    return;
  }

  // Remove any startIndexes that occured after the max end index since they can't possibly match
  const maxEndIndex = Math.max.apply({}, indexesOnActivityThatMatchSegmentEndPoint);
  indexesOnActivityThatMatchSegmentStartPoint = indexesOnActivityThatMatchSegmentStartPoint.filter((x) => x < maxEndIndex);
  if (indexesOnActivityThatMatchSegmentStartPoint.length === 0) {
    return;
  }

  // Check if the distance between each startIndex and endIndex could potentially match based on the segment length
  const potentialMatchingStartAndEndIndexOfActivity: Array<[number, number]> = [];
  const MAX_TOTAL_DISTANCE_DIFFERENTIAL_IN_METERS = 100;
  for (let j = 0; j < indexesOnActivityThatMatchSegmentStartPoint.length; j += 1) {
    for (let k = 0; k < indexesOnActivityThatMatchSegmentEndPoint.length; k += 1) {
      const currentStartIndex = indexesOnActivityThatMatchSegmentStartPoint[j];
      const currentEndIndex = indexesOnActivityThatMatchSegmentEndPoint[k];
      if (currentEndIndex > currentStartIndex) {
        const startDistance = activity.distanceData?.[currentStartIndex];
        const endDistance = activity.distanceData?.[currentEndIndex];
        if (startDistance !== undefined && startDistance !== null && endDistance !== undefined && endDistance !== null) {
          const distanceBetweenStartAndEnd = endDistance - startDistance;
          if (Math.abs(distanceBetweenStartAndEnd - segment.distanceInMeters) < MAX_TOTAL_DISTANCE_DIFFERENTIAL_IN_METERS) {
            potentialMatchingStartAndEndIndexOfActivity.push([currentStartIndex, currentEndIndex]);
          }
        }
      }
    }
  }

  if (potentialMatchingStartAndEndIndexOfActivity.length === 0) {
    // None of the potential matches have the correct distance
    return;
  }

  // At this point we have potential matches within the activity based on passing the segment startPoint, passing the segment endPoint and matching the total segment length
  // Final check is to see if each point on the segment is between the startPoint and endPoint that we have identified as potential matches
  let moduloValue: number;
  if (segment.latitudeLongitudeData.length < 100) {
    // Check all points on the segment are present in the potential match
    moduloValue = 1;
  } else if (segment.latitudeLongitudeData.length < 1000) {
    // Check every 5th point on the segment is present in the potential match
    moduloValue = 5;
  } else {
    // Check every 10th point on the segment is present in the potential match
    moduloValue = 10;
  }

  const matchingStartAndEndIndexOfActivity: Array<[number, number]> = [];
  for (let i = 0; i < potentialMatchingStartAndEndIndexOfActivity.length; i += 1) {
    let isMatch = true;

    for (let j = 1; j < segment.latitudeLongitudeData.length - 1 && j % moduloValue === 0; j += 1) {
      // Starting with j = 1 since we already know the first point matches

      const segmentPointLatitude = segment.latitudeLongitudeData[j][0];
      const segmentPointLongitude = segment.latitudeLongitudeData[j][1];

      // Check if the point from the segment is on the activity
      let segmentPointIsOnActivity = false;
      for (let k = potentialMatchingStartAndEndIndexOfActivity[i][0]; k < potentialMatchingStartAndEndIndexOfActivity[i][1]; k += 1) {
        const distance = getDistanceBetweenCoOrdinatesInMeters(
          activity.latitudeLongitudeData[k][0] ?? 0,
          activity.latitudeLongitudeData[k][1] ?? 0,
          segmentPointLatitude ?? 0,
          segmentPointLongitude ?? 0
        );
        if (distance < DISTANCE_CONSTRAINT_IN_METERS) {
          segmentPointIsOnActivity = true;
          break;
        }
      }

      if (!segmentPointIsOnActivity) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      // If we get here then the points on the segment are on the activity, so we have a match
      matchingStartAndEndIndexOfActivity.push(potentialMatchingStartAndEndIndexOfActivity[i]);
    }
  }

  if (matchingStartAndEndIndexOfActivity.length === 0) {
    // The full segment was not found on the activity
    return;
  }

  // We have at least 1 match!!!
  const segmentResults: Array<SegmentResult> = [];
  const segmentId = segment.segmentId ?? -1;
  const activityId = activity.activityId ?? -1;
  for (let i = 0; i < matchingStartAndEndIndexOfActivity.length; i += 1) {
    const startIndex = matchingStartAndEndIndexOfActivity[i][0];
    const endIndex = matchingStartAndEndIndexOfActivity[i][1];
    const segmentResult: SegmentResult = {
      segmentResultId: undefined,
      segmentId,
      activityId,
      date: activity.date,
      startIndexOnActivity: startIndex,
      endIndexOnActivity: endIndex,
      durationInSeconds: endIndex - startIndex,
      averagePower: undefined,
      averageHeartRate: undefined,
      averageCadence: undefined,
      averageSpeedInKilometersPerHour: (3.6 * segment.distanceInMeters) / (endIndex - startIndex),
      maxPower: undefined,
      maxHeartRate: undefined,
      maxCadence: undefined,
      maxSpeedInKilometersPerHour: undefined,
      powerData: undefined,
      heartRateData: undefined,
      cadenceData: undefined,
      speedDataInKilometersPerHour: undefined,
    };

    if (activity.powerData !== undefined) {
      const segmentPowerData = activity.powerData.slice(startIndex, endIndex + 1);

      segmentResult.powerData = segmentPowerData;
      segmentResult.averagePower = getAverage(segmentPowerData);
      if (segmentResult.averagePower !== undefined) {
        segmentResult.averagePower = Math.round(segmentResult.averagePower);
      }
      segmentResult.maxPower = getMax(segmentPowerData);
      if (segmentResult.maxPower !== undefined) {
        segmentResult.maxPower = Math.round(segmentResult.maxPower);
      }
    }
    if (activity.heartRateData !== undefined) {
      const segmentHeartRateData = activity.heartRateData.slice(startIndex, endIndex + 1);

      segmentResult.heartRateData = segmentHeartRateData;
      segmentResult.averageHeartRate = getAverage(segmentHeartRateData);
      if (segmentResult.averageHeartRate !== undefined) {
        segmentResult.averageHeartRate = Math.round(segmentResult.averageHeartRate);
      }
      segmentResult.maxHeartRate = getMax(segmentHeartRateData);
      if (segmentResult.maxHeartRate !== undefined) {
        segmentResult.maxHeartRate = Math.round(segmentResult.maxHeartRate);
      }
    }
    if (activity.cadenceData !== undefined) {
      const segmentCadenceData = activity.cadenceData.slice(startIndex, endIndex + 1);

      segmentResult.cadenceData = segmentCadenceData;
      segmentResult.averageCadence = getAverage(segmentCadenceData);
      if (segmentResult.averageCadence !== undefined) {
        segmentResult.averageCadence = Math.round(segmentResult.averageCadence);
      }
      segmentResult.maxCadence = getMax(segmentCadenceData);
      if (segmentResult.maxCadence !== undefined) {
        segmentResult.maxCadence = Math.round(segmentResult.maxCadence);
      }
    }
    if (activity.speedDataInKilometersPerHour !== undefined) {
      const segmentSpeedData = activity.speedDataInKilometersPerHour.slice(startIndex, endIndex + 1);

      segmentResult.speedDataInKilometersPerHour = segmentSpeedData;
      segmentResult.maxSpeedInKilometersPerHour = getMax(segmentSpeedData);
    }

    segmentResults.push(segmentResult);
  }

  segmentResults.forEach(async (segmentResult) => {
    await database.saveSegmentResult(segmentResult);
  });
}

async function segmentCreated(_event: Electron.IpcRendererEvent, segment: Segment): Promise<void> {
  const activityCount = await database.getTotalActivityCount(segment.userId);
  const allActivities = await database.getMostRecentActivities(segment.userId, activityCount, 0);

  allActivities.forEach(async (activity) => {
    await checkIfSegmentIsOnActivity(segment, activity);
  });

  ipcRenderer.send('segment-processing-completed');
}

export default function InitializeBackgroundProcess(): void {
  ipcRenderer.on('get-activity-from-file', getActivityFromFile);
  ipcRenderer.on('segment-created', segmentCreated);
}
