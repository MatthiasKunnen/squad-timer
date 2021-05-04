import {model, property} from 'decoverto';

@model()
export class Unit {

    @property()
    code: string;

    @property()
    name: string;

    @property()
    respawnTime: number;
}

@model()
export class Timer {

    @property()
    side: 'enemy' | 'friendly';

    @property()
    spawnsOn: Date;

    @property()
    unit: Unit;
}
