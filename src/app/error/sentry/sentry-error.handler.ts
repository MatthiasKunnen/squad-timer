import {Breadcrumb, init} from '@sentry/browser';
import {Dedupe, ExtraErrorData, ReportingObserver} from '@sentry/integrations';

import {environment} from '../../../environments/environment';

export class SentryErrorHandler {

    private readonly enabled = environment.sentry.enabled;

    constructor() {
        if (this.enabled) {
            const objectDepth = 10;

            init({
                beforeBreadcrumb: (breadcrumb, hint) => {
                    return this.modifyBreadcrumb(breadcrumb, hint);
                },
                dsn: environment.sentry.dsn,
                environment: environment.environment,
                integrations: [
                    new ExtraErrorData({
                        depth: objectDepth,
                    }),
                    new ReportingObserver(),
                    new Dedupe(),
                ],
                normalizeDepth: objectDepth,
                release: environment.release,
            });
        }
    }

    private modifyBreadcrumb(breadcrumb: Breadcrumb, hint: any): Breadcrumb | null {
        switch (breadcrumb.category) {
            case 'ui.click':
                return this.breadcrumbUiClick(breadcrumb, hint);
            case 'ui.input':
                return this.breadcrumbUiInput(breadcrumb, hint);
        }

        return breadcrumb;
    }

    private breadcrumbUiClick(
        breadcrumb: Breadcrumb,
        {event}: {event: MouseEvent; name: 'click'},
    ): Breadcrumb | null {
        const message: Array<string> = [];

        const path = event.composedPath();
        message.push(this.pathToString(path));

        if (event.target instanceof HTMLElement) {
            message.push(event.target.innerText);
        }

        breadcrumb.message = message.map(m => m?.trim()).join(' > ');

        return breadcrumb;
    }

    private breadcrumbUiInput(breadcrumb: Breadcrumb, hint: any) {
        const target: HTMLElement = hint.event.target;

        const message = ['input'];

        const formControlName = target.getAttribute('formcontrolname');
        if (formControlName !== null) {
            message.push(`[formcontrolname=${formControlName}]`);
        }

        const placeholder = target.getAttribute('placeholder');
        if (placeholder !== null) {
            message.push(`[placeholder=${placeholder}]`);
        }

        breadcrumb.message = message.join(' ');

        return breadcrumb;
    }

    private pathToString(path: Array<any>): string {
        return path
            .filter(e => e instanceof HTMLElement)
            .reverse()
            .map((e: HTMLElement) => {
                let result = e.tagName.toLowerCase();

                const cl = Array.from(e.classList)
                    .filter(c => ['mat', 'ng'].every(prefix => !c.startsWith(prefix)))
                    .join(' ');

                if (cl.length > 0) {
                    result += `.[${cl}]`;
                }

                const id = e.getAttribute('id');
                if (id !== null) {
                    result += `#${id}`;
                }

                return result;
            })
            .join(' > ');
    }
}
