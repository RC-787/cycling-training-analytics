import React from 'react';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { Redirect } from 'react-router-dom';
import Database from '../common/database';
import UnitConverter from '../common/unitConverter';
import ActivitySegmentResult from '../types/activitySegmentResult';

type Props = {
  activityId: number;
  distanceUnit: string;
};

type State = {
  activitySegmentResults: Array<ActivitySegmentResult>;
  redirectToSegment: boolean;
};

export default class ActivitySegmentResults extends React.Component<Props, State> {
  database: Database;

  redirectToSegmentId = 0;

  constructor(props: Props) {
    super(props);
    this.state = {
      activitySegmentResults: [],
      redirectToSegment: false,
    };
    this.database = Database.getDatabaseInstance();
    this.getActivitySegmentResults = this.getActivitySegmentResults.bind(this);
  }

  async componentDidMount(): Promise<void> {
    const { props } = this;
    const activitySegmentResults = await this.database.getActivitySegmentResults(props.activityId);
    this.setState({ activitySegmentResults });

    ipcRenderer.on('segment-processing-completed', this.getActivitySegmentResults);
  }

  componentWillUnmount(): void {
    ipcRenderer.off('segment-processing-completed', this.getActivitySegmentResults);
  }

  async getActivitySegmentResults(): Promise<void> {
    const { props } = this;
    const activitySegmentResults = await this.database.getActivitySegmentResults(props.activityId);
    this.setState({ activitySegmentResults });
  }

  redirectToSegment(segmentId: number): void {
    this.redirectToSegmentId = segmentId;
    this.setState({ redirectToSegment: true });
  }

  render(): JSX.Element {
    const { props, state } = this;

    if (state.redirectToSegment) {
      return (
        <Redirect
          to={{
            pathname: '/segment',
            state: { segmentId: this.redirectToSegmentId },
          }}
        />
      );
    }

    return (
      <section className="component p-3">
        <div className="text-center mb-3">
          <span className="fs-3 fw-light">Segment Results</span>
        </div>
        {state.activitySegmentResults.length === 0 && (
          <div className="text-center">
            <span className="fs-5 fw-light">No segment results found for this activity</span>
          </div>
        )}
        {state.activitySegmentResults.length > 0 && (
          <table className="table table-striped table-hover table-sm segment-result-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Time</th>
                <th scope="col">Rank</th>
                <th scope="col">Difference</th>
                <th scope="col">Average Power (w)</th>
                <th scope="col">Average Heart Rate (bpm)</th>
                <th scope="col">Average Cadence (rpm)</th>
                <th scope="col">Average Speed ({props.distanceUnit}/h)</th>
              </tr>
            </thead>
            <tbody>
              {state.activitySegmentResults.map((activitySegmentResult) => {
                return (
                  <tr key={uuidv4()} style={{ cursor: 'pointer' }} onClick={() => this.redirectToSegment(activitySegmentResult.segmentId)}>
                    <td>{activitySegmentResult.segmentName}</td>
                    <td>{UnitConverter.convertSecondsToHHmmss(activitySegmentResult.durationInSeconds)}</td>
                    <td>{activitySegmentResult.segmentResultRank}</td>
                    <td>+{UnitConverter.convertSecondsToHHmmss(activitySegmentResult.segmentResultTimeDifferenceInSeconds)}</td>
                    <td>{activitySegmentResult.averagePower ?? 'N/A'}</td>
                    <td>{activitySegmentResult.averageHeartRate ?? 'N/A'}</td>
                    <td>{activitySegmentResult.averageCadence ?? 'N/A'}</td>
                    <td>
                      {activitySegmentResult.averageSpeedInKilometersPerHour !== undefined
                        ? UnitConverter.convertMetersToUnit(activitySegmentResult.averageSpeedInKilometersPerHour * 1000, props.distanceUnit)
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
}
