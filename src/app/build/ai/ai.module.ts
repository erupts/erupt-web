import {NgModule} from '@angular/core';
import {AiRoutingModule} from './ai-routing.module';
import {AiChatComponent} from './view/ai-chat/ai-chat.component';
import {AiCanvasComponent} from './view/ai-canvas/ai-canvas.component';
import {AiCanvasViewComponent} from './view/ai-canvas-view/ai-canvas-view.component';

@NgModule({
    imports: [
        AiRoutingModule,
        AiChatComponent,
        AiCanvasComponent,
        AiCanvasViewComponent
    ]
})
export class AiModule {}
