import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AiChatComponent } from './view/ai-chat/ai-chat.component';

const routes: Routes = [
    {
        path: 'chat',
        component: AiChatComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AiRoutingModule {}
