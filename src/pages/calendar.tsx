import React from 'react';
import FullCalendar, { DatesSetArg, EventContentArg, EventInput } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Redirect } from 'react-router-dom';
import Database from '../common/database';
import UserContext, { UserContextType } from '../common/userContext';
import Navbar from '../components/navbar';
import User from '../types/user';
import UnitConverter from '../common/unitConverter';

type State = {
  events: Array<EventInput>;
  redirectToActivity: boolean;
};

class Calendar extends React.Component<unknown, State> {
  database: Database;

  user: User;

  activityId = 0;

  constructor(props: unknown, context: UserContextType) {
    super(props);
    this.database = Database.getDatabaseInstance();
    this.user = context.user;
    this.datesSet = this.datesSet.bind(this);
    this.eventContent = this.eventContent.bind(this);
    this.state = {
      events: [],
      redirectToActivity: false,
    };
  }

  async datesSet(args: DatesSetArg): Promise<void> {
    if (this.user?.userId === undefined) {
      return;
    }
    const activitiesInDateRange = await this.database.getActivitiesByDateRange(this.user.userId, args.start, args.end);
    if (activitiesInDateRange.length === 0) {
      return;
    }

    const events: Array<EventInput> = [];
    activitiesInDateRange.forEach((activity) => {
      if (activity.activityId !== undefined) {
        events.push({
          title: activity.title,
          date: activity.date,
          extendedProps: {
            activityId: activity.activityId,
            durationInSeconds: activity.durationInSeconds,
            distanceInMeters: activity.distanceInMeters,
            distanceUnit: this.user.distanceUnit,
            averageSpeedInKilometersPerHour: activity.averageSpeedInKilometersPerHour,
            averagePower: activity.averagePower,
            averageHeartRate: activity.averageHeartRate,
          },
        });
      }
    });
    this.setState({ events });
  }

  redirectToActivity(activityId: number): void {
    this.activityId = activityId;
    this.setState({ redirectToActivity: true });
  }

  eventContent(args: EventContentArg): JSX.Element {
    let averageSpeed = 'N/A';
    if (args.event.extendedProps.averageSpeedInKilometersPerHour !== undefined) {
      averageSpeed = UnitConverter.convertMetersToUnit(
        args.event.extendedProps.averageSpeedInKilometersPerHour * 1000,
        args.event.extendedProps.distanceUnit
      );
    }

    const activityId = Number(args.event.extendedProps.activityId);

    return (
      <div
        className="card text-center activity-carousel-item"
        tabIndex={-1}
        aria-hidden
        style={{ cursor: 'pointer' }}
        onClick={() => this.redirectToActivity(activityId)}
      >
        <div className="card-body">
          <h5 className="card-title activity-carousel-item-title">{args.event.title}</h5>
          <table className="table table-striped segment-result-table">
            <tbody>
              <tr>
                <td className="text-start text-truncate">Duration: </td>
                <td className="text-end">{UnitConverter.convertSecondsToHHmmss(args.event.extendedProps.durationInSeconds)}</td>
              </tr>
              <tr>
                <td className="text-start text-truncate">Distance ({args.event.extendedProps.distanceUnit}):</td>
                <td className="text-end">
                  {UnitConverter.convertMetersToUnit(args.event.extendedProps.distanceInMeters, args.event.extendedProps.distanceUnit)}
                </td>
              </tr>
              <tr>
                <td className="text-start text-truncate">Speed ({args.event.extendedProps.distanceUnit}/h):</td>
                <td className="text-end">{averageSpeed}</td>
              </tr>
              <tr>
                <td className="text-start text-truncate">Power (W):</td>
                <td className="text-end">{args.event.extendedProps.averagePower ?? 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-start text-truncate">Heart Rate (bpm):</td>
                <td className="text-end">{args.event.extendedProps.averageHeartRate ?? 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  render(): JSX.Element {
    const { state } = this;

    if (state.redirectToActivity) {
      return (
        <Redirect
          to={{
            pathname: '/activity',
            state: { activityId: this.activityId },
          }}
        />
      );
    }

    return (
      <main>
        <Navbar />
        <div className="row">
          <div className="col-12 mt-5 mb-3">
            <div className="h-100 component p-3" id="activity-calendar">
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                fixedWeekCount={false}
                headerToolbar={{
                  left: 'title',
                  right: 'prevYear,prev,today,next,nextYear',
                }}
                buttonText={{
                  today: 'Today',
                }}
                titleFormat={{
                  year: 'numeric',
                  month: 'long',
                }}
                themeSystem="standard"
                defaultAllDay
                datesSet={this.datesSet}
                events={state.events}
                eventContent={this.eventContent}
                firstDay={this.user.firstDayOfWeek}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }
}

Calendar.contextType = UserContext;

export default Calendar;
