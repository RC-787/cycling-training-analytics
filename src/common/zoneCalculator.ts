import Zone from '../types/zone';

export default class ZoneCalculator {
  static getPowerZones(ftp: number, powerZoneSystem: string): Zone[] {
    if (powerZoneSystem === 'Coggan') {
      return this.getCogganPowerZones(ftp);
    }
    if (powerZoneSystem === 'Polarized') {
      return this.getPolarizedPowerZones(ftp);
    }

    return this.getCogganPowerZones(ftp);
  }

  static getCogganPowerZones(ftp: number): Zone[] {
    return [
      { description: 'Zone 1 (Active Recovery)', startValue: 0, endValue: Math.round(ftp * 0.55) },
      { description: 'Zone 2 (Endurance)', startValue: Math.round(ftp * 0.55) + 1, endValue: Math.round(ftp * 0.75) },
      { description: 'Zone 3 (Tempo)', startValue: Math.round(ftp * 0.75) + 1, endValue: Math.round(ftp * 0.9) },
      { description: 'Zone 4 (Lactate Threshold)', startValue: Math.round(ftp * 0.9) + 1, endValue: Math.round(ftp * 1.05) },
      { description: 'Zone 5 (VO2 Max)', startValue: Math.round(ftp * 1.05) + 1, endValue: Math.round(ftp * 1.2) },
      { description: 'Zone 6 (Anaerobic Capacity)', startValue: Math.round(ftp * 1.2) + 1, endValue: Infinity },
    ];
  }

  static getPolarizedPowerZones(ftp: number): Zone[] {
    return [
      { description: 'Low', startValue: 0, endValue: Math.round(ftp * 0.8) },
      { description: 'Moderate', startValue: Math.round(ftp * 0.8) + 1, endValue: ftp },
      { description: 'High', startValue: ftp + 1, endValue: Infinity },
    ];
  }

  static getHeartRateZones(lthr: number, heartRateZoneSystem: string): Zone[] {
    if (heartRateZoneSystem === 'Coggan') {
      return this.getCoggaHeartRateZones(lthr);
    }

    return this.getCoggaHeartRateZones(lthr);
  }

  static getCoggaHeartRateZones(lthr: number): Zone[] {
    return [
      { description: 'Zone 1 (Active Recovery)', startValue: 0, endValue: Math.round(lthr * 0.68) },
      { description: 'Zone 2 (Endurance)', startValue: Math.round(lthr * 0.68) + 1, endValue: Math.round(lthr * 0.83) },
      { description: 'Zone 3 (Tempo)', startValue: Math.round(lthr * 0.83) + 1, endValue: Math.round(lthr * 0.94) },
      { description: 'Zone 4 (Lactate Threshold)', startValue: Math.round(lthr * 0.94) + 1, endValue: Math.round(lthr * 1.05) },
      { description: 'Zone 5 (VO2 Max)', startValue: Math.round(lthr * 1.05) + 1, endValue: Infinity },
    ];
  }
}
