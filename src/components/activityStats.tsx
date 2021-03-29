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
    const { props, state } = this;

    if (state.editActivity) {
      return <h1>Edit Activity</h1>;
    }

    let averageSpeed = 'N/A';
    if (props.activity.averageSpeedInKilometersPerHour !== undefined) {
      averageSpeed = UnitConverter.convertMetersToUnit(props.activity.averageSpeedInKilometersPerHour * 1000, props.user.distanceUnit);
    }
    let maxSpeed = 'N/A';
    if (props.activity.maxSpeedInKilometersPerHour !== undefined) {
      maxSpeed = UnitConverter.convertMetersToUnit(props.activity.maxSpeedInKilometersPerHour * 1000, props.user.distanceUnit);
    }

    return (
      <div className="component p-3">
        <table className="table table-striped table-hover segment-result-table">
          <tbody>
            <tr>
              <td>Duration: </td>
              <td className="text-start" colSpan={2}>
                {UnitConverter.convertSecondsToHHmmss(props.activity.durationInSeconds)}
              </td>
            </tr>
            <tr>
              <td>Distance ({props.user.distanceUnit}):</td>
              <td className="text-start" colSpan={2}>
                {UnitConverter.convertMetersToUnit(props.activity.distanceInMeters, props.user.distanceUnit)}
              </td>
            </tr>
            <tr>
              <td>Speed ({props.user.distanceUnit}/h):</td>
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
                {props.activity.averagePower ?? 'N/A'}
              </td>
              <td className="text-start">
                <sub>MAX </sub>
                {props.activity.maxPower ?? 'N/A'}
              </td>
            </tr>
            <tr>
              <td>Heart Rate (bpm):</td>
              <td className="text-start">
                <sub>AVG </sub>
                {props.activity.averageHeartRate ?? 'N/A'}
              </td>
              <td className="text-start">
                <sub>MAX </sub>
                {props.activity.maxHeartRate ?? 'N/A'}
              </td>
            </tr>
            <tr>
              <td>Cadence (rpm):</td>
              <td className="text-start">
                <sub>AVG </sub>
                {props.activity.averageCadence ?? 'N/A'}
              </td>
              <td className="text-start">
                <sub>MAX </sub>
                {props.activity.maxCadence ?? 'N/A'}
              </td>
            </tr>
            <tr>
              <td>TSS: </td>
              <td className="text-start" colSpan={2}>
                {props.activity.tss ?? 'N/A'}
              </td>
            </tr>
            <tr>
              <td>IF: </td>
              <td className="text-start" colSpan={2}>
                {props.activity.intensityFactor?.toFixed(3) ?? 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
