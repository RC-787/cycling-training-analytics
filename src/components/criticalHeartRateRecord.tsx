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

export default class CriticalHeartRateRecord extends React.Component<Props, State> {
  chart: echarts.ECharts | undefined;

  database: Database;

  timeRangeDropdownId: string;

  componentIsMounted = false;

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
    this.componentIsMounted = true;

    const { user } = this.props;
    const { timeRange } = this.state;

    if (user.userId === undefined) {
      return;
    }

    const startAndEndDate = UnitConverter.getStartAndEndDate(timeRange, user.firstDayOfWeek);
    const activities = await this.database.getActivitiesByDateRange(user.userId, startAndEndDate.startDate, startAndEndDate.endDate);

    const criticalHeartRateData: Array<[number, number, Date]> = []; // seconds, heartRate, date
    for (let i = 0; i < activities.length; i += 1) {
      const criticalHeartRateForActivity = activities[i].criticalHeartRateData;
      if (criticalHeartRateForActivity !== undefined) {
        for (let j = 0; j < criticalHeartRateForActivity.length; j += 1) {
          if (criticalHeartRateData.length < j + 1) {
            criticalHeartRateData.push([j + 1, criticalHeartRateForActivity[j].value, activities[i].date]);
          } else if (criticalHeartRateData[j][1] < criticalHeartRateForActivity[j].value) {
            criticalHeartRateData[j] = [j + 1, criticalHeartRateForActivity[j].value, activities[i].date];
          }
        }
      }
    }

    if (this.componentIsMounted) {
      this.setState({ isLoading: false, dataFoundForSelectedTimeRange: criticalHeartRateData.length > 0 }, () => {
        const chartContainer = document.getElementById('critical-heart-rate-record-chart-container');
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
              const heartRate = data[1];
              const date = data[2];
              return `${UnitConverter.convertSecondsToHHmmss(timeInSeconds)}<br>${heartRate} bpm<br>${date.toLocaleDateString(user.dateFormat)}`;
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
              data: criticalHeartRateData,
              type: 'line',
              name: 'Heart Rate',
              symbol: 'none',
              lineStyle: {
                color: 'rgb(0, 0, 255)',
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
      });
    }
  }

  componentWillUnmount(): void {
    this.componentIsMounted = false;
  }

  async timeRangeChanged(updatedTimeRange: string): Promise<void> {
    const { user } = this.props;
    const { timeRange } = this.state;
    if (timeRange === updatedTimeRange || user.userId === undefined) {
      return;
    }

    const startAndEndDate = UnitConverter.getStartAndEndDate(updatedTimeRange, user.firstDayOfWeek);
    const activities = await this.database.getActivitiesByDateRange(user.userId, startAndEndDate.startDate, startAndEndDate.endDate);

    const criticalHeartRateData: Array<[number, number, Date]> = []; // seconds, heartRate, date
    for (let i = 0; i < activities.length; i += 1) {
      const criticalHeartRateForActivity = activities[i].criticalHeartRateData;
      if (criticalHeartRateForActivity !== undefined) {
        for (let j = 0; j < criticalHeartRateForActivity.length; j += 1) {
          if (criticalHeartRateData.length < j + 1) {
            criticalHeartRateData.push([j + 1, criticalHeartRateForActivity[j].value, activities[i].date]);
          } else if (criticalHeartRateData[j][1] < criticalHeartRateForActivity[j].value) {
            criticalHeartRateData[j] = [j + 1, criticalHeartRateForActivity[j].value, activities[i].date];
          }
        }
      }
    }

    if (this.componentIsMounted) {
      this.setState({ dataFoundForSelectedTimeRange: criticalHeartRateData.length > 0, timeRange: updatedTimeRange }, () => {
        const chartContainer = document.getElementById('critical-heart-rate-record-chart-container');
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
                const heartRate = data[1];
                const date = data[2];
                return `${UnitConverter.convertSecondsToHHmmss(timeInSeconds)}<br>${heartRate} bpm<br>${date.toLocaleDateString(user.dateFormat)}`;
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
                data: criticalHeartRateData,
                type: 'line',
                name: 'Heart Rate',
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
      });
    }
  }

  render(): JSX.Element {
    const { timeRange, isLoading, dataFoundForSelectedTimeRange } = this.state;

    if (isLoading) {
      return (
        <div className="noselect text-center component p-3">
          <span className="fs-3 fw-light">Critical Heart Rate</span>
          <br />
          <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      );
    }

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
              {timeRange}
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
          <span className="fs-3 fw-light">Critical Heart Rate</span>
          <br />
          {!dataFoundForSelectedTimeRange && <span className="fs-5 fw-light">No data found for the selected time range.</span>}
        </div>
        {dataFoundForSelectedTimeRange && <div id="critical-heart-rate-record-chart-container" style={{ minHeight: '300px' }} />}
      </div>
    );
  }
}
