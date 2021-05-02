import {Component, HostBinding, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface YesNoDialogData {
    content: string;
    title: string;
}

/**
 * Returns
 *  - _true_ if yes was clicked
 *  - _false_ when no was clicked
 *  - _undefined_ when the dialog was closed without clicking a button
 */
@Component({
    templateUrl: './yes-no-dialog.component.html',
    styleUrls: ['./yes-no-dialog.component.scss'],
})
export class YesNoDialogComponent {

    @HostBinding('class.mat-typography') matTypography = true;

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: YesNoDialogData,
    ) {
    }
}
