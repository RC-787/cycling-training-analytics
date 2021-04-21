import React from 'react';
import * as echarts from 'echarts';
import PubSub from 'pubsub-js';
import { v4 as uuidv4 } from 'uuid';
import { Modal } from 'bootstrap';
import { ipcRenderer } from 'electron';
import Database from '../common/database';
import UnitConverter from '../common/unitConverter';
import Activity from '../types/activity';
import Segment from '../types/segment';

function getSeries(activity: Activity): Array<Record<string, unknown>> {
  /*
    Description:
    A number of different line charts will be rendered **WITHOUT ANY OVERLAP**.
    The 4 potential charts will be Power, HeartRate, Cadence, Speed.
    Instead, the charts will be stacked on top of one another.
    If any of these 4 datapoints is not present, then it won't be rendered

    The Y-Axis will always go from 0 - 1000
    Each item will then be mapped to a portion of this
    e.g Power [750 - 1000]
      Heart Rate [500 - 750]
      Cadence [250 - 500]
      Speed [0 - 250]

    Using Power as an example:
      Each power value will be mapped to the corresponding value between [750 - 1000]
      E.g if MinPower was 0 and MaxPower was 500 then 250 would be mapped to 875 on the chart

    A background of the elevation profile will span the full height of the chart
  */
  const numberOfChartsToDraw =
    Number(activity.speedDataInKilometersPerHour !== undefined) +
    Number(activity.cadenceData !== undefined) +
    Number(activity.heartRateData !== undefined) +
    Number(activity.powerData !== undefined);
  const spacingBetweenEachSection = 30;
  const heightOfEachSection = 250;
  let startHeightOfCurrentSection = 0;
  let series: Array<Record<string, unknown>> = [];

  // Elevation
  if (activity.elevationDataInMeters !== undefined) {
    const minElevation = Math.min.apply(
      null,
      activity.elevationDataInMeters.filter((x): x is number => x != null)
    );
    const maxElevation = Math.max.apply(
      null,
      activity.elevationDataInMeters.filter((x): x is number => x != null)
    );
    const elevationRange = Math.abs(maxElevation - minElevation);
    const fullHeightOfChart = numberOfChartsToDraw * (heightOfEachSection + spacingBetweenEachSection);
    series.push({
      hoverAnimation: false,
      symbol: 'none',
      sampling: 'average',
      type: 'line',
      name: 'Elevation',
      data: activity.elevationDataInMeters.map((instantaneousElevation, index) => {
        let gradient: number | undefined;
        if (instantaneousElevation === null) {
          return [index, 'N/A', instantaneousElevation, gradient];
        }
        let percentageOfMax = (instantaneousElevation - minElevation) / elevationRange;
        if (percentageOfMax < 0) {
          percentageOfMax = 0;
        }
        const heightOfPoint = percentageOfMax * fullHeightOfChart;
        if (activity.gradientData !== undefined && activity.gradientData[index] !== null) {
          gradient = activity.gradientData[index] ?? undefined;
        }
        return [index, heightOfPoint, instantaneousElevation, gradient];
      }),
      itemStyle: {
        color: 'rgb(70, 70, 70)',
      },
      lineStyle: {
        width: 0,
      },
      silent: true,
      emphasis: {
        areaStyle: {
          color: 'rgb(70, 70, 70)',
        },
      },
      areaStyle: {},
    });
  }
  // Speed
  if (activity.speedDataInKilometersPerHour !== undefined) {
    const minSpeed = Math.min.apply(
      null,
      activity.speedDataInKilometersPerHour.filter((x): x is number => x != null)
    );
    const speedRange = Math.abs((activity.maxSpeedInKilometersPerHour ?? 0) - minSpeed);
    series.push({
      silent: true,
      hoverAnimation: false,
      symbol: 'none',
      sampling: 'average',
      type: 'line',
      name: 'Speed',
      data: activity.speedDataInKilometersPerHour.map((instantaneousSpeed, index) => {
        if (instantaneousSpeed === null) {
          return [index, 'N/A', instantaneousSpeed];
        }
        let percentageOfMax = (instantaneousSpeed - minSpeed) / speedRange;
        if (percentageOfMax < 0) {
          percentageOfMax = 0;
        }
        const heightOfPoint = startHeightOfCurrentSection + percentageOfMax * heightOfEachSection;
        return [index, heightOfPoint, instantaneousSpeed];
      }),
      itemStyle: {
        color: 'rgb(200, 200, 0)',
      },
      emphasis: {
        lineStyle: {
          width: 2,
          color: 'rgb(200, 200, 0)',
        },
      },
    });
    startHeightOfCurrentSection = startHeightOfCurrentSection + heightOfEachSection + spacingBetweenEachSection;
  }
  // Cadence
  if (activity.cadenceData !== undefined) {
    const minCadence = Math.min.apply(
      null,
      activity.cadenceData.filter((x): x is number => x != null)
    );
    const cadenceRange = Math.abs((activity.maxCadence ?? 0) - minCadence);
    series.push({
      silent: true,
      hoverAnimation: false,
      symbol: 'none',
      sampling: 'average',
      type: 'line',
      name: 'Cadence',
      data: activity.cadenceData.map((instantaneousCadence, index) => {
        if (instantaneousCadence === null) {
          return [index, 'N/A', instantaneousCadence];
        }
        let percentageOfMax = (instantaneousCadence - minCadence) / cadenceRange;
        if (percentageOfMax < 0) {
          percentageOfMax = 0;
        }
        return [index, startHeightOfCurrentSection + percentageOfMax * heightOfEachSection, instantaneousCadence];
      }),
      itemStyle: {
        color: 'rgb(0, 128, 0)',
      },
      emphasis: {
        lineStyle: {
          width: 2,
          color: 'rgb(0, 128, 0)',
        },
      },
    });
    startHeightOfCurrentSection = startHeightOfCurrentSection + heightOfEachSection + spacingBetweenEachSection;
  }
  // Heart Rate
  if (activity.heartRateData !== undefined) {
    const minHeartRate = Math.min.apply(
      null,
      activity.heartRateData.filter((x): x is number => x != null)
    );
    const heartRateRange = Math.abs((activity.maxHeartRate ?? 0) - minHeartRate);
    series.push({
      silent: true,
      hoverAnimation: false,
      symbol: 'none',
      sampling: 'average',
      type: 'line',
      name: 'Heart Rate',
      data: activity.heartRateData.map((instantaneousHeartRate, index) => {
        if (instantaneousHeartRate === null) {
          return [index, 'N/A', instantaneousHeartRate];
        }
        let percentageOfMax = (instantaneousHeartRate - minHeartRate) / heartRateRange;
        if (percentageOfMax < 0) {
          percentageOfMax = 0;
        }
        return [index, startHeightOfCurrentSection + percentageOfMax * heightOfEachSection, instantaneousHeartRate];
      }),
      itemStyle: {
        color: 'rgb(255, 0, 0)',
      },
      emphasis: {
        lineStyle: {
          width: 2,
          color: 'rgb(255, 0, 0)',
        },
      },
    });
    startHeightOfCurrentSection = startHeightOfCurrentSection + heightOfEachSection + spacingBetweenEachSection;
  }
  // Power
  if (activity.powerData !== undefined) {
    const minPower = Math.min.apply(
      null,
      activity.powerData.filter((x): x is number => x != null)
    );
    const powerRange = Math.abs((activity.maxPower ?? 0) - minPower);
    series.push({
      silent: true,
      hoverAnimation: false,
      symbol: 'none',
      sampling: 'average',
      type: 'line',
      name: 'Power',
      data: activity.powerData.map((instantaneousPower, index) => {
        if (instantaneousPower === null) {
          return [index, 'N/A', instantaneousPower];
        }
        let percentageOfMax = (instantaneousPower - minPower) / powerRange;
        if (percentageOfMax < 0) {
          percentageOfMax = 0;
        }
        return [index, startHeightOfCurrentSection + percentageOfMax * heightOfEachSection, instantaneousPower];
      }),
      itemStyle: {
        color: 'rgb(0, 0, 255)',
      },
      emphasis: {
        lineStyle: {
          width: 2,
          color: 'rgb(0, 0, 255)',
        },
      },
    });
    startHeightOfCurrentSection = startHeightOfCurrentSection + heightOfEachSection + spacingBetweenEachSection;
  }
  series = series.reverse();
  return series;
}

function getAverage(input: Array<number | null>): number | undefined {
  let sum = 0;
  for (let i = 0; i < input.length; i += 1) {
    sum += input[i] ?? 0;
  }
  return sum / input.length;
}

function getMax(input: Array<number | null>): number | undefined {
  const firstNonNullValue = input.find((x) => x !== null);
  if (firstNonNullValue !== undefined) {
    const nonNullValues = input.filter((x): x is number => x != null);
    return Math.max.apply(null, nonNullValues);
  }
  return undefined;
}

type Props = {
  activity: Activity;
  distanceUnit: string;
  elevationUnit: string;
  saveLapCallback(lapToSave: { startIndex: number; endIndex: number }): void;
};

type ZoomSummary = {
  durationInSeconds: number;
  distanceInMeters: number | undefined;
  averagePower: number | undefined;
  averageHeartRate: number | undefined;
  averageCadence: number | undefined;
  averageSpeedInKilometersPerHour: number | undefined;
  maxPower: number | undefined;
  maxHeartRate: number | undefined;
  maxCadence: number | undefined;
  maxSpeedInKilometersPerHour: number | undefined;
};

type State = {
  chartHasBeenZoomed: boolean;
  zoomSummary: ZoomSummary | undefined;
  hideZoomSummary: boolean;
};

export default class PerformanceAnalysis extends React.Component<Props, State> {
  chart: echarts.ECharts | undefined;

  saveSegmentModalId: string;

  saveSegmentModal: Modal | undefined;

  zoomedDataStartIndex: number | undefined;

  zoomedDataEndIndex: number | undefined;

  database: Database;

  constructor(props: Props) {
    super(props);
    this.state = {
      chartHasBeenZoomed: false,
      zoomSummary: undefined,
      hideZoomSummary: false,
    };
    this.database = Database.getDatabaseInstance();
    this.saveSegmentModalId = uuidv4();
  }

  componentDidMount(): void {
    PubSub.subscribe('zoom-to-selection', (_msg: unknown, args: { startIndex: number; endIndex: number }) => {
      this.zoomToSelection(args);
    });

    const saveSegmentModalElement = document.getElementById(this.saveSegmentModalId);
    if (saveSegmentModalElement !== null) {
      this.saveSegmentModal = new Modal(saveSegmentModalElement);
    }

    const chartContainer = document.getElementById('performance-analysis-chart-container');
    if (chartContainer === null) {
      return;
    }

    this.chart = echarts.init(chartContainer);
    this.chart.setOption(this.getChartOptions());
    this.chart.getZr().on('mousedown', this.mouseDownEvent.bind(this));
    this.chart.getZr().on('mouseout', () => {
      PubSub.publish('performance-analysis-chart-hover-end');
    });
    this.chart.on('datazoom', this.dataZoomEvent.bind(this));
  }

  componentWillUnmount(): void {
    PubSub.unsubscribe('zoom-to-selection');
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
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            yAxisIndex: false,
            icon: {
              zoom: 'path://',
              back: 'path://',
            },
          },
          brush: {
            type: ['lineX', 'clear'],
            icon: {
              lineX: 'path://',
              clear: 'path://',
            },
          },
        },
      },
      brush: {
        xAxisIndex: 'all',
        brushLink: 'all',
        outOfBrush: {
          colorAlpha: 0.1,
        },
      },
      tooltip: {
        show: true,
        hideDelay: 0,
        trigger: 'axis',
        transitionDuration: 0,
        formatter: (params: Array<Record<string, unknown>>) => {
          const powerSeries = params.find((x) => x.seriesName === 'Power');
          const heartRateSeries = params.find((x) => x.seriesName === 'Heart Rate');
          const cadenceSeries = params.find((x) => x.seriesName === 'Cadence');
          const speedSeries = params.find((x) => x.seriesName === 'Speed');
          const elevationSeries = params.find((x) => x.seriesName === 'Elevation');

          const dataIndex = Number(params[0].dataIndex);

          let tooltipText = `<div style="width: 100%">`;
          tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5"><span class="performance-analysis-time-symbol"></span> Time</span>`;
          tooltipText += `<span class="d-table-cell w-100 text-end fw-bold"> ${UnitConverter.convertSecondsToHHmmss(dataIndex)}</span>`;
          tooltipText += `</li>`;

          const { distanceData } = props.activity;
          if (distanceData !== undefined) {
            const distanceValue = distanceData[dataIndex];
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
          if (powerSeries !== undefined) {
            tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5">${powerSeries.marker} Power (W)</span>`;
            const value = (powerSeries.data as Array<number>)[2];
            if (value === null) {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">N/A</span>`;
            } else {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">${value}</span>`;
            }
            tooltipText += `</li>`;
          }
          if (heartRateSeries !== undefined) {
            tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5">${heartRateSeries.marker} Heart Rate (bpm)</span>`;
            const value = (heartRateSeries.data as Array<number>)[2];
            if (value === null) {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">N/A</span>`;
            } else {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">${value}</span>`;
            }
            tooltipText += `</li>`;
          }
          if (cadenceSeries !== undefined) {
            tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5">${cadenceSeries.marker} Cadence (rpm)</span>`;
            const value = (cadenceSeries.data as Array<number>)[2];
            if (value === null) {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">N/A</span>`;
            } else {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">${value}</span>`;
            }
            tooltipText += `</li>`;
          }
          if (speedSeries !== undefined) {
            tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5">${speedSeries.marker} Speed (${props.distanceUnit}/h)</span>`;
            const value = (speedSeries.data as Array<number>)[2];
            if (value === null) {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">N/A</span>`;
            } else {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">${UnitConverter.convertMetersToUnit(
                value * 1000,
                props.distanceUnit
              )}</span>`;
            }
            tooltipText += `</li>`;
          }
          if (elevationSeries !== undefined) {
            tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5">${elevationSeries.marker} Elevation (${props.elevationUnit})</span>`;
            const value = (elevationSeries.data as Array<number | null | undefined>)[2];
            const gradient = (elevationSeries.data as Array<number | null | undefined>)[3];
            if (value === null || value === undefined) {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">N/A</span>`;
            } else {
              tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">${UnitConverter.convertMetersToUnit(value, props.elevationUnit)} ${
                gradient !== undefined ? `(${gradient}%)` : ``
              }</span>`;
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
        min: 0,
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
      series: getSeries(props.activity),
    };
  }

  getZoomSummary(startIndex: number, endIndex: number): ZoomSummary {
    const zoomSummary = { durationInSeconds: endIndex - startIndex } as ZoomSummary;

    const { props } = this;
    if (props.activity.powerData !== undefined) {
      const zoomedData = props.activity.powerData.slice(startIndex, endIndex);
      zoomSummary.averagePower = getAverage(zoomedData);
      if (zoomSummary.averagePower !== undefined) {
        zoomSummary.averagePower = Math.round(zoomSummary.averagePower);
      }
      zoomSummary.maxPower = getMax(zoomedData);
    }
    if (props.activity.heartRateData !== undefined) {
      const zoomedData = props.activity.heartRateData.slice(startIndex, endIndex);
      zoomSummary.averageHeartRate = getAverage(zoomedData);
      if (zoomSummary.averageHeartRate !== undefined) {
        zoomSummary.averageHeartRate = Math.round(zoomSummary.averageHeartRate);
      }
      zoomSummary.maxHeartRate = getMax(zoomedData);
    }
    if (props.activity.cadenceData !== undefined) {
      const zoomedData = props.activity.cadenceData.slice(startIndex, endIndex);
      zoomSummary.averageCadence = getAverage(zoomedData);
      if (zoomSummary.averageCadence !== undefined) {
        zoomSummary.averageCadence = Math.round(zoomSummary.averageCadence);
      }
      zoomSummary.maxCadence = getMax(zoomedData);
    }
    if (props.activity.speedDataInKilometersPerHour !== undefined) {
      const zoomedData = props.activity.speedDataInKilometersPerHour.slice(startIndex, endIndex);
      zoomSummary.averageSpeedInKilometersPerHour = getAverage(zoomedData);
      if (zoomSummary.averageSpeedInKilometersPerHour !== undefined) {
        zoomSummary.averageSpeedInKilometersPerHour = Number(zoomSummary.averageSpeedInKilometersPerHour.toFixed(2));
      }
      zoomSummary.maxSpeedInKilometersPerHour = getMax(zoomedData);
    }
    if (props.activity.distanceData !== undefined) {
      const zoomedData = props.activity.distanceData.slice(startIndex, endIndex);
      zoomSummary.distanceInMeters = (zoomedData[zoomedData.length - 1] ?? 0) - (zoomedData[0] ?? 0);
    }

    return zoomSummary;
  }

  zoomToSelection(args: { startIndex: number; endIndex: number }): void {
    PubSub.publish('performance-analysis-chart-zoom', args);
    const { activity } = this.props;
    const dataLength = activity.distanceData?.length;
    if (dataLength !== undefined) {
      this.chart?.dispatchAction({
        type: 'dataZoom',
        start: (args.startIndex / dataLength) * 100,
        end: (args.endIndex / dataLength) * 100,
      });
      this.setState({ chartHasBeenZoomed: true, zoomSummary: this.getZoomSummary(args.startIndex, args.endIndex) }, () => {
        this.chart?.dispatchAction({
          type: 'takeGlobalCursor',
          key: 'dataZoomSelect',
          dataZoomSelectActive: false,
        });
      });
    }
  }

  mouseDownEvent(): void {
    this.chart?.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'dataZoomSelect',
      dataZoomSelectActive: true,
    });
  }

  dataZoomEvent(args: Record<string, unknown>): void {
    if (args.batch !== undefined) {
      const batch = args.batch as Array<Record<string, unknown>>;
      const startIndex = Math.round(Number(batch[0].startValue));
      const endIndex = Math.round(Number(batch[0].endValue));
      if (this.zoomedDataStartIndex !== startIndex) {
        // Occasionally the zoom doesn't seem to trigger on the chart, manually triggering datazoom whenever the startIndex changes seems to fix it
        const { activity } = this.props;
        const dataLength = activity.distanceData?.length;
        if (dataLength !== undefined) {
          this.chart?.dispatchAction({
            type: 'dataZoom',
            start: (startIndex / dataLength) * 100,
            end: (endIndex / dataLength) * 100,
          });
        }
      }
      this.zoomedDataStartIndex = startIndex;
      this.zoomedDataEndIndex = endIndex;

      this.setState({ chartHasBeenZoomed: true, zoomSummary: this.getZoomSummary(startIndex, endIndex) }, () => {
        this.chart?.dispatchAction({
          type: 'takeGlobalCursor',
          key: 'dataZoomSelect',
          dataZoomSelectActive: false,
        });
      });

      PubSub.publish('performance-analysis-chart-zoom', { startIndex, endIndex });
    }
  }

  resetZoom(): void {
    this.chart?.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 100,
    });
    this.chart?.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'dataZoomSelect',
      dataZoomSelectActive: false,
    });
    this.setState({
      chartHasBeenZoomed: false,
    });
    PubSub.publish('performance-analysis-chart-zoom-reset');
  }

  showSaveSegmentModal(): void {
    const inputElement = document.getElementById('segment-name-input') as HTMLInputElement;
    inputElement.classList.remove('is-invalid');
    inputElement.value = '';
    this.saveSegmentModal?.show();
  }

  async saveSegment(): Promise<void> {
    // Validate the input
    const inputElement = document.getElementById('segment-name-input') as HTMLInputElement;
    const segmentName = inputElement.value;
    if (segmentName === '') {
      inputElement.classList.add('is-invalid');
      return;
    }
    inputElement.classList.remove('is-invalid');

    // Make sure a segment has been selected
    const { props } = this;
    if (this.zoomedDataStartIndex === undefined || this.zoomedDataEndIndex === undefined || props.activity.latitudeLongitudeData === undefined) {
      return;
    }

    const latitudeLongitudeData = props.activity.latitudeLongitudeData
      .slice(this.zoomedDataStartIndex, this.zoomedDataEndIndex)
      .filter((x) => x.latitude !== null && x.longitude !== null) as Array<{ latitude: number; longitude: number }>;
    const firstNonNullValue = latitudeLongitudeData.find((x) => x.latitude != null && x.longitude !== null);
    if (firstNonNullValue === undefined) {
      // Can't create a segment without any lat/long values
      return;
    }
    let minLatitude = Number(firstNonNullValue.latitude);
    let maxLatitude = minLatitude;
    let minLongitude = Number(firstNonNullValue.longitude);
    let maxLongitude = minLongitude;

    for (let i = 0; i < latitudeLongitudeData.length; i += 1) {
      const { latitude } = latitudeLongitudeData[i];
      const { longitude } = latitudeLongitudeData[i];
      if (latitude !== null && longitude !== null) {
        if (latitude < minLatitude) {
          minLatitude = latitude;
        }
        if (latitude > maxLatitude) {
          maxLatitude = latitude;
        }
        if (longitude < minLongitude) {
          minLongitude = longitude;
        }
        if (longitude > maxLongitude) {
          maxLongitude = longitude;
        }
      }
    }

    let segmentDistanceDataInMeters: Array<number> = [];
    let segementDistanceInMeters = 0;
    if (props.activity.distanceData !== undefined) {
      segmentDistanceDataInMeters = props.activity.distanceData
        .slice(this.zoomedDataStartIndex, this.zoomedDataEndIndex)
        .filter((x) => x !== null) as Array<number>;
      if (segmentDistanceDataInMeters.length > 0) {
        const startingDistance = segmentDistanceDataInMeters[0] ?? 0;
        segmentDistanceDataInMeters = segmentDistanceDataInMeters.map((x) => x - startingDistance);
        segementDistanceInMeters = segmentDistanceDataInMeters[segmentDistanceDataInMeters.length - 1] - segmentDistanceDataInMeters[0];
      }
    }

    let segmentElevationDataInMeters = props.activity.elevationDataInMeters?.slice(this.zoomedDataStartIndex, this.zoomedDataEndIndex) as
      | Array<number>
      | undefined;
    if (segmentElevationDataInMeters !== undefined) {
      segmentElevationDataInMeters = segmentElevationDataInMeters.filter((x) => x !== null);
    }
    let segmentGradientData = props.activity.gradientData?.slice(this.zoomedDataStartIndex, this.zoomedDataEndIndex) as Array<number> | undefined;
    if (segmentGradientData !== undefined) {
      segmentGradientData = segmentGradientData.filter((x) => x !== null);
    }

    let segment: Segment = {
      segmentId: undefined,
      userId: props.activity.userId,
      segmentName,
      minLatitude,
      maxLatitude,
      minLongitude,
      maxLongitude,
      distanceInMeters: segementDistanceInMeters,
      latitudeLongitudeData,
      elevationDataInMeters: segmentElevationDataInMeters,
      gradientData: segmentGradientData,
      distanceDataInMeters: segmentDistanceDataInMeters,
    };
    segment = await this.database.saveSegment(segment);
    ipcRenderer.send('segment-created', segment);
    this.saveSegmentModal?.hide();
  }

  saveLap(): void {
    if (this.zoomedDataStartIndex === undefined || this.zoomedDataEndIndex === undefined) {
      return;
    }
    const { props } = this;
    props.saveLapCallback({ startIndex: this.zoomedDataStartIndex, endIndex: this.zoomedDataEndIndex });
  }

  render(): JSX.Element {
    const { props, state } = this;

    return (
      <section className="component p-3">
        {/* Zoom Summary */}
        {state.chartHasBeenZoomed && state.zoomSummary !== undefined && (
          <div className="position-relative">
            <div className="position-absolute top-0 end-0 border bg-light" style={{ zIndex: 9999999999, borderRadius: '5px', minWidth: '250px' }}>
              <h6 className="text-center">Zoom Summary</h6>
              <button
                className="btn btn-secondary btn-sm position-absolute top-0 end-0 badge"
                type="button"
                onClick={() => this.setState({ hideZoomSummary: !state.hideZoomSummary })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  {!state.hideZoomSummary && (
                    <path
                      fillRule="evenodd"
                      d="M.172 15.828a.5.5 0 0 0 .707 0l4.096-4.096V14.5a.5.5 0 1 0 1 0v-3.975a.5.5 0 0 0-.5-.5H1.5a.5.5 0 0 0 0 1h2.768L.172 15.121a.5.5 0 0 0 0 .707zM15.828.172a.5.5 0 0 0-.707 0l-4.096 4.096V1.5a.5.5 0 1 0-1 0v3.975a.5.5 0 0 0 .5.5H14.5a.5.5 0 0 0 0-1h-2.768L15.828.879a.5.5 0 0 0 0-.707z"
                    />
                  )}
                  {state.hideZoomSummary && (
                    <path
                      fillRule="evenodd"
                      d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z"
                    />
                  )}
                </svg>
              </button>
              {!state.hideZoomSummary && (
                <section>
                  <table className="table table-light table-sm mb-0" style={{ font: '12px Microsoft YaHei' }}>
                    <tbody>
                      <tr>
                        <td>Time</td>
                        <td className="text-end" colSpan={2}>
                          {UnitConverter.convertSecondsToHHmmss(state.zoomSummary.durationInSeconds)}
                        </td>
                      </tr>
                      {state.zoomSummary.distanceInMeters !== undefined && (
                        <tr>
                          <td>Distance ({props.distanceUnit})</td>
                          <td className="text-end" colSpan={2}>
                            {UnitConverter.convertMetersToUnit(state.zoomSummary.distanceInMeters, props.distanceUnit)}
                          </td>
                        </tr>
                      )}
                      {state.zoomSummary.averagePower !== undefined && state.zoomSummary.maxPower !== undefined && (
                        <tr>
                          <td>Power (W)</td>
                          <td className="text-end">
                            <sub>AVG </sub>
                            {state.zoomSummary.averagePower}
                          </td>
                          <td className="text-end">
                            <sub>MAX </sub>
                            {state.zoomSummary.maxPower}
                          </td>
                        </tr>
                      )}
                      {state.zoomSummary.averageHeartRate !== undefined && state.zoomSummary.maxHeartRate !== undefined && (
                        <tr>
                          <td>Heart Rate (bpm)</td>
                          <td className="text-end">
                            <sub>AVG </sub>
                            {state.zoomSummary.averageHeartRate}
                          </td>
                          <td className="text-end">
                            <sub>MAX </sub>
                            {state.zoomSummary.maxHeartRate}
                          </td>
                        </tr>
                      )}
                      {state.zoomSummary.averageCadence !== undefined && state.zoomSummary.maxCadence !== undefined && (
                        <tr>
                          <td>Cadence (rpm)</td>
                          <td className="text-end">
                            <sub>AVG </sub>
                            {state.zoomSummary.averageCadence}
                          </td>
                          <td className="text-end">
                            <sub>MAX </sub>
                            {state.zoomSummary.maxCadence}
                          </td>
                        </tr>
                      )}
                      {state.zoomSummary.averageSpeedInKilometersPerHour !== undefined &&
                        state.zoomSummary.maxSpeedInKilometersPerHour !== undefined && (
                          <tr>
                            <td>Speed ({props.distanceUnit}/h)</td>
                            <td className="text-end">
                              <sub>AVG </sub>
                              {UnitConverter.convertMetersToUnit(state.zoomSummary.averageSpeedInKilometersPerHour * 1000, props.distanceUnit)}
                            </td>
                            <td className="text-end">
                              <sub>MAX </sub>
                              {UnitConverter.convertMetersToUnit(state.zoomSummary.maxSpeedInKilometersPerHour * 1000, props.distanceUnit)}
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                  <div className="d-grid gap-1 mt-1">
                    <button className="btn btn-sm btn-primary badge" type="button" onClick={() => this.showSaveSegmentModal()}>
                      Create Segment
                    </button>
                    <button className="btn btn-sm btn-primary badge" type="button" onClick={() => this.saveLap()}>
                      Save as Lap
                    </button>
                    <button className="btn btn-sm btn-primary badge" type="button" onClick={() => this.resetZoom()}>
                      Reset Zoom
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
        <div className="text-center">
          <span className="fs-3 fw-light">Performance Analysis</span>
        </div>
        <div id="performance-analysis-chart-container" style={{ minHeight: '300px' }} />
        {/* Save Segment Modal */}
        <div className="modal fade" id={this.saveSegmentModalId} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Segment</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <label htmlFor="segment-name-input" className="form-label w-100">
                  Name
                  <input type="text" className="form-control" id="segment-name-input" />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => this.saveSegment()}>
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
