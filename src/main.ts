import {enableProdMode, ViewEncapsulation} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app/app.module';
import {environment} from '@env/environment';

if (environment.production) {
    enableProdMode();
}
// Angular 17: preserveWhitespaces 选项已移除
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

// 手动实现 preloaderFinished 功能
function removePreloader(): void {
    const body = document.querySelector('body');
    const preloader = document.querySelector('.preloader');
    if (preloader && body) {
        // 停止 SiriWave 动画
        const win = window as any;
        if (win.SW) {
            win.SW.stop();
            win.SW = null;
        }
        // 添加隐藏类以触发过渡动画
        preloader.addEventListener('transitionend', () => {
            preloader.className = 'preloader-hidden';
            body.style.overflow = '';
        });
        preloader.className += ' preloader-hidden-add preloader-hidden-add-active';
        // 如果过渡动画没有触发，直接隐藏
        setTimeout(() => {
            preloader.className = 'preloader-hidden';
            body.style.overflow = '';
        }, 100);
    }
}
