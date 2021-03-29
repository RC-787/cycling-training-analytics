import React from 'react';
import Navbar from '../components/navbar';
import ActivityCarousel from '../components/activityCarousel';
import FitnessTracker from '../components/fitnessTracker';
import UserContext, { UserContextType } from '../common/userContext';
import CriticalPowerRecord from '../components/criticalPowerRecord';
import User from '../types/user';
import CriticalHeartRateRecord from '../components/criticalHeartRateRecord';
import FtpHistory from '../components/ftpHistory';
import LthrHistory from '../components/lthrHistory';

class Dashboard extends React.Component<unknown> {
  user: User;

  constructor(props: unknown, context: UserContextType) {
    super(props);
    this.user = context.user;
  }

  render(): JSX.Element {
    return (
      <main>
        <Navbar />
        <div className="row pb-3">
          <div className="col-12 mt-5">
            <ActivityCarousel user={this.user} />
          </div>
          <div className="col-12 mt-5">
            <FitnessTracker user={this.user} />
          </div>
          <div className="col-sm-12 col-md-6 mt-5">
            <CriticalPowerRecord user={this.user} />
          </div>
          <div className="col-sm-12 col-md-6 mt-5">
            <CriticalHeartRateRecord user={this.user} />
          </div>
          <div className="col-sm-12 col-md-6 mt-5">
            <FtpHistory user={this.user} />
          </div>
          <div className="col-sm-12 col-md-6 mt-5">
            <LthrHistory user={this.user} />
          </div>
        </div>
      </main>
    );
  }
}

Dashboard.contextType = UserContext;

export default Dashboard;
