// Login page layout. The site default is eruptSiteConfig.theme.loginLayout; a
// choice made on the login page itself is kept in localStorage["login-layout"]
// (purged by index.html when theme.customizable is false).
export enum LoginLayout {
    CENTER = "center",       // the card centered on the artwork
    COVER = "cover",         // full-bleed artwork, the form as a panel docked to the right edge
    WIDE = "wide",           // one wide card: brand pane left, form right
    WALLPAPER = "wallpaper", // full-screen picture (theme.loginBackground), a frosted card in the middle
    POSTER = "poster"        // the brand as a poster-sized headline, the form as a small card bottom right
}

export const LOGIN_LAYOUT_KEY = "login-layout";

// A LoginLayout for a stored / configured string, or null for anything else
export function loginLayoutOf(value: string | null | undefined): LoginLayout | null {
    return (Object.values(LoginLayout) as string[]).includes(value || "") ? value as LoginLayout : null;
}
