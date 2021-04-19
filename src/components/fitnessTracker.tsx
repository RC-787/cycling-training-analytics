import React from 'react';
import * as echarts from 'echarts';
import { v4 as uuidv4 } from 'uuid';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import startOfDay from 'date-fns/startOfDay';
import Database from '../common/database';
import User from '../types/user';
import UnitConverter from '../common/unitConverter';

function getChartOptions(
  startDate: Date,
  endDate: Date,
  tssDetails: Array<{ tss: number; date: Date }>,
  dateFormat: string
): Record<string, unknown> {
  tssDetails.sort((a, b) => b.date.getTime() - a.date.getTime());

  const allDates = eachDayOfInterval({ start: startDate, end: endDate });
  const ctlData: Array<number> = [];
  const atlData: Array<number> = [];
  const tsbData: Array<number> = [];
  for (let i = 0; i < allDates.length; i += 1) {
    const tssDataForDate = tssDetails.find((x) => startOfDay(x.date).getTime() === allDates[i].getTime());
    const tss = tssDataForDate?.tss ?? 0;

    // CTL = ctlYesterday + (tssToday - ctlYesterday) / 42
    const ctlYesterday = i > 0 ? ctlData[i - 1] : 0;
    const ctl = ctlYesterday + (tss - ctlYesterday) / 42;
    ctlData.push(ctl);

    // ATL = atlYesterday + (tssToday - atlYesterday) / 7
    const atlYesterday = i > 0 ? atlData[i - 1] : 0;
    const atl = atlYesterday + (tss - atlYesterday) / 7;
    atlData.push(atl);

    // TSB = CTL yesterday - ATL yesterday
    const tsb = ctlYesterday - atlYesterday;
    tsbData.push(tsb);
  }

  return {
    grid: {
      top: 25,
      left: 35,
      right: 10,
      bottom: 5,
    },
    tooltip: {
      show: true,
      hideDelay: 0,
      trigger: 'axis',
      transitionDuration: 0,
      formatter: (params: Array<Record<string, unknown>>) => {
        const atlSeries = params.find((x) => x.seriesName === 'ATL');
        const ctlSeries = params.find((x) => x.seriesName === 'CTL');
        const tsbSeries = params.find((x) => x.seriesName === 'TSB');
        const date = new Date(params[0].axisValue as Date);

        let tooltipText = `<div style="width: 100%">`;
        tooltipText += `<li class="performance-analysis-tooltip-list">`;
        tooltipText += `<span class="d-table-cell w-100 text-center fw-bold">${date.toLocaleDateString(dateFormat)}</span>`;
        tooltipText += `</li>`;
        if (ctlSeries !== undefined) {
          const ctl = ctlSeries.value as number;
          tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5">${ctlSeries.marker} CTL</span>`;
          tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">${ctl.toFixed(2)}</span>`;
          tooltipText += `</li>`;
        }
        if (atlSeries !== undefined) {
          const atl = atlSeries.value as number;
          tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5">${atlSeries.marker} ATL</span>`;
          tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">${atl.toFixed(2)}</span>`;
          tooltipText += `</li>`;
        }
        if (tsbSeries !== undefined) {
          const tsb = tsbSeries.value as number;
          tooltipText += `<li class="performance-analysis-tooltip-list"><span class="d-table-cell pe-5">${tsbSeries.marker} TSB</span>`;
          tooltipText += `<span class="d-table-cell w-100 text-end fw-bold">${tsb.toFixed(2)}</span>`;
          tooltipText += `</li>`;
        }

        return tooltipText;
      },
    },
    legend: {
      textStyle: {
        color: '#b3b3b3',
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allDates,
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
        hoverAnimation: false,
        type: 'line',
        name: 'CTL',
        data: ctlData,
        symbol: 'none',
      },
      {
        hoverAnimation: false,
        type: 'line',
        name: 'ATL',
        data: atlData,
        symbol: 'none',
      },
      {
        hoverAnimation: false,
        type: 'line',
        name: 'TSB',
        data: tsbData,
        symbol: 'none',
      },
    ],
  };
}

type Props = {
  user: User;
};

type State = {
  isLoading: boolean;
  numberOfActivitiesWithTssData: number;
  timeRange: string;
};

export default class FitnessTracker extends React.Component<Props, State> {
  chart: echarts.ECharts | undefined;

  database: Database;

  timeRangeDropdownId: string;

  componentIsMounted = false;

  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: true,
      numberOfActivitiesWithTssData: 0,
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
    if (this.componentIsMounted) {
      this.setState({ isLoading: false, numberOfActivitiesWithTssData: activities.length }, () => {
        const chartContainer = document.getElementById('fitness-tracker-chart-container');
        if (chartContainer === null) {
          return;
        }

        const tssDetails: Array<{ tss: number; date: Date }> = [];
        activities.forEach((activity) => {
          if (activity.tss !== undefined) {
            tssDetails.push({ tss: activity.tss, date: activity.date });
          }
        });

        this.chart = echarts.init(chartContainer);
        this.chart.setOption(getChartOptions(startAndEndDate.startDate, startAndEndDate.endDate, tssDetails, user.dateFormat));
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
    if (this.componentIsMounted) {
      this.setState({ numberOfActivitiesWithTssData: activities.length, timeRange: updatedTimeRange }, () => {
        const tssDetails: Array<{ tss: number; date: Date }> = [];
        activities.forEach((activity) => {
          if (activity.tss !== undefined) {
            tssDetails.push({ tss: activity.tss, date: activity.date });
          }
        });

        const chartContainer = document.getElementById('fitness-tracker-chart-container');
        if (chartContainer === null) {
          return;
        }
        if (!echarts.getInstanceByDom(chartContainer)) {
          this.chart = echarts.init(chartContainer);
        }
        if (this.chart !== undefined) {
          this.chart.setOption(getChartOptions(startAndEndDate.startDate, startAndEndDate.endDate, tssDetails, user.dateFormat));
        }
      });
    }
  }

  render(): JSX.Element {
    const { timeRange, isLoading, numberOfActivitiesWithTssData } = this.state;

    if (isLoading) {
      return (
        <div className="noselect text-center component p-3">
          <span className="fs-3 fw-light">Fitness Tracker</span>
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
      <div className="noselect text-center component p-3">
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
        <span className="fs-3 fw-light">Fitness Tracker</span>
        {numberOfActivitiesWithTssData === 0 && (
          <span className="fs-5 fw-light">
            <br />
            No activities found in the selected time range.
          </span>
        )}
        {numberOfActivitiesWithTssData > 0 && (
          <div id="fitness-tracker-chart-container" className="col-12" style={{ minHeight: '300px', overflowX: 'hidden' }} />
        )}
      </div>
    );
  }
}
