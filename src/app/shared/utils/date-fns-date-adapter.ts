import {Injectable} from '@angular/core';
import {DateAdapter} from '@angular/material/core';
import {
    addDays,
    addMonths,
    addYears,
    format,
    getDate,
    getDay,
    getDaysInMonth,
    getMonth,
    getYear,
    parse,
    setDay,
    setMonth,
    toDate,
} from 'date-fns';

function range(start: number, end: number): Array<number> {
    const arr: Array<number> = [];

    for (let i = start; i <= end; i++) {
        arr.push(i);
    }

    return arr;
}

@Injectable()
export class DateFnsDateAdapter extends DateAdapter<Date> {

    addCalendarDays(date: Date, days: number): Date {
        return addDays(date, days);
    }

    addCalendarMonths(date: Date, months: number): Date {
        return addMonths(date, months);
    }

    addCalendarYears(date: Date, years: number): Date {
        return addYears(date, years);
    }

    clone(date: Date): Date {
        return toDate(date);
    }

    createDate(year: number, month: number, date: number): Date {
        return new Date(year, month, date);
    }

    format(date: Date, displayFormat: any): string {
        return format(date, displayFormat, {
            locale: this.locale,
        });
    }

    getDate(date: Date): number {
        return getDate(date);
    }

    getDateNames(): Array<string> {
        return range(1, 31).map(day => day.toString());
    }

    getDayOfWeek(date: Date): number {
        return getDay(date);
    }

    getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): Array<string> {
        const map = {
            long: 'EEEE',
            short: 'E..EEE',
            narrow: 'EEEEE',
        };

        const formatStr = map[style];
        const date = new Date();

        return range(0, 6).map(day => format(setDay(date, day), formatStr, {
            locale: this.locale,
        }));
    }

    getFirstDayOfWeek(): number {
        return this.locale?.options?.weekStartsOn ?? 1;
    }

    getMonth(date: Date): number {
        return getMonth(date);
    }

    getMonthNames(style: 'long' | 'short' | 'narrow'): Array<string> {
        const map = {
            long: 'LLLL',
            short: 'LLL',
            narrow: 'LLLLL',
        };

        const formatStr = map[style];
        const date = new Date();

        return range(0, 11).map(month => format(setMonth(date, month), formatStr, {
            locale: this.locale,
        }));
    }

    getNumDaysInMonth(date: Date): number {
        return getDaysInMonth(date);
    }

    getYear(date: Date): number {
        return getYear(date);
    }

    getYearName(date: Date): string {
        return format(date, 'yyyy');
    }

    invalid(): Date {
        return new Date(NaN);
    }

    isDateInstance(obj: any): boolean {
        return obj instanceof Date;
    }

    isValid(date: Date | any): boolean {
        return date instanceof Date && !isNaN(date.getTime());
    }

    parse(value: any, parseFormats: string | Array<string>): Date | null {
        parseFormats = typeof parseFormats === 'string' ? [parseFormats] : parseFormats;

        for (const parseFormat of parseFormats) {
            const parsed = parse(value, parseFormat, new Date(), {
                locale: this.locale,
            });

            if (this.isValid(parsed)) {
                return parsed;
            }
        }

        return null;
    }

    toIso8601(date: Date): string {
        return date.toISOString();
    }

    today(): Date {
        return new Date();
    }
}
