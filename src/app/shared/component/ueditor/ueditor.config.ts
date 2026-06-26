export interface UEditorOptions {
  [key: string]: any;
  /** Required when using `cdn`; serves as the root path for all Ueditor resources such as languages, themes, and dialogs */
  UEDITOR_HOME_URL: string;
  /** Unified server request interface path */
  serverUrl?: string;
  /** All function buttons and dropdowns on the toolbar; can be redefined when instantiating a new editor to include only the needed items */
  toolbars?: string[][];
  /** Base z-index for the editor layer, default is `900` */
  zIndex?: number;
}

export class UEditorConfig {
  /**
   * Ueditor [frontend configuration options](http://fex.baidu.com/ueditor/#start-config)
   */
  options?: UEditorOptions;

  /**
   * Specifies the paths to ueditor.js and config.js — required for starting Ueditor
   * - **Always** set `options.UEDITOR_HOME_URL` (although it defaults to the path derived from `config.js`, setting it explicitly is more reliable in some environments)
   */
  js?: string[];

  /**
   * Hook
   * - Executed after the Ueditor object has finished loading
   * - Runs only once
   */
  hook?: (ue: any) => void;
}
