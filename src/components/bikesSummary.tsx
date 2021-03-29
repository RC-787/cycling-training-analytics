import { Modal } from 'bootstrap';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import Bike from '../types/bike';

type Props = {
  bikes: Bike[];
  bikesUpdated: (bikes: Bike[]) => void;
};

export default class BikesSummary extends React.Component<Props> {
  addBikeModalId: string;

  editBikeModalId: string;

  addBikeModal: Modal | undefined;

  editBikeModal: Modal | undefined;

  bikeToEdit: Bike | undefined;

  constructor(props: Props) {
    super(props);
    this.addBikeModalId = uuidv4();
    this.editBikeModalId = uuidv4();
    this.showAddBikeModal = this.showAddBikeModal.bind(this);
    this.addBike = this.addBike.bind(this);
    this.deleteBike = this.deleteBike.bind(this);
    this.setDefaultBike = this.setDefaultBike.bind(this);
    this.editBikeDescription = this.editBikeDescription.bind(this);
    this.saveEditedBikeDescription = this.saveEditedBikeDescription.bind(this);
  }

  componentDidMount(): void {
    const addBikeModalElement = document.getElementById(this.addBikeModalId);
    if (addBikeModalElement !== null) {
      this.addBikeModal = new Modal(addBikeModalElement);
    }

    const editBikeModalElement = document.getElementById(this.editBikeModalId);
    if (editBikeModalElement !== null) {
      this.editBikeModal = new Modal(editBikeModalElement);
    }
  }

  setDefaultBike(bike: Bike): void {
    const { bikes, bikesUpdated } = this.props;
    const targetIndex = bikes.indexOf(bike, 0);
    bikes.forEach((x) => {
      x.isDefaultBike = false;
    });
    bikes[targetIndex].isDefaultBike = true;
    bikesUpdated(bikes);
  }

  showAddBikeModal(): void {
    const inputElement = document.getElementById('add-bike-description-input') as HTMLInputElement;
    inputElement.classList.remove('is-invalid');
    inputElement.value = '';
    this.addBikeModal?.show();
  }

  addBike(): void {
    const { bikes, bikesUpdated } = this.props;
    const inputElement = document.getElementById('add-bike-description-input') as HTMLInputElement;
    const description = inputElement.value;
    if (description === '') {
      inputElement.classList.add('is-invalid');
      return;
    }

    inputElement.classList.remove('is-invalid');
    bikes.push({
      bikeId: undefined,
      userId: 0,
      description,
      distanceCoveredInKm: 0,
      ridingTimeInSeconds: 0,
      isDefaultBike: bikes.length === 0,
    });
    bikesUpdated(bikes);
    this.addBikeModal?.hide();
  }

  editBikeDescription(bike: Bike): void {
    const inputElement = document.getElementById('edit-bike-description-input') as HTMLInputElement;
    inputElement.classList.remove('is-invalid');

    inputElement.value = bike.description;
    this.bikeToEdit = bike;
    this.editBikeModal?.show();
  }

  saveEditedBikeDescription(): void {
    const inputElement = document.getElementById('edit-bike-description-input') as HTMLInputElement;
    const description = inputElement.value;
    if (description === '') {
      inputElement.classList.add('is-invalid');
      return;
    }

    inputElement.classList.remove('is-invalid');
    const { bikes, bikesUpdated } = this.props;
    const indexToUpdate = bikes.findIndex((x) => x === this.bikeToEdit);
    if (indexToUpdate !== -1) {
      bikes[indexToUpdate].description = description;
      bikesUpdated(bikes);
    }
    this.editBikeModal?.hide();
  }

  deleteBike(bike: Bike): void {
    const { bikes, bikesUpdated } = this.props;
    const updatedBikes = bikes.filter((x) => x !== bike);
    if (bike.isDefaultBike && updatedBikes.length > 0) {
      // Make sure a default bike is always selected
      updatedBikes[0].isDefaultBike = true;
    }
    bikesUpdated(updatedBikes);
  }

  render(): JSX.Element {
    const { props } = this;

    return (
      <section>
        {/* Table */}
        {props.bikes.length > 0 && (
          <table className="table table-striped table-hover border">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Description</th>
                <th scope="col">Distance</th>
                <th scope="col">Time</th>
                <th scope="col">Default</th>
                <th scope="col"> </th>
              </tr>
            </thead>
            <tbody>
              {props.bikes.map((bike, index) => {
                return (
                  <tr key={uuidv4()}>
                    <th scope="row">{index + 1}</th>
                    <td>{bike.description}</td>
                    <td>{bike.distanceCoveredInKm}</td>
                    <td>{bike.distanceCoveredInKm}</td>
                    <td>
                      <input className="form-check-input" type="radio" checked={bike.isDefaultBike} onChange={() => this.setDefaultBike(bike)} />
                    </td>
                    <td className="text-end">
                      {/* Edit button */}
                      <button type="button" className="btn btn-outline-secondary me-2" onClick={() => this.editBikeDescription(bike)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          className="bi bi-pencil"
                          viewBox="0 0 16 16"
                        >
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                        </svg>
                      </button>
                      {/* Delete button */}
                      <button type="button" className="btn btn-outline-secondary" onClick={() => this.deleteBike(bike)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          className="bi bi-trash"
                          viewBox="0 0 16 16"
                        >
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                          <path
                            fillRule="evenodd"
                            d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {/* Add Bike Button */}
        <div className="text-center">
          <button type="button" className="btn btn-outline-secondary" onClick={() => this.showAddBikeModal()}>
            Add Bike
          </button>
        </div>
        {/* Add Bike Modal */}
        <div className="modal fade" id={this.addBikeModalId} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Bike</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <label htmlFor="add-bike-description-input" className="form-label w-100">
                  Description
                  <input type="text" className="form-control" id="add-bike-description-input" />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => this.addBike()}>
                  Save
                </button>
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Edit Bike Modal */}
        <div className="modal fade" id={this.editBikeModalId} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Bike</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <label htmlFor="edit-bike-description-input" className="form-label w-100">
                  Description
                  <input type="text" className="form-control" id="edit-bike-description-input" />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => this.saveEditedBikeDescription()}>
                  Save
                </button>
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
