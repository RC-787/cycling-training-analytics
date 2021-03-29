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

export default class HeartRateZoneDistribution extends React.Component<Props> {
  componentDidMount(): void {
    const { props } = this;

    const data: Array<[number, number, string, string, string, number]> = []; // ZoneNumber, TimeInZone, ZoneName, ZoneStart, ZoneEnd, PercentageTimeInZone
    const zones = ZoneCalculator.getHeartRateZones(props.user.lthr, props.user.heartRateZoneSystem);
    zones.forEach((zone, index) => {
      if (props.activity.heartRateData === undefined) {
        return;
      }

      const timeInZone = props.activity.heartRateData.filter((x) => x !== null && x >= zone.startValue && x <= zone.endValue).length;
      if (timeInZone > 0) {
        const percentageTimeInZone = Number(((timeInZone * 100) / props.activity.heartRateData.length).toFixed(2));
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

    const chartContainer = document.getElementById('heart-rate-zone-distribution-chart-container');
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
            <br>Start: ${selectedData[3]} bpm
            <br>End: ${selectedData[4]} bpm
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
              color: 'rgb(255, 0, 0)',
            },
            {
              offset: 1,
              color: 'rgb(255, 102, 102)',
            },
          ]),
        },
      ],
    });
  }

  render(): JSX.Element {
    const { props } = this;

    if (props.activity.heartRateData === undefined) {
      return (
        <section className="component p-3 h-100">
          <div className="text-center">
            <span className="fs-3 fw-light">Heart Rate Zone Distribution</span>
            <br />
            <span className="fs-5 fw-light">No heart rate data found for this activity</span>
          </div>
        </section>
      );
    }

    return (
      <section className="component p-3 h-100">
        <div className="text-center">
          <span className="fs-3 fw-light">Heart Rate Zone Distribution</span>
        </div>
        <div id="heart-rate-zone-distribution-chart-container" style={{ minHeight: '300px' }} />
      </section>
    );
  }
}
