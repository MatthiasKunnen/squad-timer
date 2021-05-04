import {Component, OnInit} from '@angular/core';

import {MetaService} from '../meta/meta.service';

@Component({
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit {

    constructor(
        private readonly meta: MetaService,
    ) {
    }

    ngOnInit(): void {
        this.meta.setMeta({
            title: 'About',
        });
    }
}
