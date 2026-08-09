import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AiChatComponent} from './view/ai-chat/ai-chat.component';
import {AiCanvasComponent} from './view/ai-canvas/ai-canvas.component';
import {AiCanvasViewComponent} from './view/ai-canvas-view/ai-canvas-view.component';

const routes: Routes = [
    {
        path: 'chat',
        component: AiChatComponent
    },
    {
        path: 'canvas/design/:code',
        component: AiCanvasComponent
    },
    {
        path: 'canvas/:code',
        component: AiCanvasViewComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AiRoutingModule {}
