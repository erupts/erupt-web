import {WindowModel} from "./window.model";

// How a record's detail form (view / edit / add) is presented. One nz-modal
// switches between the three at runtime, see FormModalService.
export enum FormPanelMode {
    // floating dialog over a dimmed page, draggable
    CENTER = "center",
    // panel docked to the right; in view mode the list behind stays clickable
    SIDE = "side",
    // covers the whole viewport
    FULL = "full"
}

// SettingsService.layout key holding the user's last choice.
export const FORM_PANEL_MODE_KEY = "formPanelMode";

// Legacy boolean switch ("drawer for details") kept readable as SIDE.
const LEGACY_DRAWER_KEY = "drawDraw";

function isMode(value: any): value is FormPanelMode {
    return Object.values(FormPanelMode).includes(value);
}

// Effective mode: the persisted choice wins, then the legacy drawer switch,
// then eruptSiteConfig.theme.formPanelMode, then the centered dialog.
export function formPanelModeOf(layout: Record<string, any>): FormPanelMode {
    const saved = layout[FORM_PANEL_MODE_KEY];
    if (isMode(saved)) return saved;
    if (layout[LEGACY_DRAWER_KEY]) return FormPanelMode.SIDE;
    const site = WindowModel.theme?.formPanelMode;
    return isMode(site) ? site : FormPanelMode.CENTER;
}
