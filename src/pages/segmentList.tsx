import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Redirect } from 'react-router-dom';
import Database from '../common/database';
import UserContext, { UserContextType } from '../common/userContext';
import Navbar from '../components/navbar';
import UnitConverter from '../common/unitConverter';
import Segment from '../types/segment';
import User from '../types/user';

type State = {
  segments: Array<Segment>;
  redirectToSegment: boolean;
};

class SegmentList extends React.Component<unknown, State> {
  database: Database;

  user: User;

  redirectToSegmentId = 0;

  constructor(props: unknown, context: UserContextType) {
    super(props);
    this.state = {
      segments: [],
      redirectToSegment: false,
    };
    this.database = Database.getDatabaseInstance();
    this.user = context.user;
  }

  async componentDidMount(): Promise<void> {
    if (this.user.userId === undefined) {
      return;
    }
    const segments = await this.database.getAllSegments(this.user.userId);
    this.setState({ segments });
  }

  redirectToSegment(segmentId: number): void {
    this.redirectToSegmentId = segmentId;
    this.setState({ redirectToSegment: true });
  }

  render(): JSX.Element {
    const { state } = this;

    if (state.redirectToSegment) {
      return (
        <Redirect
          to={{
            pathname: '/segment',
            state: { segmentId: this.redirectToSegmentId },
          }}
        />
      );
    }

    return (
      <main>
        <Navbar />
        <div className="row pb-3">
          <div className="col-12 mt-5">
            <div className="component p-3">
              <div className="text-center">
                <span className="fs-3 fw-light">Segments</span>
              </div>
              <table className="table table-striped table-hover table-sm segment-result-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {state.segments.map((segment) => {
                    return (
                      <tr key={uuidv4()} style={{ cursor: 'pointer' }} onClick={() => this.redirectToSegment(segment.segmentId ?? 0)}>
                        <td>{segment.segmentName}</td>
                        <td>
                          {UnitConverter.convertMetersToUnit(segment.distanceInMeters, this.user.distanceUnit)} {this.user.distanceUnit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    );
  }
}

SegmentList.contextType = UserContext;

export default SegmentList;
