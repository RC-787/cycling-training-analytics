import React from 'react';
import { Redirect, RouteComponentProps } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Database from '../common/database';
import UserContext, { UserContextType } from '../common/userContext';
import Navbar from '../components/navbar';
import Map from '../components/map';
import ElevationProfile from '../components/elevationProfile';
import User from '../types/user';
import SegmentType from '../types/segment';
import SegmentResult from '../types/segmentResult';
import UnitConverter from '../common/unitConverter';

type State = {
  segment: SegmentType | undefined;
  segmentResults: Array<SegmentResult>;
  redirectToActivity: boolean;
};

type LocationState = {
  segmentId: string;
};

class Segment extends React.Component<RouteComponentProps, State> {
  segmentId: number;

  user: User;

  database: Database;

  redirectToActivityId = 0;

  constructor(props: RouteComponentProps<LocationState>, context: UserContextType) {
    super(props);
    this.state = {
      segment: undefined,
      segmentResults: [],
      redirectToActivity: false,
    };
    this.user = context.user;
    this.segmentId = Number((props.location.state as LocationState).segmentId);
    this.database = Database.getDatabaseInstance();
  }

  async componentDidMount(): Promise<void> {
    const segment = await this.database.getSegment(this.segmentId);
    const segmentResults = await this.database.getSegmentResults(this.segmentId);
    this.setState({ segment, segmentResults });
  }

  render(): JSX.Element {
    const { state } = this;

    if (state.redirectToActivity) {
      return (
        <Redirect
          to={{
            pathname: '/activity',
            state: { activityId: this.redirectToActivityId },
          }}
        />
      );
    }

    if (state.segment === undefined) {
      return (
        <main>
          <Navbar />
          <h3 className="text-center display-3">Loading</h3>
        </main>
      );
    }

    return (
      <main>
        <Navbar />
        <div className="row pb-3">
          <div className="col-12 mt-5">
            <div className="component p-3">
              <div className="text-center">
                <span className="fs-3 fw-light">Segment Details</span>
                <span className="fs-5 fw-light">
                  <br />
                  {state.segment.segmentName} - {UnitConverter.convertMetersToUnit(state.segment.distanceInMeters, this.user.distanceUnit)}{' '}
                  {this.user.distanceUnit}
                </span>
              </div>
              <div className="row mt-5">
                <div className="col-sm-12 col-md-6" style={{ minHeight: '250px' }}>
                  <Map latitudeLongitudeData={state.segment.latitudeLongitudeData} allowZoom renderStartAndEndFlag />
                </div>
                <div className="col-sm-12 col-md-6">
                  <ElevationProfile segment={state.segment} distanceUnit={this.user.distanceUnit} elevationUnit={this.user.elevationUnit} />
                </div>
                <div className="col-12 mt-5">
                  <table className="table table-striped table-hover table-sm segment-result-table">
                    <thead>
                      <tr>
                        <th scope="col">Rank</th>
                        <th scope="col">Time</th>
                        <th scope="col">Date</th>
                        <th scope="col">Average Power (w)</th>
                        <th scope="col">Average Heart Rate (bpm)</th>
                        <th scope="col">Average Cadence (rpm)</th>
                        <th scope="col">Average Speed ({this.user.distanceUnit}/h)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.segmentResults.map((segmentResult, index) => {
                        return (
                          <tr
                            key={uuidv4()}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              this.redirectToActivityId = segmentResult.activityId;
                              this.setState({ redirectToActivity: true });
                            }}
                          >
                            <td>{index + 1}</td>
                            <td>{UnitConverter.convertSecondsToHHmmss(segmentResult.durationInSeconds)}</td>
                            <td>{segmentResult.date.toLocaleDateString(this.user.dateFormat)}</td>
                            <td>{segmentResult.averagePower ?? 'N/A'}</td>
                            <td>{segmentResult.averageHeartRate ?? 'N/A'}</td>
                            <td>{segmentResult.averageCadence ?? 'N/A'}</td>
                            <td>
                              {segmentResult.averageSpeedInKilometersPerHour !== undefined
                                ? UnitConverter.convertMetersToUnit(segmentResult.averageSpeedInKilometersPerHour * 1000, this.user.distanceUnit)
                                : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
Segment.contextType = UserContext;

export default Segment;
