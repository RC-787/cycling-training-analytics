import React from 'react';
import { Redirect } from 'react-router-dom';
import Database from '../common/database';
import UserContext, { UserContextType } from '../common/userContext';
import PowerZonesTable from '../components/powerZonesTable';
import HeartRateZonesTable from '../components/heartRateZonesTable';
import BikesSummary from '../components/bikesSummary';
import User from '../types/user';
import Bike from '../types/bike';

type State = {
  ftp: number;
  powerZoneSystem: string;
  showPowerZonesTable: boolean;
  lthr: number;
  heartRateZoneSystem: string;
  showHeartRateZonesTable: boolean;
  bikes: Bike[];
  redirectTo: string | undefined;
};

class AddUser extends React.Component<unknown, State> {
  database: Database;

  constructor(props: unknown) {
    super(props);
    this.state = {
      ftp: 0,
      powerZoneSystem: '',
      showPowerZonesTable: false,
      lthr: 0,
      heartRateZoneSystem: '',
      showHeartRateZonesTable: false,
      bikes: [],
      redirectTo: undefined,
    };
    this.database = Database.getDatabaseInstance();
    this.powerZoneConfigurationChanged = this.powerZoneConfigurationChanged.bind(this);
    this.heartRateZoneConfigurationChanged = this.heartRateZoneConfigurationChanged.bind(this);
    this.bikesUpdated = this.bikesUpdated.bind(this);
    this.saveUser = this.saveUser.bind(this);
  }

  powerZoneConfigurationChanged(): void {
    const ftp = (document.getElementById('ftp-input') as HTMLInputElement).value;
    const zoneSystem = (document.getElementById('power-zone-system-select') as HTMLSelectElement).value;

    if (ftp === '' || zoneSystem === '') {
      this.setState({ showPowerZonesTable: false });
      return;
    }

    this.setState({ ftp: Number(ftp), powerZoneSystem: zoneSystem, showPowerZonesTable: true });
  }

  heartRateZoneConfigurationChanged(): void {
    const lthr = (document.getElementById('lthr-input') as HTMLInputElement).value;
    const heartRateZoneSystem = (document.getElementById('heart-rate-zone-system-select') as HTMLSelectElement).value;

    if (lthr === '' || heartRateZoneSystem === '') {
      this.setState({ showHeartRateZonesTable: false });
      return;
    }

    this.setState({ lthr: Number(lthr), heartRateZoneSystem, showHeartRateZonesTable: true });
  }

  bikesUpdated(bikes: Bike[]): void {
    this.setState({ bikes });
  }

  async saveUser(event: React.FormEvent<HTMLButtonElement>): Promise<void> {
    const form = document.getElementById('add-user-form') as HTMLFormElement;
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add('was-validated');
      return;
    }
    form.classList.add('was-validated');

    const { state } = this;
    const today = new Date();

    // Save the user
    let user: User = {
      userId: undefined,
      firstName: (document.getElementById('first-name-input') as HTMLInputElement).value,
      lastName: (document.getElementById('last-name-input') as HTMLInputElement).value,
      dateOfBirth: new Date((document.getElementById('date-of-birth-input') as HTMLInputElement).value),
      weight: Number((document.getElementById('weight-input') as HTMLInputElement).value),
      weightUnit: (document.getElementById('weight-unit-select') as HTMLSelectElement).value,
      distanceUnit: (document.getElementById('distance-unit-select') as HTMLSelectElement).value,
      elevationUnit: (document.getElementById('elevation-unit-select') as HTMLSelectElement).value,
      dateFormat: (document.getElementById('date-format-select') as HTMLSelectElement).value,
      firstDayOfWeek: Number((document.getElementById('first-day-of-week-select') as HTMLSelectElement).value),
      ftp: state.ftp,
      ftpHistory: [{ value: state.ftp, date: today }],
      tssHistory: [{ value: 0, date: today }],
      powerZoneSystem: state.powerZoneSystem,
      lthr: state.lthr,
      lthrHistory: [{ value: state.lthr, date: today }],
      heartRateZoneSystem: state.heartRateZoneSystem,
      defaultBikeId: undefined,
    };
    user = await this.database.saveUser(user);

    // Save the bikes
    state.bikes.forEach(async (x) => {
      if (user.userId !== undefined) {
        x.userId = user.userId;
        const bike = await this.database.saveBike(x);
        if (bike.isDefaultBike) {
          user.defaultBikeId = bike.bikeId;
          user = await this.database.saveUser(user);
        }
      }
    });

    // Update the context
    const context = this.context as UserContextType;
    context.setUser(user);

    this.setState({ redirectTo: '/Dashboard' });
  }

  render(): JSX.Element {
    const { state } = this;

    if (state.redirectTo !== undefined) {
      return <Redirect to={state.redirectTo} />;
    }

    return (
      <form className="needs-validation" id="add-user-form" noValidate>
        <h6 className="display-6 text-center pt-3">Add User</h6>
        {/* Details */}
        <div className="card mt-5">
          <div className="card-header">Details</div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <label htmlFor="first-name-input" className="form-label w-100">
                  First Name
                  <input type="text" className="form-control" id="first-name-input" required />
                </label>
              </div>
              <div className="col-md-6">
                <label htmlFor="last-name-input" className="form-label w-100">
                  Last Name
                  <input type="text" className="form-control" id="last-name-input" required />
                </label>
              </div>
              <div className="col-md-6">
                <label htmlFor="date-of-birth-input" className="form-label w-100">
                  Date of Birth
                  <input type="date" className="form-control" id="date-of-birth-input" required />
                </label>
              </div>
              <div className="col-md-6">
                <label htmlFor="weight-input" className="form-label w-100">
                  Weight
                  <div className="input-group mb-3">
                    <input type="number" min={0} step={0.01} className="form-control" id="weight-input" required />
                    <select className="form-select" id="weight-unit-select" defaultValue="" required>
                      <option value="" hidden disabled>
                        Select weight unit
                      </option>
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
        {/* Preferences */}
        <div className="card mt-5">
          <div className="card-header">Preferences</div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <label htmlFor="distance-unit-select" className="form-label w-100">
                  Distance Unit
                  <select className="form-select" id="distance-unit-select" defaultValue="" required>
                    <option value="" hidden disabled>
                      Please choose
                    </option>
                    <option value="km">km</option>
                    <option value="mi">mi</option>
                  </select>
                </label>
              </div>
              <div className="col-md-6">
                <label htmlFor="elevation-unit-select" className="form-label w-100">
                  Elevation Unit
                  <select className="form-select" id="elevation-unit-select" defaultValue="" required>
                    <option value="" hidden disabled>
                      Please choose
                    </option>
                    <option value="m">m</option>
                    <option value="ft">ft</option>
                  </select>
                </label>
              </div>
              <div className="col-md-6">
                <label htmlFor="date-format-select" className="form-label w-100">
                  Date Format
                  <select className="form-select" id="date-format-select" defaultValue="" required>
                    <option value="" hidden disabled>
                      Please choose
                    </option>
                    <option value="es-CL">DD-MM-YYYY</option>
                    <option value="en-GB">DD/MM/YYYY</option>
                    <option value="de-DE">DD.MM.YYYY</option>
                    <option value="en-CA">YYYY-MM-DD</option>
                    <option value="en-ZA">YYYY/MM/DD</option>
                    <option value="en-US">MM/DD/YYYY</option>
                  </select>
                </label>
              </div>
              <div className="col-md-6">
                <label htmlFor="first-day-of-week-select" className="form-label w-100">
                  First Day of Week
                  <select className="form-select" id="first-day-of-week-select" defaultValue="" required>
                    <option value="" hidden disabled>
                      Please choose
                    </option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>
        {/* Zone Configuration */}
        <div className="card mt-5">
          <div className="card-header">Zone Configuration</div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <label htmlFor="ftp-input" className="form-label w-100">
                  FTP
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="form-control"
                    id="ftp-input"
                    onChange={this.powerZoneConfigurationChanged}
                    required
                  />
                </label>
              </div>
              <div className="col-md-6">
                <label htmlFor="power-zone-system-select" className="form-label w-100">
                  Power Zone System
                  <select
                    className="form-select"
                    id="power-zone-system-select"
                    defaultValue=""
                    onChange={this.powerZoneConfigurationChanged}
                    required
                  >
                    <option value="" hidden disabled>
                      Please choose
                    </option>
                    <option value="Coggan">Coggan (6 zones)</option>
                    <option value="Polarized">Polarized (3 zones)</option>
                  </select>
                </label>
              </div>
              <div className="col-md-12 mt-3">
                {state.showPowerZonesTable && <PowerZonesTable ftp={state.ftp} powerZoneSystem={state.powerZoneSystem} />}
              </div>
              <div className="row mt-5"> </div>
              <div className="col-md-6">
                <label htmlFor="lthr-input" className="form-label w-100">
                  LTHR
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="form-control"
                    id="lthr-input"
                    required
                    onChange={this.heartRateZoneConfigurationChanged}
                  />
                </label>
              </div>
              <div className="col-md-6">
                <label htmlFor="heart-rate-zone-system-select" className="form-label w-100">
                  Heart Rate Zone System
                  <select
                    className="form-select"
                    id="heart-rate-zone-system-select"
                    defaultValue=""
                    onChange={this.heartRateZoneConfigurationChanged}
                    required
                  >
                    <option value="" hidden disabled>
                      Please choose
                    </option>
                    <option value="Coggan">Coggan (5 zones)</option>
                  </select>
                </label>
              </div>
              <div className="col-md-12">
                {state.showHeartRateZonesTable && <HeartRateZonesTable lthr={state.lthr} heartRateZoneSystem={state.heartRateZoneSystem} />}
              </div>
            </div>
          </div>
        </div>
        {/* Bikes */}
        <div className="card mt-5">
          <div className="card-header">Bikes</div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-12">
                <BikesSummary bikes={state.bikes} bikesUpdated={this.bikesUpdated} />
              </div>
            </div>
          </div>
        </div>
        {/* Save/Reset buttons */}
        <div className="text-center pb-3">
          <button type="button" className="btn btn-secondary mt-5" onClick={this.saveUser}>
            Save
          </button>
          &nbsp;
          <button type="button" className="btn btn-outline-secondary mt-5" onClick={() => this.setState({ redirectTo: '/' })}>
            Cancel
          </button>
        </div>
      </form>
    );
  }
}
AddUser.contextType = UserContext;

export default AddUser;
