import React from 'react';
import { Redirect, RouteComponentProps } from 'react-router-dom';
import { Modal } from 'bootstrap';
import { v4 as uuidv4 } from 'uuid';
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
  redirectTo: string | undefined;
};

type LocationState = {
  activityId: string;
};

class ActivityPage extends React.Component<RouteComponentProps, State> {
  activityId: number;

  user: User;

  database: Database;

  editActivityModalId: string;

  editActivityModal: Modal | undefined;

  confirmDeleteModalId: string;

  confirmDeleteModal: Modal | undefined;

  constructor(props: RouteComponentProps<LocationState>, context: UserContextType) {
    super(props);
    this.state = {
      activity: undefined,
      redirectTo: undefined,
    };
    this.user = context.user;
    this.activityId = Number((props.location.state as LocationState).activityId);
    this.database = Database.getDatabaseInstance();
    this.editActivityModalId = uuidv4();
    this.confirmDeleteModalId = uuidv4();
    this.saveLapCallback = this.saveLapCallback.bind(this);
    this.deleteLapCallback = this.deleteLapCallback.bind(this);
  }

  async componentDidMount(): Promise<void> {
    const activity = await this.database.getActivity(this.activityId);
    this.setState({ activity }, () => {
      let modalElement = document.getElementById(this.editActivityModalId);
      if (modalElement !== null) {
        this.editActivityModal = new Modal(modalElement);
      }
      modalElement = document.getElementById(this.confirmDeleteModalId);
      if (modalElement !== null) {
        this.confirmDeleteModal = new Modal(modalElement);
      }
    });
  }

  async saveLapCallback(lapToSave: { startIndex: number; endIndex: number }): Promise<void> {
    const { activity } = this.state;
    if (activity === undefined) {
      return;
    }
    activity.laps.push(lapToSave);
    activity.laps.sort((a, b) => a.startIndex - b.startIndex);
    await this.database.saveActivity(activity);
    this.setState({ activity });
  }

  async deleteLapCallback(lapToDelete: { startIndex: number; endIndex: number }): Promise<void> {
    const { activity } = this.state;
    if (activity === undefined) {
      return;
    }
    activity.laps = activity?.laps.filter((x) => x.startIndex !== lapToDelete.startIndex && x.endIndex !== lapToDelete.endIndex);
    await this.database.saveActivity(activity);
    this.setState({ activity });
  }

  showEditActivityModal(): void {
    this.editActivityModal?.show();
  }

  async saveEditedActivity(): Promise<void> {
    const { activity } = this.state;
    const titleInputElement = document.getElementById('activity-title-input');
    if (titleInputElement === undefined || activity === undefined) {
      return;
    }

    activity.title = (titleInputElement as HTMLInputElement).value;
    await this.database.saveActivity(activity);
    this.setState({ activity });
    this.editActivityModal?.hide();
  }

  async deleteActivity(): Promise<void> {
    const { activity } = this.state;
    if (activity !== undefined && activity.activityId !== undefined) {
      this.database.deleteActivity(activity.activityId);
      this.database.deleteActivitySegmentResults(activity.activityId);
      this.editActivityModal?.hide();
      this.confirmDeleteModal?.hide();
      this.setState({ redirectTo: '/Dashboard' });
    }
  }

  render(): JSX.Element {
    const { state } = this;

    if (state.redirectTo !== undefined) {
      return <Redirect to={state.redirectTo} />;
    }

    if (state.activity === undefined) {
      return <h1>Loading</h1>;
    }

    return (
      <main>
        <Navbar />
        <div className="text-center">
          <span className="fs-3 fw-light me-2">{state.activity.title}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 16 16"
            style={{ display: 'inline-block', verticalAlign: '-.125em', cursor: 'pointer' }}
            onClick={() => this.showEditActivityModal()}
          >
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
            <path
              fillRule="evenodd"
              d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
            />
          </svg>
          <br />
          <span className="fs-3 fw-light">{state.activity.date.toLocaleDateString(this.user.dateFormat)}</span>
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
            <PerformanceAnalysis
              activity={state.activity}
              distanceUnit={this.user.distanceUnit}
              elevationUnit={this.user.elevationUnit}
              saveLapCallback={this.saveLapCallback}
            />
          </div>
        </div>
        {/* Laps */}
        <div className="row mt-5">
          <div className="col-12">
            <ActivityLaps activity={state.activity} distanceUnit={this.user.distanceUnit} deleteLapCallback={this.deleteLapCallback} />
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
        {/* Edit activity modal */}
        <div className="modal fade" id={this.editActivityModalId} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Activity</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <label htmlFor="activity-title-input" className="form-label w-100">
                  Title
                  <input type="text" className="form-control" id="activity-title-input" defaultValue={state.activity.title} />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => this.saveEditedActivity()}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const titleInputElement = document.getElementById('activity-title-input');
                    if (titleInputElement !== undefined && state.activity !== undefined) {
                      (titleInputElement as HTMLInputElement).value = state.activity.title;
                    }
                    this.editActivityModal?.hide();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    this.confirmDeleteModal?.show();
                    this.editActivityModal?.hide();
                  }}
                >
                  Delete Activity
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Confirm delete modal */}
        <div className="modal fade" id={this.confirmDeleteModalId} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Activity</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this activity?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => this.deleteActivity()}>
                  Yes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    this.editActivityModal?.show();
                    this.confirmDeleteModal?.hide();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
}

ActivityPage.contextType = UserContext;

export default ActivityPage;
