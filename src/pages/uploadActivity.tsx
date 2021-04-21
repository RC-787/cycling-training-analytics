import React from 'react';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { Redirect } from 'react-router-dom';
import Navbar from '../components/navbar';
import Map from '../components/map';
import Database from '../common/database';
import UnitConverter from '../common/unitConverter';
import UserContext, { UserContextType } from '../common/userContext';
import Activity from '../types/activity';
import User from '../types/user';
import Bike from '../types/bike';

type State = {
  filePath: string | undefined;
  activity: Activity | undefined;
  redirectToActivity: boolean;
};

class UploadActivity extends React.Component<unknown, State> {
  user: User;

  bikes: Bike[] | undefined;

  database: Database;

  activityId = 0;

  constructor(props: unknown, context: UserContextType) {
    super(props);
    this.state = {
      filePath: undefined,
      activity: undefined,
      redirectToActivity: false,
    };
    this.user = context.user;
    this.database = Database.getDatabaseInstance();
    this.promptUserToSelectFiles = this.promptUserToSelectFiles.bind(this);
    this.getActivityFromFileResult = this.getActivityFromFileResult.bind(this);
    this.findSegmentsOnActivityCompleted = this.findSegmentsOnActivityCompleted.bind(this);
    this.saveActivity = this.saveActivity.bind(this);
  }

  async componentDidMount(): Promise<void> {
    // Stretch the container to use the full height of the page
    const buttonContainer = document.getElementById('select-activity-button-container');
    if (buttonContainer === null) {
      return;
    }
    buttonContainer.style.height = `${window.innerHeight - buttonContainer.offsetTop}px`;

    // Configure IPC listeners
    ipcRenderer.on('get-activity-from-file-result', this.getActivityFromFileResult);
    ipcRenderer.on('find-segments-on-activity-completed', this.findSegmentsOnActivityCompleted);

    if (this.user.userId !== undefined) {
      this.bikes = await this.database.getBikes(this.user.userId);
    }
  }

  componentWillUnmount(): void {
    ipcRenderer.off('get-activity-from-file-result', this.getActivityFromFileResult);
    ipcRenderer.off('find-segments-on-activity-completed', this.findSegmentsOnActivityCompleted);
  }

  getActivityFromFileResult(_event: Electron.IpcRendererEvent, activity: Activity): void {
    this.setState({ activity });
  }

  findSegmentsOnActivityCompleted(): void {
    this.setState({ redirectToActivity: true });
  }

  async promptUserToSelectFiles(): Promise<void> {
    const filePath: string | undefined = await ipcRenderer.invoke('prompt-user-to-select-activity-to-upload');
    if (filePath === undefined) {
      return;
    }

    this.setState({ filePath });
    this.setState({ activity: undefined });

    ipcRenderer.send('get-activity-from-file', { filePath, user: this.user });
  }

  async saveActivity(event: React.FormEvent<HTMLButtonElement>): Promise<void> {
    const form = document.getElementById('add-activity-form') as HTMLFormElement;
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add('was-validated');
      return;
    }
    form.classList.add('was-validated');

    const { activity } = this.state;
    if (activity === undefined || this.user.userId === undefined) {
      return;
    }

    activity.userId = this.user.userId;
    activity.title = (document.getElementById('title-input') as HTMLInputElement).value;
    activity.bikeId = Number((document.getElementById('bike-select') as HTMLSelectElement).value);
    activity.description = (document.getElementById('description-input') as HTMLTextAreaElement).value;
    const result = await this.database.saveActivity(activity);
    await ipcRenderer.send('find-segments-on-activity', result);
    if (result.activityId !== undefined) {
      this.activityId = result.activityId;
    }
  }

  cancelButtonClicked(): void {
    this.setState({ filePath: undefined, activity: undefined }, () => {
      // Stretch the container to use the full height of the page
      const buttonContainer = document.getElementById('select-activity-button-container');
      if (buttonContainer === null) {
        return;
      }
      buttonContainer.style.height = `${window.innerHeight - buttonContainer.offsetTop}px`;
    });
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
        <h6 className="text-center display-6 pt-5">Upload Activity</h6>
        <div className="row">
          {state.filePath === undefined && (
            <div className="col-12 d-flex align-items-center" id="select-activity-button-container">
              <button type="button" className="btn btn-secondary mx-auto" onClick={this.promptUserToSelectFiles}>
                Select Activity
              </button>
            </div>
          )}

          {state.filePath !== undefined && (
            <div className="col-12 mt-5">
              <div className="card upload-activity-card">
                <div className="card-header">Processing {state.filePath}</div>
                <div className="card-body">
                  {state.activity === undefined && (
                    <div className="d-flex justify-content-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                  {state.activity !== undefined && (
                    <div className="row">
                      <div className="col-12 text-center">
                        <h3 className="display-6">{state.activity.date.toLocaleDateString(this.user.dateFormat)}</h3>
                        <div className="input-group mb-3 justify-content-center">
                          <span className="input-group-text component-background component-text">
                            {UnitConverter.convertMetersToUnit(state.activity.distanceInMeters, this.user.distanceUnit)} {this.user.distanceUnit}
                          </span>
                          <span className="input-group-text component-background component-text">
                            {UnitConverter.convertSecondsToHHmmss(state.activity.durationInSeconds)}
                          </span>
                        </div>
                      </div>
                      <div className="col-sm-12 col-md-6">
                        {state.activity.latitudeLongitudeData !== undefined && (
                          <Map latitudeLongitudeData={state.activity.latitudeLongitudeData} allowZoom={false} renderStartAndEndFlag={false} />
                        )}
                      </div>
                      <div className="col-sm-12 col-md-6">
                        <form className="needs-validation" id="add-activity-form" noValidate>
                          <div className="mb-3">
                            <label htmlFor="title-input" className="form-label w-100">
                              Title
                              <input type="text" className="form-control" id="title-input" defaultValue={state.activity.title} required />
                            </label>
                          </div>
                          <div className="mb-3">
                            <label htmlFor="bike-select" className="form-label w-100">
                              Bike
                              <select className="form-select" id="bike-select" defaultValue={this.user?.defaultBikeId} required>
                                {this.bikes?.map((bike) => {
                                  return (
                                    <option key={uuidv4()} value={bike.bikeId}>
                                      {bike.description}
                                    </option>
                                  );
                                })}
                              </select>
                            </label>
                          </div>
                          <div className="mb-3">
                            <label htmlFor="description-input" className="form-label w-100">
                              Description
                              <textarea className="form-control" placeholder="Activity description..." id="description-input" rows={5} />
                            </label>
                          </div>
                          <div className="text-center">
                            <button type="button" className="btn btn-secondary me-2" onClick={this.saveActivity}>
                              Save
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => this.cancelButtonClicked()}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }
}
UploadActivity.contextType = UserContext;

export default UploadActivity;
