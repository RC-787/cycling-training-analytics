/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Redirect } from 'react-router-dom';
import Slider, { LazyLoadTypes } from 'react-slick';
import { v4 as uuidv4 } from 'uuid';
import Database from '../common/database';
import UnitConverter from '../common/unitConverter';
import Activity from '../types/activity';
import User from '../types/user';
import Map from './map';

type Props = {
  user: User;
};

type State = {
  redirectToActivity: boolean;
  totalActivityCount: number | undefined;
  activities: Activity[];
};

export default class ActivityCarousel extends React.Component<Props, State> {
  containerId: string;

  database: Database;

  activityId: number | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      redirectToActivity: false,
      totalActivityCount: undefined,
      activities: [],
    };
    this.containerId = uuidv4();
    this.database = Database.getDatabaseInstance();
  }

  async componentDidMount(): Promise<void> {
    const { user } = this.props;
    if (user.userId !== undefined) {
      const totalActivityCount = await this.database.getTotalActivityCount(user.userId);
      const activities = await this.database.getMostRecentActivities(user.userId, 4, 0);
      this.setState({ totalActivityCount, activities });
    }
  }

  render(): JSX.Element {
    const { totalActivityCount, activities, redirectToActivity } = this.state;

    if (redirectToActivity) {
      return (
        <Redirect
          to={{
            pathname: '/activity',
            state: { activityId: this.activityId },
          }}
        />
      );
    }

    if (totalActivityCount === undefined) {
      return (
        <div className="noselect text-center component p-3">
          <span className="fs-3 fw-light">Recent Activities</span>
          <br />
          <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      );
    }

    if (totalActivityCount === 0) {
      return (
        <div className="noselect text-center component p-3">
          <span className="fs-3 fw-light">Recent Activities</span>
          <br />
          <div className="d-flex justify-content-center">
            <span className="fs-5 fw-light">
              <br />
              No activities found.
            </span>
          </div>
        </div>
      );
    }

    const { user } = this.props;
    const lazyLoadValue = 'ondemand' as LazyLoadTypes;
    const settings = {
      dots: false,
      infinite: false,
      speed: 500,
      slidesToShow: 3,
      slidesToScroll: 1,
      lazyLoad: lazyLoadValue,
      beforeChange: async (_currentIndex: number, nextIndex: number) => {
        if (nextIndex + 3 >= activities.length && activities.length < totalActivityCount) {
          if (user.userId !== undefined) {
            const updatedActivities = await this.database.getMostRecentActivities(user.userId, activities.length + 1, 0);
            this.setState({ activities: updatedActivities });
          }
        }
      },
    };

    return (
      <div className="noselect text-center component p-3" id={this.containerId}>
        <span className="fs-3 fw-light">Recent Activities</span>
        <Slider {...settings}>
          {activities.map((activity) => {
            return (
              <div key={uuidv4()}>
                <div
                  className="card border-secondary component-background component-text mx-auto"
                  role="button"
                  tabIndex={-1}
                  aria-hidden
                  onClick={() => {
                    this.activityId = activity.activityId;
                    this.setState({ redirectToActivity: true });
                  }}
                  style={{ width: '90%', cursor: 'pointer' }}
                >
                  <div className="card-body" style={{ minHeight: '200px' }}>
                    <h5 className="card-title">{activity.title}</h5>
                    <div className="activity-carousel-item-map">
                      {activity.latitudeLongitudeData !== undefined && (
                        <Map latitudeLongitudeData={activity.latitudeLongitudeData} allowZoom={false} renderStartAndEndFlag={false} />
                      )}
                    </div>
                    <div className="input-group mt-1 justify-content-center">
                      <span className="input-group-text component-background component-text">
                        {UnitConverter.convertMetersToUnit(activity.distanceInMeters, user.distanceUnit)} {user.distanceUnit}
                      </span>
                      <span className="input-group-text component-background component-text">
                        {UnitConverter.convertSecondsToHHmmss(activity.durationInSeconds)}
                      </span>
                    </div>
                  </div>
                  <div className="card-footer text-muted">{activity.date.toLocaleDateString(user.dateFormat)}</div>
                </div>
              </div>
            );
          })}
        </Slider>
      </div>
    );
  }
}
