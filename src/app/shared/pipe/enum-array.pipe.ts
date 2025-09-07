import {Pipe, PipeTransform} from "@angular/core";

@Pipe({name: 'enumToArray'})
export class EnumToArrayPipe implements PipeTransform {

    constructor() {
    }

    transform(enumObj: any): string[] {
        return Object.keys(enumObj)
            .map(k => k);
    }
}
