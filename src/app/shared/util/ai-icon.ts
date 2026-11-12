// The AI assistant's mark: two four-point sparkles (a speech bubble read as
// customer service, a light bulb as a tip). Registered once with ng-zorro's
// icon registry at startup (startup.service), so every AI entry renders it
// like any other icon: <i nz-icon [nzType]="AI_ICON">. A custom icon lives in
// a namespace; nzTheme does not apply to it.
export const AI_ICON = "erupt:ai";

export const AI_ICON_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
<path d="M10 5c.6 4.5 3.5 7.4 8 8-4.5.6-7.4 3.5-8 8-.6-4.5-3.5-7.4-8-8 4.5-.6 7.4-3.5 8-8Z"/>
<path d="M18.5 2c.3 2 1.5 3.2 3.5 3.5-2 .3-3.2 1.5-3.5 3.5-.3-2-1.5-3.2-3.5-3.5 2-.3 3.2-1.5 3.5-3.5Z"/>
</svg>`;
