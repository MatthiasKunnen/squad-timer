import {Injectable} from '@angular/core';
import {Meta as MetaApi, Title} from '@angular/platform-browser';

import {removeUndefined} from '../utils/object.util';
import {Meta} from './meta.interface';

@Injectable({
    providedIn: 'root',
})
export class MetaService {
    private readonly meta: Meta;
    private readonly metaDefault = {
        description: 'Squad Timer helps you keep track of enemy vehicle respawn times.',
        image: `${window.location.origin}/assets/logo.png`,
        pageTitleSeparator: ' | ',
        pageTitleSuffix: 'Squad Timer',
        richTitle: 'Squad Timer, keep track of the enemy',
        title: '',
        type: 'website',
        url: '',
    };

    constructor(
        private readonly metaService: MetaApi,
        private readonly titleService: Title,
    ) {
        this.meta = {...this.metaDefault};
        this.updateMeta();
    }

    setMeta(meta: Partial<Meta>): void {
        if (meta.url === undefined) {
            // Always set URL tag
            meta.url = window.location.href;
        }

        if (meta.richTitle === undefined) {
            meta.richTitle = meta.title;
        }

        if (meta.image !== undefined && meta.image.startsWith('/')) {
            meta.image = `${window.location.origin}${meta.image}`;
        }

        removeUndefined(meta);
        Object.assign(this.meta, this.metaDefault, meta);
        this.updateMeta();
    }

    /**
     * Updates the meta tags according to `this.meta`.
     */
    private updateMeta() {
        this.updateAllTags('description', this.meta.description);
        this.updatePropertyTag('fb:app_id', this.meta.fbAppId);
        this.updateOGTag('image', this.meta.image);
        this.updateOGTag('title', this.meta.richTitle);
        this.updateOGTag('type', this.meta.type);
        this.updateOGTag('url', this.meta.url);

        const {pageTitleSuffix, title, pageTitleSeparator} = this.meta;

        const newTitle = title === ''
            ? pageTitleSuffix
            : `${title}${pageTitleSeparator}${pageTitleSuffix}`;

        this.titleService.setTitle(newTitle);
    }

    private updateAllTags(key: string, value?: string | null): void {
        this.updateOGTag(key, value);
        this.updateTag(key, value);
    }

    private updateOGTag(key: string, value?: string | null): void {
        this.updatePropertyTag(`og:${key}`, value);
    }

    private updatePropertyTag(key: string, value?: string | null): void {
        if (value == null || value === '') {
            this.metaService.removeTag(`property='${key}'`);
        } else {
            this.metaService.updateTag({
                content: value,
                property: key,
            });
        }
    }

    private updateTag(key: string, value?: string | null): void {
        if (value == null || value === '') {
            this.metaService.removeTag(`name='${key}'`);
        } else {
            this.metaService.updateTag({
                content: value,
                name: key,
            });
        }
    }
}
