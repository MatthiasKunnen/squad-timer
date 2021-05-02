/* eslint-disable max-len */
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatTabsModule} from '@angular/material/tabs';

import {GroupSharedModule} from '../dashboard/group/shared/group-shared.module';
import {CountdownComponent} from './countdown/countdown.component';
import {TimePickerInputComponent} from './time-picker-input/time-picker-input.component';
import {YesNoDialogComponent} from './yes-no-dialog/yes-no-dialog.component';
/* eslint-enable max-len */

@NgModule({
    declarations: [
        CountdownComponent,
        TimePickerInputComponent,
        YesNoDialogComponent,
    ],
    exports: [
        CountdownComponent,
        TimePickerInputComponent,
        YesNoDialogComponent,
    ],
    imports: [
        CommonModule,
        GroupSharedModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        MatProgressBarModule,
        MatTabsModule,
        ReactiveFormsModule,
    ],
})
export class SharedModule {
}
