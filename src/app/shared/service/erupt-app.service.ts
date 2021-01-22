import {Injectable} from '@angular/core';
import {EruptAppModel} from "@shared/model/erupt-app.model";

@Injectable({
    providedIn: 'root'
})
export class EruptAppService {

    get eruptAppModel(): EruptAppModel {
        return this._eruptAppModel;
    }

    set eruptAppModel(value: EruptAppModel) {
        this._eruptAppModel = value;
    }

    private _eruptAppModel: EruptAppModel;

    constructor() {
    }


}
