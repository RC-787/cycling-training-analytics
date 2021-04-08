import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import UnitConverter from '../common/unitConverter';
import Activity from '../types/activity';

type Props = {
  activity: Activity;
  distanceUnit: string;
};

type LapDetails = {
  durationInSeconds: number;
  distanceInMeters: number;
  averagePower: number | undefined;
  averageHeartRate: number | undefined;
  averageCadence: number | undefined;
  averageSpeedInKilometersPerHour: number | undefined;
};

function getAverage(data: Array<number | null> | undefined, startIndex: number, endIndex: number): number | undefined {
  if (data === undefined || data.length < startIndex || data.length < endIndex) {
    return undefined;
  }

  const targetData = data.slice(startIndex, endIndex + 1);
  let sum = 0;
  for (let i = 0; i < targetData.length; i += 1) {
    sum += targetData[i] ?? 0;
  }
  return sum / targetData.length;
}

export default function activityLaps(props: Props): JSX.Element {
  const { activity, distanceUnit } = props;

  const lapDetails: Array<LapDetails> = [];
  for (let i = 0; i < activity.laps.length; i += 1) {
    lapDetails.push({
      durationInSeconds: activity.laps[i].endIndex - activity.laps[i].startIndex,
      distanceInMeters: activity.distanceData?.[activity.laps[i].endIndex - activity.laps[i].startIndex] ?? 0,
      averagePower: getAverage(activity.powerData, activity.laps[i].startIndex, activity.laps[i].endIndex),
      averageHeartRate: getAverage(activity.heartRateData, activity.laps[i].startIndex, activity.laps[i].endIndex),
      averageCadence: getAverage(activity.cadenceData, activity.laps[i].startIndex, activity.laps[i].endIndex),
      averageSpeedInKilometersPerHour: getAverage(activity.speedDataInKilometersPerHour, activity.laps[i].startIndex, activity.laps[i].endIndex),
    });
  }

  return (
    <section className="component p-3">
      <div className="text-center mb-3">
        <span className="fs-3 fw-light">Laps</span>
      </div>
      {activity.laps.length === 0 && (
        <div className="text-center">
          <span className="fs-5 fw-light">No laps found for this activity</span>
        </div>
      )}
      {activity.laps.length > 0 && (
        <table className="table table-striped table-hover table-sm segment-result-table">
          <thead>
            <tr>
              <th scope="col">Duration</th>
              <th scope="col">Distance ({distanceUnit})</th>
              <th scope="col">Average Power (w)</th>
              <th scope="col">Average Heart Rate (bpm)</th>
              <th scope="col">Average Cadence (rpm)</th>
              <th scope="col">Average Speed ({distanceUnit}/h)</th>
            </tr>
          </thead>
          <tbody>
            {lapDetails.map((lap) => {
              return (
                <tr key={uuidv4()} style={{ cursor: 'pointer' }}>
                  <td>{UnitConverter.convertSecondsToHHmmss(lap.durationInSeconds)}</td>
                  <td>{UnitConverter.convertMetersToUnit(lap.distanceInMeters, distanceUnit)}</td>
                  <td>{lap.averagePower?.toFixed(0) ?? 'N/A'}</td>
                  <td>{lap.averageHeartRate?.toFixed(0) ?? 'N/A'}</td>
                  <td>{lap.averageCadence?.toFixed(0) ?? 'N/A'}</td>
                  <td>
                    {lap.averageSpeedInKilometersPerHour !== undefined
                      ? UnitConverter.convertMetersToUnit(lap.averageSpeedInKilometersPerHour * 1000, props.distanceUnit)
                      : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
