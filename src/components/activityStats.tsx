import React from 'react';
import UnitConverter from '../common/unitConverter';
import Activity from '../types/activity';
import User from '../types/user';

type Props = {
  activity: Activity;
  user: User;
};

type State = {
  editActivity: false;
};

export default class ActivityStats extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      editActivity: false,
    };
  }

  render(): JSX.Element {
    const { editActivity } = this.state;
    const { activity, user } = this.props;

    if (editActivity) {
      return <h1>Edit Activity</h1>;
    }

    let averageSpeed = 'N/A';
    if (activity.averageSpeedInKilometersPerHour !== undefined) {
      averageSpeed = UnitConverter.convertMetersToUnit(activity.averageSpeedInKilometersPerHour * 1000, user.distanceUnit);
    }
    let maxSpeed = 'N/A';
    if (activity.maxSpeedInKilometersPerHour !== undefined) {
      maxSpeed = UnitConverter.convertMetersToUnit(activity.maxSpeedInKilometersPerHour * 1000, user.distanceUnit);
    }

    return (
      <div className="component p-3">
        <table className="table table-striped table-hover segment-result-table">
          <tbody>
            <tr>
              <td>Duration: </td>
              <td className="text-start" colSpan={2}>
                {UnitConverter.convertSecondsToHHmmss(activity.durationInSeconds)}
              </td>
            </tr>
            <tr>
              <td>Distance ({user.distanceUnit}):</td>
              <td className="text-start" colSpan={2}>
                {UnitConverter.convertMetersToUnit(activity.distanceInMeters, user.distanceUnit)}
              </td>
            </tr>
            <tr>
              <td>Speed ({user.distanceUnit}/h):</td>
              <td className="text-start">
                <sub>AVG </sub>
                {averageSpeed}
              </td>
              <td className="text-start">
                <sub>MAX </sub>
                {maxSpeed}
              </td>
            </tr>
            <tr>
              <td>Power (W):</td>
              <td className="text-start">
                <sub>AVG </sub>
                {activity.averagePower ?? 'N/A'}
              </td>
              <td className="text-start">
                <sub>MAX </sub>
                {activity.maxPower ?? 'N/A'}
              </td>
            </tr>
            <tr>
              <td>Heart Rate (bpm):</td>
              <td className="text-start">
                <sub>AVG </sub>
                {activity.averageHeartRate ?? 'N/A'}
              </td>
              <td className="text-start">
                <sub>MAX </sub>
                {activity.maxHeartRate ?? 'N/A'}
              </td>
            </tr>
            <tr>
              <td>Cadence (rpm):</td>
              <td className="text-start">
                <sub>AVG </sub>
                {activity.averageCadence ?? 'N/A'}
              </td>
              <td className="text-start">
                <sub>MAX </sub>
                {activity.maxCadence ?? 'N/A'}
              </td>
            </tr>
            <tr>
              <td>TSS: </td>
              <td className="text-start" colSpan={2}>
                {activity.tss ?? 'N/A'}
              </td>
            </tr>
            <tr>
              <td>IF: </td>
              <td className="text-start" colSpan={2}>
                {activity.intensityFactor?.toFixed(3) ?? 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
