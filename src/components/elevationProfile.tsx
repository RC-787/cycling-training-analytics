import React from 'react';
import * as echarts from 'echarts';
import Segment from '../types/segment';
import UnitConverter from '../common/unitConverter';

type Props = {
  segment: Segment;
  distanceUnit: string;
  elevationUnit: string;
};

export default class ElevationProfile extends React.Component<Props, unknown> {
  chart: echarts.ECharts | undefined;

  componentDidMount(): void {
    const chartContainer = document.getElementById('segment-details-chart-container');
    if (chartContainer === null) {
      return;
    }

    this.chart = echarts.init(chartContainer);
    this.chart.setOption(this.getChartOptions());
    this.chart.getZr().on('mouseout', () => {
      PubSub.publish('performance-analysis-chart-hover-end');
    });
  }

  getChartOptions(): Record<string, unknown> {
    const { props } = this;
    return {
      grid: {
        top: 25,
        left: 10,
        right: 10,
        bottom: 5,
      },
      tooltip: {
        show: true,
        hideDelay: 0,
        trigger: 'axis',
        transitionDuration: 0,
        formatter: (params: Array<Record<string, unknown>>) => {
          const elevationSeries = params.find((x) => x.seriesName === 'Elevation');
          const dataIndex = Number(params[0].dataIndex);
          let tooltipText = `<div style="width: 100%">`;

          const { distanceDataInMeters } = props.segment;
          if (distanceDataInMeters !== undefined) {
            const distanceValue = distanceDataInMeters[dataIndex];
            tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5"><span class="performance-analysis-distance-symbol"></span> Distance (${props.distanceUnit})</span>`;
            if (distanceValue === null) {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">N/A</span>`;
            } else {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">${UnitConverter.convertMetersToUnit(
                distanceValue,
                props.distanceUnit
              )}</span>`;
            }
            tooltipText += `</li>`;
          }
          if (elevationSeries !== undefined) {
            tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5">${elevationSeries.marker} Elevation (${props.elevationUnit})</span>`;
            const value = (elevationSeries.data as Array<number | null | undefined>)[1];
            const gradient = (elevationSeries.data as Array<number | null | undefined>)[2];
            if (value === null || value === undefined) {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">N/A</span>`;
            } else {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">
                ${UnitConverter.convertMetersToUnit(value, props.elevationUnit)} ${gradient !== undefined ? `(${gradient}%)` : ``}</span>`;
            }
            tooltipText += `</li>`;
          }
          tooltipText += '</div>';
          PubSub.publish('performance-analysis-chart-hover', params[0].dataIndex);
          return tooltipText;
        },
      },
      legend: {
        textStyle: {
          color: '#b3b3b3',
        },
      },
      xAxis: {
        max: 'dataMax',
        min: 'dataMin',
        boundaryGap: false,
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        max: 'dataMax',
        min: 'dataMin',
        boundaryGap: false,
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      series: [
        {
          hoverAnimation: false,
          symbol: 'none',
          sampling: 'average',
          type: 'line',
          name: 'Elevation',
          itemStyle: {
            color: 'rgb(217, 217, 217)',
          },
          lineStyle: {
            width: 0,
          },
          silent: true,
          emphasis: {
            areaStyle: {
              color: 'rgb(217, 217, 217)',
            },
          },
          areaStyle: {},
          data: props.segment.elevationDataInMeters?.map((instantaneousElevation, index) => {
            const gradient = props.segment.gradientData?.[index] ?? undefined;
            if (instantaneousElevation === null) {
              return [index, 'N/A', instantaneousElevation, gradient];
            }
            return [index, instantaneousElevation, gradient];
          }),
        },
      ],
    };
  }

  render(): JSX.Element {
    return <div id="segment-details-chart-container" style={{ minHeight: '300px' }} />;
  }
}
