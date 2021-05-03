import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AboutComponent} from './about/about.component';
import {NotFoundComponent} from './error/not-found/not-found.component';
import {SettingsComponent} from './settings/settings.component';
import {TimersComponent} from './timers/timers.component';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: TimersComponent,
    },
    {
        path: 'about',
        component: AboutComponent,
    },
    {
        path: 'settings',
        component: SettingsComponent,
    },
    {
        path: '**',
        component: NotFoundComponent,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {
}
