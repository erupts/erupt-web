/**
 * Created by liyuepeng on 10/16/19.
 */
import {Inject, Injectable} from "@angular/core";
import {LazyService} from "@delon/util";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

@Injectable()
export class UtilsService {

    constructor(
        private lazy: LazyService,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService
    ) {
    }

    isTenantToken(): boolean {
        // No session yet (fresh load before login, or the token was cleared): treat as platform
        const token: string | undefined = this.tokenService.get()?.token;
        if (!token) return false;
        // "t_" prefix marks a tenant session token; the split check keeps legacy unsigned-JWT
        // tenant tokens (issued before tokens became opaque) working until they expire
        return token.startsWith("t_") || token.split(".").length == 3;
    }

    async loadScript(src: string) {
        await this.lazy.loadScript(src).then(res => res);
    }

    async loadStyle(src: string) {
        await this.lazy.loadStyle(src).then(res => res);
    }

}
