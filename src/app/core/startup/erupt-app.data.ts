import {EruptAppModel} from "@shared/model/erupt-app.model";

let eruptAppConfig = window["eruptApp"] = {};

export class EruptAppData {

    static get() {
        return <EruptAppModel>eruptAppConfig;
    }

    static put(value: EruptAppModel) {
        eruptAppConfig = value;
    }

}
