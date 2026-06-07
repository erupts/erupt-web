import {enableProdMode, ViewEncapsulation} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app/app.module';
import {environment} from '@env/environment';

if (environment.production) {
    enableProdMode();
}
// Angular 17: the preserveWhitespaces option has been removed
platformBrowserDynamic().bootstrapModule(AppModule, {
    defaultEncapsulation: ViewEncapsulation.Emulated
}).then(res => {
    const win = window as any;
    if (win && win.appBootstrap) {
        win.appBootstrap();
    }
    removePreloader();
    return res;
}).catch(err => {
    console.error(err);
    removePreloader();
});

// Manually implement the preloaderFinished functionality
function removePreloader(): void {
    const body = document.querySelector('body');
    const preloader = document.querySelector('.preloader');
    if (preloader && body) {
        // Stop the SiriWave animation
        const win = window as any;
        if (win.SW) {
            win.SW.stop();
            win.SW = null;
        }
        // Add the hidden class to trigger the transition animation
        preloader.addEventListener('transitionend', () => {
            preloader.className = 'preloader-hidden';
            body.style.overflow = '';
        });
        preloader.className += ' preloader-hidden-add preloader-hidden-add-active';
        // If the transition animation did not fire, hide directly
        setTimeout(() => {
            preloader.className = 'preloader-hidden';
            body.style.overflow = '';
        }, 100);
    }
}
