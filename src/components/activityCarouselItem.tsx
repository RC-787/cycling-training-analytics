import React from 'react';
import { Redirect } from 'react-router-dom';
import UnitConverter from '../common/unitConverter';
import Map from './map';
import Activity from '../types/activity';

type Props = {
  activity: Activity;
  distanceUnit: string;
  dateFormat: string;
};

type State = {
  redirectToActivity: boolean;
};

export default class ActivityCarouselItem extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      redirectToActivity: false,
    };
  }

  render(): JSX.Element {
    const { props, state } = this;

    if (state.redirectToActivity) {
      return (
        <Redirect
          to={{
            pathname: '/activity',
            state: { activityId: props.activity.activityId },
          }}
        />
      );
    }

    return (
      <div
        className="card text-center activity-carousel-item"
        role="button"
        tabIndex={-1}
        onClick={() => this.setState({ redirectToActivity: true })}
        onKeyPress={() => {}}
      >
        <div className="activity-carousel-item-map">
          {props.activity.latitudeLongitudeData !== undefined && (
            <Map latitudeLongitudeData={props.activity.latitudeLongitudeData} allowZoom={false} renderStartAndEndFlag={false} />
          )}
        </div>
        <div className="card-body">
          <h5 className="card-title activity-carousel-item-title">{props.activity.title}</h5>
          <span>{props.activity.date.toLocaleDateString(props.dateFormat)}</span>
          <div className="input-group mt-1 mb-3 justify-content-center">
            <span className="input-group-text component-background component-text">
              {UnitConverter.convertMetersToUnit(props.activity.distanceInMeters, props.distanceUnit)} {props.distanceUnit}
            </span>
            <span className="input-group-text component-background component-text">
              {UnitConverter.convertSecondsToHHmmss(props.activity.durationInSeconds)}
            </span>
          </div>
        </div>
      </div>
    );
  }
}
