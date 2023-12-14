/**
 * Created by liyuepeng on 10/16/19.
 */
import {Injectable} from "@angular/core";


const searchKey = "search";

const columnKey = "column";

@Injectable()
export class EruptStorageService {

    constructor() {
    }

    saveSearch(code: string, query: any) {
        this.save(code, searchKey, query);
    }

    saveColumnWidth(code: string, column: string, width: number) {
        // this.save(code, columnKey, data);
    }

    private save(code: string, key: string, query: any) {
        let dataStr = localStorage.getItem(code);
        let data = {};
        if (!dataStr) {
            data = JSON.parse(dataStr);
        }
        data[key] = query;
        localStorage.setItem(code, JSON.stringify(data));
    }

    private delete(code: string, key: string) {
        let dataStr = localStorage.getItem(code);
        if (dataStr) {
            let data = JSON.parse(dataStr);
            delete data[key];
        }
    }


}


export interface eruptStorage {

    search: any;

    table: Record<string, {
        width: number;
    }>

}
