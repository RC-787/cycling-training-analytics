import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Database from '../common/database';
import Navbar from '../components/navbar';
import Map from '../components/map';
import ActivityStats from '../components/activityStats';
import PerformanceAnalysis from '../components/performanceAnalysis';
import PowerZoneDistribution from '../components/powerZoneDistribution';
import HeartRateZoneDistribution from '../components/heartRateZoneDistribution';
import ActivityCritialPower from '../components/activityCriticalPower';
import ActivityCritialHeartRate from '../components/activityCriticalHeartRate';
import ActivitySegmentResults from '../components/activitySegmentResults';
import ActivityLaps from '../components/activityLaps';
import UserContext, { UserContextType } from '../common/userContext';
import Activity from '../types/activity';
import User from '../types/user';

type State = {
  activity: Activity | undefined;
};

type LocationState = {
  activityId: string;
};

class ActivityPage extends React.Component<RouteComponentProps, State> {
  activityId: number;

  user: User;

  database: Database;

  constructor(props: RouteComponentProps<LocationState>, context: UserContextType) {
    super(props);
    this.state = {
      activity: undefined,
    };
    this.user = context.user;
    this.activityId = Number((props.location.state as LocationState).activityId);
    this.database = Database.getDatabaseInstance();
  }

  async componentDidMount(): Promise<void> {
    const activity = await this.database.getActivity(this.activityId);
    this.setState({ activity });
  }

  render(): JSX.Element {
    const { state } = this;

    if (state.activity === undefined) {
      return <h1>Loading</h1>;
    }

    return (
      <main>
        <Navbar />
        <div className="text-center">
          <span className="fs-3 fw-light">
            {state.activity.title}
            <br />
            {state.activity.date.toLocaleDateString(this.user.dateFormat)}
          </span>
        </div>
        {/* Map and Stats */}
        <div className="row mt-2">
          <div className="col-sm-12 col-md-6 col-lg-8" style={{ minHeight: '250px' }}>
            <div className="component p-3 w-100 h-100">
              {state.activity.latitudeLongitudeData !== undefined && (
                <Map latitudeLongitudeData={state.activity.latitudeLongitudeData} allowZoom renderStartAndEndFlag />
              )}
            </div>
          </div>
          <div className="col-sm-12 col-md-6 col-lg-4">
            <ActivityStats activity={state.activity} user={this.user} />
          </div>
        </div>
        {/* Performance Analysis Chart */}
        <div className="row mt-5">
          <div className="col-12">
            <PerformanceAnalysis activity={state.activity} distanceUnit={this.user.distanceUnit} elevationUnit={this.user.elevationUnit} />
          </div>
        </div>
        {/* Laps */}
        <div className="row mt-5">
          <div className="col-12">
            <ActivityLaps activity={state.activity} distanceUnit={this.user.distanceUnit} />
          </div>
        </div>
        {/* Segment Results */}
        <div className="row mt-5">
          <div className="col-12">
            {state.activity.activityId !== undefined && (
              <ActivitySegmentResults activityId={state.activity.activityId} distanceUnit={this.user.distanceUnit} />
            )}
          </div>
        </div>
        {/* Power and HR zone distribution */}
        <div className="row mt-5">
          <div className="col-sm-12 col-md-6">
            <PowerZoneDistribution activity={state.activity} user={this.user} />
          </div>
          <div className="col-sm-12 col-md-6">
            <HeartRateZoneDistribution activity={state.activity} user={this.user} />
          </div>
        </div>
        {/* Critical Power + Heart Rate Charts */}
        <div className="row mt-5 pb-2">
          <div className="col-sm-12 col-md-6">
            <ActivityCritialPower activity={state.activity} />
          </div>
          <div className="col-sm-12 col-md-6">
            <ActivityCritialHeartRate activity={state.activity} />
          </div>
        </div>
      </main>
    );
  }
}

ActivityPage.contextType = UserContext;

export default ActivityPage;
