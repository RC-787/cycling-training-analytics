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

  componentIsMounted = false;

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
    this.componentIsMounted = true;
    const { activityId } = this.props;
    const activitySegmentResults = await this.database.getActivitySegmentResults(activityId);
    if (this.componentIsMounted) {
      this.setState({ activitySegmentResults });
    }

    ipcRenderer.on('segment-processing-completed', this.getActivitySegmentResults);
  }

  componentWillUnmount(): void {
    this.componentIsMounted = false;
    ipcRenderer.off('segment-processing-completed', this.getActivitySegmentResults);
  }

  async getActivitySegmentResults(): Promise<void> {
    const { activityId } = this.props;
    const activitySegmentResults = await this.database.getActivitySegmentResults(activityId);
    if (this.componentIsMounted) {
      this.setState({ activitySegmentResults });
    }
  }

  redirectToSegment(segmentId: number): void {
    this.redirectToSegmentId = segmentId;
    this.setState({ redirectToSegment: true });
  }

  // eslint-disable-next-line class-methods-use-this
  zoomToSegment(segmentResult: ActivitySegmentResult): void {
    PubSub.publish('zoom-to-selection', { startIndex: segmentResult.startIndexOnActivity, endIndex: segmentResult.endIndexOnActivity });
  }

  render(): JSX.Element {
    const { redirectToSegment, activitySegmentResults } = this.state;
    const { distanceUnit } = this.props;

    if (redirectToSegment) {
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
        {activitySegmentResults.length === 0 && (
          <div className="text-center">
            <span className="fs-5 fw-light">No segment results found for this activity</span>
          </div>
        )}
        {activitySegmentResults.length > 0 && (
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
                <th scope="col">Average Speed ({distanceUnit}/h)</th>
                <th scope="col"> </th>
              </tr>
            </thead>
            <tbody>
              {activitySegmentResults.map((activitySegmentResult) => {
                return (
                  <tr key={uuidv4()}>
                    <td style={{ cursor: 'pointer' }} aria-hidden="true" onClick={() => this.redirectToSegment(activitySegmentResult.segmentId)}>
                      {activitySegmentResult.segmentName}
                    </td>
                    <td>{UnitConverter.convertSecondsToHHmmss(activitySegmentResult.durationInSeconds)}</td>
                    <td>{activitySegmentResult.segmentResultRank}</td>
                    <td>+{UnitConverter.convertSecondsToHHmmss(activitySegmentResult.segmentResultTimeDifferenceInSeconds)}</td>
                    <td>{activitySegmentResult.averagePower ?? 'N/A'}</td>
                    <td>{activitySegmentResult.averageHeartRate ?? 'N/A'}</td>
                    <td>{activitySegmentResult.averageCadence ?? 'N/A'}</td>
                    <td>
                      {activitySegmentResult.averageSpeedInKilometersPerHour !== undefined
                        ? UnitConverter.convertMetersToUnit(activitySegmentResult.averageSpeedInKilometersPerHour * 1000, distanceUnit)
                        : 'N/A'}
                    </td>
                    <td className="text-end">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        className="align-top me-2"
                        role="button"
                        onClick={() => this.zoomToSegment(activitySegmentResult)}
                      >
                        <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z" />
                        <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z" />
                        <path
                          fillRule="evenodd"
                          d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"
                        />
                        <title>Zoom to Segment</title>
                      </svg>
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
