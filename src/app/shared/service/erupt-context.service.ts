import {Injectable} from "@angular/core";


export enum ContextKey {

}

@Injectable()
export class EruptContextService {

    private contextValue = {};

    set(key: ContextKey, value: any) {
        this.contextValue[key] = value;
    }

    get(key: ContextKey) {
        return this.contextValue[key];
    }

}
