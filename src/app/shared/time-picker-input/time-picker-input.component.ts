/* eslint-disable @typescript-eslint/tslint/config, @typescript-eslint/member-ordering */
import {FocusMonitor} from '@angular/cdk/a11y';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {
    Component,
    ElementRef,
    HostBinding,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Optional,
    Self,
    ViewChild,
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormControl,
    FormGroup,
    NgControl,
    ValidationErrors,
} from '@angular/forms';
import {MAT_FORM_FIELD, MatFormField, MatFormFieldControl} from '@angular/material/form-field';
import {ErrorRepository} from 'angular-error-repository';
import {Observable, Subject} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import timezones from 'timezones.json';

import {isEmpty} from '../utils/guards.util';
import {Time} from './time.model';

export type TimePickerData = Time | null;

interface PartsValue {
    hours: string | null | undefined;
    minutes: string | null | undefined;
    timeZone: string | null | undefined;
}

@Component({
    selector: 'app-time-picker-input',
    templateUrl: './time-picker-input.component.html',
    styleUrls: ['./time-picker-input.component.scss'],
    providers: [
        /* eslint-disable @typescript-eslint/no-use-before-define */
        {provide: MatFormFieldControl, useExisting: TimePickerInputComponent},
        /* eslint-enable @typescript-eslint/no-use-before-define */
    ],
})
export class TimePickerInputComponent
    implements ControlValueAccessor, MatFormFieldControl<TimePickerData>, OnInit, OnDestroy {

    static nextId = 0;
    static readonly timeZones: ReadonlyArray<string> = timezones.flatMap(zone => zone.utc).sort();

    @Input('aria-describedby') readonly userAriaDescribedBy: string;

    @HostBinding('id') readonly id = `time-picker-input-${TimePickerInputComponent.nextId++}`;

    @ViewChild('hours') hoursInput: HTMLInputElement;
    @ViewChild('minutes') minutesInput: HTMLInputElement;
    @ViewChild('timeZone') timeZoneInput: HTMLInputElement;

    parts: FormGroup;

    @Input()
    get placeholder(): string {
        return this._placeholder;
    }
    set placeholder(value: string) {
        this._placeholder = value;
        this.stateChanges.next();
    }
    private _placeholder: string;

    @Input()
    set required(value: any) {
        this._required = coerceBooleanProperty(value);
        this.ngControl.control?.updateValueAndValidity();
        this.stateChanges.next();
    }
    private _required = false;

    readonly autofilled: boolean;

    readonly controlType = 'timepicker-input';

    @Input()
    get disabled(): boolean {
        return this._disabled;
    }
    set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);

        if (this._disabled) {
            this.parts.disable();
        } else {
            this.parts.enable();
        }

        this.stateChanges.next();
    }
    private _disabled = false;

    get empty(): boolean {
        return Object.values(this.parts.value).every((v: any) => v == null || v.length === 0);
    }

    get errorState(): boolean {
        const invalid = this.ngControl.invalid ?? false;
        const showError = this.parts.dirty
            || this.parts.touched
            || this.ngControl?.touched === true
            || this.ngControl?.dirty === true;

        return showError && invalid;
    }

    focused: boolean;

    onChange = (_?: any) => undefined;

    onTouched = (_?: any) => undefined;

    @HostBinding('class.floating-label') get shouldLabelFloat() {
        return this.focused || !this.empty;
    }

    readonly stateChanges = new Subject<void>();
    readonly timeZones = TimePickerInputComponent.timeZones;
    timeZonesFiltered: Observable<ReadonlyArray<string>>;

    get value(): TimePickerData {
        if (this.ngControl.valid ?? false) {
            return new Time(
                Number(this.parts.value.hours),
                Number(this.parts.value.minutes),
                this.parts.value.timeZone,
            );
        }

        return null;
    }

    set value(value: TimePickerData) {
        this.parts.setValue({
            hours: this.numberToString(value?.hours),
            minutes: this.numberToString(value?.minutes),
            timeZone: value?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        this.stateChanges.next();
    }

    constructor(
        private readonly focusMonitor: FocusMonitor,
        private readonly elementRef: ElementRef<HTMLElement>,
        @Optional() @Inject(MAT_FORM_FIELD) public formField: MatFormField,
        @Optional() @Self() public ngControl: NgControl,
    ) {
        this.parts = new FormGroup({
            hours: new FormControl(null),
            minutes: new FormControl(null),
            timeZone: new FormControl(null),
        });
        this.timeZonesFiltered = this.parts.get('timeZone')!.valueChanges.pipe(
            startWith(''),
            map(value => this._filterTimeZones(value)),
        );

        focusMonitor.monitor(elementRef, true).subscribe(origin => {
            if (this.focused && origin == null) {
                this.onTouched();
            }

            this.focused = origin != null;
            this.stateChanges.next();
        });

        if (this.ngControl != null) {
            this.ngControl.valueAccessor = this;
        }
    }

    ngOnDestroy() {
        this.stateChanges.complete();
        this.focusMonitor.stopMonitoring(this.elementRef);
    }

    ngOnInit(): void {
        this.ngControl.control!.setValidators(this.validate.bind(this));
        this.ngControl.control!.updateValueAndValidity();
    }

    autoFocusNext(control: AbstractControl, nextElement?: HTMLInputElement): void {
        if (control.value.length > 1 && nextElement !== undefined) {
            this.focusMonitor.focusVia(nextElement, 'program');
        }
    }

    autoFocusNextArrows(control: HTMLInputElement, nextElement: HTMLInputElement): void {
        if (control.selectionStart === control.value.length) {
            this.focusMonitor.focusVia(nextElement, 'program');
        }
    }

    autoFocusPrevBackspace(control: AbstractControl, prevElement: HTMLInputElement): void {
        if (control.value == null || control.value.length < 1) {
            this.focusMonitor.focusVia(prevElement, 'program');
        }
    }

    autoFocusPrevArrows(control: HTMLInputElement, prevElement: HTMLInputElement): void {
        if (control.selectionStart === 0) {
            this.focusMonitor.focusVia(prevElement, 'program');
        }
    }

    onContainerClick() {
        // Don't care
    }

    writeValue(value: TimePickerData): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDescribedByIds(ids: Array<string>) {
        const controlElement = this.elementRef.nativeElement
            .querySelector('.time-picker-input-container')!;
        controlElement.setAttribute('aria-describedby', ids.join(' '));
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    _handleInput(control: AbstractControl, nextElement?: HTMLInputElement): void {
        this.autoFocusNext(control, nextElement);
        this.onChange(this.value);
    }

    validate(): ValidationErrors | null {
        const time: PartsValue | null | undefined = this.parts.value;

        if (time == null) {
            return this._required ? {required: true} : null;
        }

        const required = this._required || !isEmpty(time.hours) || !isEmpty(time.minutes);

        if (required) {
            if (this.parseTest(time.hours, 23)) {
                return {hoursParse: true};
            }

            if (this.parseTest(time.minutes, 59)) {
                return {minutesParse: true};
            }

            if (isEmpty(time.timeZone)) {
                return {timeZoneRequired: true};
            }
        }

        if (!isEmpty(time.timeZone) && !this.timeZones.includes(time.timeZone)) {
            return {timeZoneUnknown: true};
        }

        return null;
    }

    private numberToString(number: number | null | undefined): string | null {
        let string = number?.toString();

        if (string === undefined) {
            return null;
        }

        if (string.length === 1) {
            string = `0${string}`;
        }

        return string;
    }

    private _filterTimeZones(value: string | null | undefined): ReadonlyArray<string> {
        if (value == null) {
            return this.timeZones;
        }

        const filterValue = value.toLowerCase();

        return this.timeZones.filter(timeZone => timeZone.toLowerCase().includes(filterValue));
    }

    private parseTest(value: string | null | undefined, max: number): boolean {
        const number = Number(value);

        return isEmpty(value)
            || isNaN(number)
            || value.length > 2
            || number < 0
            || number > max;
    }
}

ErrorRepository.errorMessages['hoursParse'] = () => 'Could not parse hours';
ErrorRepository.errorMessages['minutesParse'] = () => 'Could not parse minutes';
ErrorRepository.errorMessages['timeZoneRequired'] = () => 'Time zone is required';
ErrorRepository.errorMessages['timeZoneUnknown'] = () => {
    return 'Unknown time zone, please select one from the list';
};
