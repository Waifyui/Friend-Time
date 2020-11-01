import moment, { Moment, tz } from 'moment-timezone';

export abstract class TimeUtils {
    public static now(): Moment {
        return moment.utc();
    }

    public static getMoment(time: Date | string): Moment {
        if (!time) {
            return;
        }

        return moment.utc(time);
    }

    public static getMomentInZone(zone: string): Moment {
        return tz(zone);
    }
}
