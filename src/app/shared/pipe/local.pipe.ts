import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'local',
    standalone: false
})
export class LocalPipe implements PipeTransform {
    transform(value: any): string {
        if (!value) {
            return '';
        }
        if (typeof value === 'number') {
            return (<number>value).toLocaleString();
        }
        if (value.length === 10) {
            return new Date(value).toLocaleDateString();
        } else {
            return new Date(value).toLocaleString();
        }
    }
}

