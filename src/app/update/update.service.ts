import {Injectable} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';
import {ToastrService} from 'ngx-toastr';

import {Logger} from '../utils/logger.util';

@Injectable()
export class UpdateService {

    constructor(
        private readonly toastr: ToastrService,
        private readonly updates: SwUpdate,
    ) {
        updates.available.subscribe(event => {
            this.update();
        });

        updates.activated.subscribe(event => {
            document.location.reload();
        });
    }

    checkForUpdate() {
        this.updates.checkForUpdate().catch(error => {
            this.toastr.error(`Could not check for update. ${error.message}`);
            Logger.error({
                error,
                message: 'Could not check for service worker update',
            });
        });
    }

    private update() {
        this.updates.activateUpdate().catch(error => {
            this.toastr.error(`Could not check for update. ${error.message}`);
            Logger.error({
                error,
                message: 'Could not activate service worker update',
            });
        });
    }
}
