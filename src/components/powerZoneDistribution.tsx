import React from 'react';
import * as echarts from 'echarts';
import ZoneCalculator from '../common/zoneCalculator';
import UnitConverter from '../common/unitConverter';
import Activity from '../types/activity';
import User from '../types/user';

type Props = {
  activity: Activity;
  user: User;
};

export default class PowerZoneDistribution extends React.Component<Props> {
  componentDidMount(): void {
    const { props } = this;
    if (props.activity.powerData === undefined) {
      return;
    }

    const data: Array<[number, number, string, string, string, number]> = []; // ZoneNumber, TimeInZone, ZoneName, ZoneStart, ZoneEnd, PercentageTimeInZone
    const zones = ZoneCalculator.getPowerZones(props.user.ftp, props.user.powerZoneSystem);
    zones.forEach((zone, index) => {
      if (props.activity.powerData === undefined) {
        return;
      }

      const timeInZone = props.activity.powerData.filter((x) => x !== null && x >= zone.startValue && x <= zone.endValue).length;
      if (timeInZone > 0) {
        const percentageTimeInZone = Number(((timeInZone * 100) / props.activity.powerData.length).toFixed(2));
        data.push([
          index + 1,
          timeInZone,
          zone.description,
          zone.startValue.toString(),
          zone.endValue === Infinity ? '-' : zone.endValue.toString(),
          percentageTimeInZone,
        ]);
      }
    });

    const chartContainer = document.getElementById('power-zone-distribution-chart-container');
    if (chartContainer === null) {
      return;
    }
    const chart = echarts.init(chartContainer);
    chart.setOption({
      tooltip: {
        show: true,
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        transitionDuration: 0,
        formatter(params: unknown) {
          const detail = (params as Array<unknown>)[0] as Record<string, unknown>;
          const selectedData = detail.data as [number, number, string, string, string, number];
          return `${selectedData[2]}
            <br>Start: ${selectedData[3]} W
            <br>End: ${selectedData[4]} W
            <br>Duration: ${UnitConverter.convertSecondsToHHmmss(selectedData[1])}
            <br><b>${selectedData[5]}%</b>`;
        },
      },
      grid: {
        top: 25,
        left: 10,
        right: 10,
        bottom: 20,
      },
      xAxis: {
        axisTick: {
          alignWithLabel: true,
        },
        type: 'category',
      },
      yAxis: {
        type: 'value',
        boundaryGap: false,
        splitLine: {
          show: true,
          lineStyle: {
            color: '#333',
          },
        },
        axisLabel: {
          show: false,
        },
      },
      series: [
        {
          data,
          name: 'Time in Zone',
          type: 'bar',
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgb(0, 0, 255)',
            },
            {
              offset: 1,
              color: 'rgb(102, 102, 255)',
            },
          ]),
        },
      ],
    });
  }

  render(): JSX.Element {
    const { props } = this;

    if (props.activity.powerData === undefined) {
      return (
        <section className="component p-3 h-100">
          <div className="text-center">
            <span className="fs-3 fw-light">Power Zone Distribution</span>
            <br />
            <span className="fs-5 fw-light">No power data found for this activity</span>
          </div>
        </section>
      );
    }

    return (
      <section className="component p-3 h-100">
        <div className="text-center">
          <span className="fs-3 fw-light">Power Zone Distribution</span>
        </div>
        <div id="power-zone-distribution-chart-container" style={{ minHeight: '300px' }} />
      </section>
    );
  }
}
