import {Pipe, PipeTransform} from "@angular/core";
import {DataService} from "@shared/service/data.service";

/**
 * A user's avatar as the backend stores it into something an <img> can load: an absolute
 * URL (an SSO provider's picture) is used as is, an uploaded path goes through the attachment
 * endpoint or the configured file domain with the session token. Null when there is none,
 * so nz-avatar falls back to its text.
 */
@Pipe({
    standalone: false,
    name: "avatar"
})
export class AvatarPipe implements PipeTransform {

    transform(path: string | null | undefined): string | null {
        return DataService.resolveAvatar(path);
    }

}
