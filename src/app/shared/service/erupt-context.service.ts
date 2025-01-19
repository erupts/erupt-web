import {Injectable} from "@angular/core";

//Global Context Service

export enum ContextKey {
    INIT_MICRO_APP
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

    has(key: ContextKey): boolean {
        return !!this.contextValue[key];
    }
}
