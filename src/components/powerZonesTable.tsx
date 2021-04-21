import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import ZoneCalculator from '../common/zoneCalculator';

type Props = {
  ftp: number;
  powerZoneSystem: string;
};

export default function PowerZonesTable(props: Props): JSX.Element {
  const { ftp, powerZoneSystem } = props;
  const zones = ZoneCalculator.getPowerZones(ftp, powerZoneSystem);

  return (
    <table className="table table-striped table-hover segment-result-table">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Description</th>
          <th scope="col">Start</th>
          <th scope="col">End</th>
        </tr>
      </thead>
      <tbody>
        {zones.map((zone, index) => {
          return (
            <tr key={uuidv4()}>
              <th scope="row">{index + 1}</th>
              <td>{zone.description}</td>
              <td>{zone.startValue} W</td>
              <td>{zone.endValue === Infinity ? '-' : `${zone.endValue} W`}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
