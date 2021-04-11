import React from 'react';
import * as echarts from 'echarts';
import { v4 as uuidv4 } from 'uuid';
import Database from '../common/database';
import UnitConverter from '../common/unitConverter';
import User from '../types/user';

type Props = {
  user: User;
};

type State = {
  isLoading: boolean;
  dataFoundForSelectedTimeRange: boolean;
  timeRange: string;
};

export default class CriticalPowerRecord extends React.Component<Props, State> {
  chart: echarts.ECharts | undefined;

  database: Database;

  timeRangeDropdownId: string;

  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: true,
      dataFoundForSelectedTimeRange: false,
      timeRange: 'Current Year',
    };
    this.database = Database.getDatabaseInstance();
    this.timeRangeDropdownId = uuidv4();
  }

  async componentDidMount(): Promise<void> {
    const { props, state } = this;
    if (props.user.userId === undefined) {
      return;
    }

    const startAndEndDate = UnitConverter.getStartAndEndDate(state.timeRange, props.user.firstDayOfWeek);
    const activities = await this.database.getActivitiesByDateRange(props.user.userId, startAndEndDate.startDate, startAndEndDate.endDate);

    const criticalPowerData: Array<[number, number, Date]> = []; // seconds, power, date
    for (let i = 0; i < activities.length; i += 1) {
      const criticalPowerForActivity = activities[i].criticalPowerData;
      if (criticalPowerForActivity !== undefined) {
        for (let j = 0; j < criticalPowerForActivity.length; j += 1) {
          if (criticalPowerData.length < j + 1) {
            criticalPowerData.push([j + 1, criticalPowerForActivity[j].value, activities[i].date]);
          } else if (criticalPowerData[j][1] < criticalPowerForActivity[j].value) {
            criticalPowerData[j] = [j + 1, criticalPowerForActivity[j].value, activities[i].date];
          }
        }
      }
    }

    this.setState({ isLoading: false, dataFoundForSelectedTimeRange: criticalPowerData.length > 0 }, () => {
      const chartContainer = document.getElementById('critical-power-record-chart-container');
      if (chartContainer === null) {
        return;
      }
      this.chart = echarts.init(chartContainer);
      this.chart.setOption({
        tooltip: {
          show: true,
          trigger: 'axis',
          transitionDuration: 0,
          formatter(params: unknown) {
            const detail = (params as Array<unknown>)[0];
            const data = (detail as Record<string, unknown>).data as Array<[number, number, Date]>[0];
            const timeInSeconds = data[0];
            const power = data[1];
            const date = data[2];
            return `${UnitConverter.convertSecondsToHHmmss(timeInSeconds)}<br>${power} W<br>${date.toLocaleDateString(props.user.dateFormat)}`;
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
          min: 'dataMin',
          boundaryGap: false,
          splitLine: {
            show: true,
            lineStyle: {
              color: '#333',
            },
          },
        },
        series: [
          {
            data: criticalPowerData,
            type: 'line',
            name: 'Power',
            symbol: 'none',
            lineStyle: {
              color: 'rgb(0, 0, 255)',
              width: 2,
            },
            areaStyle: {
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
          },
        ],
      });
    });
  }

  async timeRangeChanged(timeRange: string): Promise<void> {
    const { props, state } = this;
    if (state.timeRange === timeRange || props.user.userId === undefined) {
      return;
    }

    const startAndEndDate = UnitConverter.getStartAndEndDate(timeRange, props.user.firstDayOfWeek);
    const activities = await this.database.getActivitiesByDateRange(props.user.userId, startAndEndDate.startDate, startAndEndDate.endDate);

    const criticalPowerData: Array<[number, number, Date]> = []; // seconds, power, date
    for (let i = 0; i < activities.length; i += 1) {
      const criticalPowerForActivity = activities[i].criticalPowerData;
      if (criticalPowerForActivity !== undefined) {
        for (let j = 0; j < criticalPowerForActivity.length; j += 1) {
          if (criticalPowerData.length < j + 1) {
            criticalPowerData.push([j + 1, criticalPowerForActivity[j].value, activities[i].date]);
          } else if (criticalPowerData[j][1] < criticalPowerForActivity[j].value) {
            criticalPowerData[j] = [j + 1, criticalPowerForActivity[j].value, activities[i].date];
          }
        }
      }
    }

    this.setState({ dataFoundForSelectedTimeRange: criticalPowerData.length > 0, timeRange }, () => {
      const chartContainer = document.getElementById('critical-power-record-chart-container');
      if (chartContainer === null) {
        return;
      }
      if (!echarts.getInstanceByDom(chartContainer)) {
        this.chart = echarts.init(chartContainer);
      }
      if (this.chart !== undefined) {
        this.chart.setOption({
          tooltip: {
            show: true,
            trigger: 'axis',
            transitionDuration: 0,
            formatter(params: unknown) {
              const detail = (params as Array<unknown>)[0];
              const data = (detail as Record<string, unknown>).data as Array<[number, number, Date]>[0];
              const timeInSeconds = data[0];
              const power = data[1];
              const date = data[2];
              return `${UnitConverter.convertSecondsToHHmmss(timeInSeconds)}<br>${power} W<br>${date.toLocaleDateString(props.user.dateFormat)}`;
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
            min: 'dataMin',
            boundaryGap: false,
            splitLine: {
              show: true,
              lineStyle: {
                color: '#333',
              },
            },
          },
          series: [
            {
              data: criticalPowerData,
              type: 'line',
              name: 'Power',
              symbol: 'none',
              lineStyle: {
                color: 'rgb(0, 0, 255)',
                width: 2,
              },
              areaStyle: {
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
            },
          ],
        });
      }
    });
  }

  render(): JSX.Element {
    const { state } = this;

    return (
      <div className="component p-3 h-100">
        <div className="text-end position-relative">
          <div className="dropdown position-absolute top-0 end-0">
            <button
              className="btn btn-outline-secondary dropdown-toggle"
              type="button"
              id={this.timeRangeDropdownId}
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {state.timeRange}
            </button>
            <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby={this.timeRangeDropdownId}>
              <li aria-hidden onClick={() => this.timeRangeChanged('Current Year')}>
                <span className="dropdown-item">Current Year</span>
              </li>
              <li aria-hidden onClick={() => this.timeRangeChanged('Current Month')}>
                <span className="dropdown-item">Current Month</span>
              </li>
              <li aria-hidden onClick={() => this.timeRangeChanged('Current Week')}>
                <span className="dropdown-item">Current Week</span>
              </li>
              <li aria-hidden onClick={() => this.timeRangeChanged('Previous Year')}>
                <span className="dropdown-item">Previous Year</span>
              </li>
              <li aria-hidden onClick={() => this.timeRangeChanged('Previous Month')}>
                <span className="dropdown-item">Previous Month</span>
              </li>
              <li aria-hidden onClick={() => this.timeRangeChanged('Previous Week')}>
                <span className="dropdown-item">Previous Week</span>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <span className="dropdown-item">Custom Time Range</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center">
          <span className="fs-3 fw-light">Critical Power</span>
          <br />
          {state.isLoading && <span className="fs-5 fw-light">Loading Critical Power data...</span>}
          {!state.isLoading && !state.dataFoundForSelectedTimeRange && (
            <span className="fs-5 fw-light">No data found for the selected time range.</span>
          )}
        </div>
        {!state.isLoading && state.dataFoundForSelectedTimeRange && <div id="critical-power-record-chart-container" style={{ minHeight: '300px' }} />}
      </div>
    );
  }
}
