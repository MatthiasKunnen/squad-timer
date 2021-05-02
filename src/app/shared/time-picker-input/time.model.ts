import {utcToZonedTime} from 'date-fns-tz';
import {jsonMember, jsonObject} from 'typedjson';

@jsonObject
export class Time {

    @jsonMember
    readonly hours: number;

    @jsonMember
    readonly minutes: number;

    @jsonMember
    readonly timeZone: string;

    private _date: Date | undefined;

    constructor(hours: number, minutes: number, timeZone: string) {
        this.hours = hours;
        this.minutes = minutes;
        this.timeZone = timeZone;
    }

    getDate(): Date {
        if (this._date === undefined) {
            this._date = new Date();
            this._date.setMinutes(this.minutes);
            this._date.setHours(this.hours);
            this._date.setSeconds(0);
            this._date = utcToZonedTime(this._date, this.timeZone);
        }

        return this._date;
    }
}
