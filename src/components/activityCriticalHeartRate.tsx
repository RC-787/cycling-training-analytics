import React from 'react';
import * as echarts from 'echarts';
import UnitConverter from '../common/unitConverter';
import Activity from '../types/activity';

type Props = {
  activity: Activity;
};

export default class CriticalHeartRate extends React.Component<Props> {
  componentDidMount(): void {
    const { props } = this;
    const chartContainer = document.getElementById('critical-heart-rate-chart-container');
    if (chartContainer === null || props.activity.criticalHeartRateData === undefined) {
      return;
    }

    const chart = echarts.init(chartContainer);
    chart.setOption({
      tooltip: {
        show: true,
        trigger: 'axis',
        transitionDuration: 0,
        formatter(params: unknown) {
          const detail = (params as Array<unknown>)[0] as Record<string, unknown>;
          const data = detail.data as Array<number>;
          return `${UnitConverter.convertSecondsToHHmmss(data[0])}<br>${data[1]} bpm`;
        },
      },
      grid: {
        top: 25,
        left: 35,
        right: 10,
        bottom: 5,
      },
      xAxis: {
        type: 'log',
        maxInterval: 1,
        min: 1,
        max: 'dataMax',
        axisLabel: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        boundaryGap: false,
        min: 'dataMin',
        splitLine: {
          show: true,
          lineStyle: {
            color: '#333',
          },
        },
      },
      legend: {
        textStyle: {
          color: '#b3b3b3',
        },
      },
      series: [
        {
          data: props.activity.criticalHeartRateData,
          type: 'line',
          symbol: 'none',
          lineStyle: {
            color: 'rgb(255, 0, 0)',
            width: 2,
          },
          areaStyle: {
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
        },
      ],
    });
  }

  render(): JSX.Element {
    const { props } = this;

    if (props.activity.criticalHeartRateData === undefined) {
      return (
        <section className="component p-3 h-100">
          <div className="text-center">
            <span className="fs-3 fw-light">Critical Heart Rate</span>
            <br />
            <span className="fs-5 fw-light">No heart rate data found for this activity</span>
          </div>
        </section>
      );
    }

    return (
      <section className="component p-3 h-100">
        <div className="text-center">
          <span className="fs-3 fw-light">Critical Heart Rate</span>
        </div>
        <div id="critical-heart-rate-chart-container" style={{ minHeight: '300px' }} />
      </section>
    );
  }
}
