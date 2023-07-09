import {Pipe, PipeTransform} from "@angular/core";
import {I18NService} from "@core";

@Pipe({
    name: "translate"
})
export class I18nPipe implements PipeTransform {

    constructor(private i18nService: I18NService) {
    }

    transform(text: string) {
        return this.i18nService.fanyi(text);
    }

}
