import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import User from '../types/user';

type Props = {
  user: User;
};

export default function ftpHistory(props: Props): JSX.Element {
  const { user } = props;
  return (
    <div className="component p-3 h-100">
      <div className="text-center">
        <span className="fs-3 fw-light">FTP History</span>
        <br />
      </div>
      <table className="table table-striped table-hover segment-result-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">FTP</th>
          </tr>
        </thead>
        <tbody>
          {user.ftpHistory.map((entry) => {
            return (
              <tr key={uuidv4()}>
                <td>{entry.date.toLocaleDateString(user.dateFormat)}</td>
                <td>{entry.value} W</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
