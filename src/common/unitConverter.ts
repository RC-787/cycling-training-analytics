import { addMonths, addWeeks, addYears, endOfDay, endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from 'date-fns';

export default class UnitConverter {
  static convertSecondsToHHmmss(durationInSeconds: number): string {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor((durationInSeconds % 3600) % 60);

    const hourText = hours < 10 ? `0${hours}` : hours;
    const minuteText = minutes < 10 ? `0${minutes}` : minutes;
    const secondText = seconds < 10 ? `0${seconds}` : seconds;

    return `${hourText}:${minuteText}:${secondText}`;
  }

  static convertMetersToUnit(meters: number, targetUnit: string): string {
    if (targetUnit === 'm') {
      return `${meters.toFixed(2)}`;
    }
    if (targetUnit === 'km') {
      return `${(meters / 1000).toFixed(2)}`;
    }
    if (targetUnit === 'mi') {
      return `${(meters * 0.000621371).toFixed(2)}`;
    }
    if (targetUnit === 'ft') {
      return `${(meters * 3.28084).toFixed(2)}`;
    }
    return 'N/A';
  }

  static getStartAndEndDate(timeRange: string, firstDayOfWeek: number): { startDate: Date; endDate: Date } {
    switch (timeRange) {
      case 'Current Month':
        return { startDate: startOfMonth(new Date()), endDate: new Date() };
      case 'Current Week':
        return { startDate: startOfWeek(new Date(), { weekStartsOn: firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6 }), endDate: new Date() };
      case 'Previous Year':
        return { startDate: startOfYear(addYears(new Date(), -1)), endDate: endOfYear(addYears(new Date(), -1)) };
      case 'Previous Month':
        return { startDate: startOfMonth(addMonths(new Date(), -1)), endDate: endOfMonth(addMonths(new Date(), -1)) };
      case 'Previous Week':
        return {
          startDate: startOfWeek(addWeeks(new Date(), -1), { weekStartsOn: firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6 }),
          endDate: endOfWeek(addWeeks(new Date(), -1), { weekStartsOn: firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6 }),
        };
      case 'Current Year':
      default:
        return { startDate: startOfYear(new Date()), endDate: endOfDay(new Date()) };
    }
  }
}
