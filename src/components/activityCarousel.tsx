import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import Database from '../common/database';
import ActivityCarouselItem from './activityCarouselItem';
import Activity from '../types/activity';
import User from '../types/user';

type Props = {
  user: User;
};

type State = {
  activities: Activity[];
};

export default class ActivityCarousel extends React.Component<Props, State> {
  database: Database;

  totalActivityCount: number;

  numberOfActivitiesToShowAtATime: number;

  currentOffset: number;

  constructor(props: Props) {
    super(props);
    this.state = {
      activities: [],
    };
    this.database = Database.getDatabaseInstance();
    this.totalActivityCount = 0;
    this.numberOfActivitiesToShowAtATime = 4;
    this.currentOffset = 0;
    this.showNextActivity = this.showNextActivity.bind(this);
    this.showPreviousActivity = this.showPreviousActivity.bind(this);
  }

  async componentDidMount(): Promise<void> {
    const { props } = this;
    if (props.user.userId === undefined) {
      return;
    }

    const totalActivityCount = await this.database.getTotalActivityCount(props.user.userId);
    this.totalActivityCount = totalActivityCount;
    const activities = await this.database.getMostRecentActivities(props.user.userId, this.numberOfActivitiesToShowAtATime, this.currentOffset);
    this.setState({ activities });
  }

  async showNextActivity(): Promise<void> {
    const { props } = this;
    if (props.user.userId === undefined) {
      return;
    }

    if (this.currentOffset + this.numberOfActivitiesToShowAtATime < this.totalActivityCount) {
      const activities = await this.database.getMostRecentActivities(props.user.userId, this.numberOfActivitiesToShowAtATime, this.currentOffset + 1);
      this.currentOffset += 1;
      this.setState({ activities });
    }
  }

  async showPreviousActivity(): Promise<void> {
    const { props } = this;
    if (props.user.userId === undefined) {
      return;
    }

    if (this.currentOffset > 0) {
      const activities = await this.database.getMostRecentActivities(props.user.userId, this.numberOfActivitiesToShowAtATime, this.currentOffset - 1);
      this.currentOffset -= 1;
      this.setState({ activities });
    }
  }

  render(): JSX.Element {
    const { props, state } = this;

    return (
      <div className="noselect component p-3">
        <div className="text-center">
          <span className="fs-3 fw-light">Recent Activities</span>
        </div>
        {state.activities.length === 0 && (
          <div className="text-center">
            <span className="fs-5 fw-light">No activities found.</span>
          </div>
        )}

        {state.activities.length > 0 && (
          <div className="row">
            <div className="col-1 d-flex align-items-center justify-content-center">
              <button type="button" className="btn btn-outline-secondary" onClick={this.showPreviousActivity}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" viewBox="0 0 16 16">
                  <path
                    fillRule="evenodd"
                    d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
                  />
                </svg>
              </button>
            </div>
            <div className="col-10">
              <div className="row">
                {state.activities.map((activity) => {
                  return (
                    <div className="col-3" key={uuidv4()}>
                      <ActivityCarouselItem activity={activity} distanceUnit={props.user.distanceUnit} dateFormat={props.user.dateFormat} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="col-1 d-flex align-items-center justify-content-center">
              <button type="button" className="btn btn-outline-secondary" onClick={this.showNextActivity}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" viewBox="0 0 16 16">
                  <path
                    fillRule="evenodd"
                    d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
