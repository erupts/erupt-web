import {enableProdMode, ViewEncapsulation} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {preloaderFinished} from '@delon/theme';
import {AppModule} from './app/app.module';
import {environment} from '@env/environment';

preloaderFinished();

if (environment.production) {
    enableProdMode();
}
platformBrowserDynamic().bootstrapModule(AppModule, {
    defaultEncapsulation: ViewEncapsulation.Emulated,
    preserveWhitespaces: false
}).then(res => {
    const win = window as any;
    if (win && win.appBootstrap) {
        win.appBootstrap();
    }
    return res;
}).catch(err => console.error(err));
