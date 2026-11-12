import {Injectable, NgZone} from "@angular/core";
import {Router} from "@angular/router";
import {MenuService} from "@delon/theme";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {I18NService} from "@core";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {openResizableDrawer} from "@shared/component/resizable-drawer.component";

// The AI assistant's entry point. It shows in ONE of two places: a floating
// button in the bottom right corner of the shell (the default) or an icon in
// the header toolbar; the user moves it from either one's context menu. Both
// places render from this service, so they cannot disagree about where the
// entry is, whether it is loading, or what opening it means.
@Injectable({providedIn: "root"})
export class AiLauncherService {

    // localStorage flag: "false" = docked into the header
    private static readonly FLOAT_KEY = "ai-float";

    // the assistant's menu entry: its presence is the user's permission to use it
    private static readonly MENU_KEY = "ai-chat";

    // the chat bundle is lazy: true while it downloads
    loading = false;

    floating = localStorage.getItem(AiLauncherService.FLOAT_KEY) !== "false";

    constructor(private menuSrv: MenuService,
                private router: Router,
                private ngZone: NgZone,
                private i18n: I18NService) {
    }

    get available(): boolean {
        return !!EruptAppData.get().properties["erupt-ai"] && null != this.menuSrv.getItem(AiLauncherService.MENU_KEY);
    }

    setFloating(floating: boolean): void {
        this.floating = floating;
        localStorage.setItem(AiLauncherService.FLOAT_KEY, String(floating));
    }

    // The chat as a drawer over the current page. NzDrawerService is provided
    // by the drawer module, not in root, so the caller hands its own in.
    async openDrawer(drawer: NzDrawerService): Promise<void> {
        if (this.loading) return;
        this.loading = true;
        const {AiChatComponent} = await import("../../build/ai/view/ai-chat/ai-chat.component");
        // await on the native import() promise escapes the Angular zone (zone.js cannot
        // patch native async/await), so re-enter the zone before creating the drawer —
        // otherwise every async operation inside the drawer misses change detection.
        this.ngZone.run(() => {
            this.loading = false;
            openResizableDrawer(drawer, {
                nzTitle: null,
                nzContent: AiChatComponent,
                nzWidth: "520px",
                nzMask: false,
                nzClosable: false,
                nzKeyboard: true,
                nzPlacement: "right",
                nzBodyStyle: {
                    padding: "0",
                    overflow: "hidden"
                },
                nzContentParams: {
                    embedded: true,
                    drawerTitle: this.i18n.fanyi("ai.chat.title")
                }
            }, "header-ai");
        });
    }

    // The chat as a page of its own: the assistant's menu route
    openPage(): void {
        const link = this.menuSrv.getItem(AiLauncherService.MENU_KEY)?.link;
        if (link) {
            this.router.navigateByUrl(link);
        }
    }
}
