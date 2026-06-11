import {NgModule} from '@angular/core';
import {AiRoutingModule} from './ai-routing.module';
import {AiChatComponent} from './view/ai-chat/ai-chat.component';

@NgModule({
    imports: [
        AiRoutingModule,
        AiChatComponent
    ]
})
export class AiModule {}
