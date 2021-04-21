import React from 'react';
import { Redirect, RouteComponentProps } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Modal } from 'bootstrap';
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
  redirectTo: string | undefined;
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

  editSegmentModalId: string;

  editSegmentModal: Modal | undefined;

  confirmDeleteModalId: string;

  confirmDeleteModal: Modal | undefined;

  constructor(props: RouteComponentProps<LocationState>, context: UserContextType) {
    super(props);
    this.state = {
      segment: undefined,
      segmentResults: [],
      redirectToActivity: false,
      redirectTo: undefined,
    };
    this.user = context.user;
    this.segmentId = Number((props.location.state as LocationState).segmentId);
    this.database = Database.getDatabaseInstance();
    this.editSegmentModalId = uuidv4();
    this.confirmDeleteModalId = uuidv4();
  }

  async componentDidMount(): Promise<void> {
    const segment = await this.database.getSegment(this.segmentId);
    const segmentResults = await this.database.getSegmentResults(this.segmentId);
    this.setState({ segment, segmentResults });
    let modalElement = document.getElementById(this.editSegmentModalId);
    if (modalElement !== null) {
      this.editSegmentModal = new Modal(modalElement);
    }
    modalElement = document.getElementById(this.confirmDeleteModalId);
    if (modalElement !== null) {
      this.confirmDeleteModal = new Modal(modalElement);
    }
  }

  async saveEditedSegment(): Promise<void> {
    const { segment } = this.state;
    const nameInputElement = document.getElementById('segment-name-input');
    if (nameInputElement === undefined || segment === undefined) {
      return;
    }

    segment.segmentName = (nameInputElement as HTMLInputElement).value;
    await this.database.saveSegment(segment);
    this.setState({ segment });
    this.editSegmentModal?.hide();
  }

  async deleteSegment(): Promise<void> {
    const { segment } = this.state;
    if (segment !== undefined && segment.segmentId !== undefined) {
      this.database.deleteSegment(segment.segmentId);
      this.database.deleteSegmentResults(segment.segmentId);
      this.editSegmentModal?.hide();
      this.confirmDeleteModal?.hide();
      this.setState({ redirectTo: '/Dashboard' });
    }
  }

  render(): JSX.Element {
    const { state } = this;

    if (state.redirectTo !== undefined) {
      return <Redirect to={state.redirectTo} />;
    }

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
        <div className="text-center">
          <span className="fs-3 fw-light me-2">{state.segment.segmentName}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 16 16"
            style={{ display: 'inline-block', verticalAlign: '-.125em', cursor: 'pointer' }}
            onClick={() => this.editSegmentModal?.show()}
          >
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
            <path
              fillRule="evenodd"
              d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
            />
          </svg>
          <br />
          <span className="fs-3 fw-light">
            {UnitConverter.convertMetersToUnit(state.segment.distanceInMeters, this.user.distanceUnit)} {this.user.distanceUnit}
          </span>
        </div>
        <div className="row pb-3">
          <div className="col-12 mt-2">
            <div className="component p-3">
              <div className="row mt-2">
                <div className="col-sm-12 col-md-6" style={{ minHeight: '250px' }}>
                  <Map latitudeLongitudeData={state.segment.latitudeLongitudeData} allowZoom renderStartAndEndFlag />
                </div>
                <div className="col-sm-12 col-md-6">
                  <ElevationProfile segment={state.segment} distanceUnit={this.user.distanceUnit} elevationUnit={this.user.elevationUnit} />
                </div>
                <div className="col-12 text-center mt-5">
                  <span className="fs-3 fw-light">Segment Results</span>
                </div>
                <div className="col-12 mt-2">
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
        {/* Edit segment modal */}
        <div className="modal fade" id={this.editSegmentModalId} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Segment</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <label htmlFor="segment-name-input" className="form-label w-100">
                  Name
                  <input type="text" className="form-control" id="segment-name-input" defaultValue={state.segment.segmentName} />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => this.saveEditedSegment()}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const nameInputElement = document.getElementById('segment-name-input');
                    if (nameInputElement !== undefined && state.segment !== undefined) {
                      (nameInputElement as HTMLInputElement).value = state.segment.segmentName;
                    }
                    this.editSegmentModal?.hide();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    this.confirmDeleteModal?.show();
                    this.editSegmentModal?.hide();
                  }}
                >
                  Delete Segment
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
                <h5 className="modal-title">Delete Segment</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this segment?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => this.deleteSegment()}>
                  Yes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    this.editSegmentModal?.show();
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
Segment.contextType = UserContext;

export default Segment;
