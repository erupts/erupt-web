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

    getSearch(code: string): {
        key: string,
        value: any
    }[] {
        return this.get(code, searchKey);
    }

    clearSearch(code: string) {
        this.delete(code, searchKey);
    }

    // saveColumnWidth(code: string, column: string, width: number) {
    //     let dataStr = localStorage.getItem(code);
    //     let data = {};
    //     if (!dataStr) {
    //         data = JSON.parse(dataStr);
    //     }
    //     data["column"] = query;
    //     localStorage.setItem(code, JSON.stringify(data));
    // }

    private save(code: string, key: string, query: any) {
        let dataStr = localStorage.getItem(code);
        let data = {};
        if (dataStr) {
            data = JSON.parse(dataStr);
        }
        data[key] = query;
        console.log(code)
        localStorage.setItem(code, JSON.stringify(data));
    }

    private get(code: string, key: string): any {
        let dataStr = localStorage.getItem(code);
        if (dataStr) {
            let data = JSON.parse(dataStr);
            return data[key];
        }
        return null;
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
