import {Inject, Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {SettingsService} from "@delon/theme";
import {DataService} from "./data.service";
import {SocketService} from "./socket.service";
import {UtilsService} from "./utils.service";
import {WindowModel} from "../model/window.model";

// Extra fields kept on the delon token model
enum TokenField {
    // The lock flag rides inside the token model: a fresh sign-in replaces the model and an expired
    // session clears it, so neither can ever land on a locked screen
    Locked = "locked"
}

// Session-level actions shared by the header menu and the lock screen
@Injectable({providedIn: "root"})
export class SessionService {

    constructor(private router: Router,
                private settings: SettingsService,
                private dataService: DataService,
                private socketService: SocketService,
                private utilsService: UtilsService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    get locked(): boolean {
        return !!this.tokenService.get()?.[TokenField.Locked];
    }

    lock() {
        this.tokenService.set({...this.tokenService.get(), [TokenField.Locked]: true});
    }

    unlock() {
        const model = this.tokenService.get();
        delete model[TokenField.Locked];
        this.tokenService.set(model);
    }

    // Ends the session on both sides and returns to the matching sign-in page
    logout() {
        this.dataService.logout().subscribe(() => {
            this.socketService.closeSocket();
            const token = this.tokenService.get().token;
            if (WindowModel.eruptEvent && WindowModel.eruptEvent.logout) {
                WindowModel.eruptEvent.logout({userName: this.settings.user.name, token});
            }
            this.router.navigateByUrl(this.utilsService.isTenantToken() ? "/passport/tenant" : this.tokenService.login_url);
            this.tokenService.clear();
        });
    }

}
