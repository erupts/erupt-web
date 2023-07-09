import {Pipe, PipeTransform} from "@angular/core";
import {DomSanitizer} from "@angular/platform-browser";

@Pipe({
  name: "safeScript"
})
export class SafeScriptPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {
  }

  transform(url: string) {
    return this.sanitizer.bypassSecurityTrustScript(url);
  }

}
