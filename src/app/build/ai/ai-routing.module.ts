import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AiChatComponent} from './view/ai-chat/ai-chat.component';
import {AiCanvasComponent} from './view/ai-canvas/ai-canvas.component';

const routes: Routes = [
    {
        path: 'chat',
        component: AiChatComponent
    },
    {
        path: 'canvas/:id',
        component: AiCanvasComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AiRoutingModule {}
