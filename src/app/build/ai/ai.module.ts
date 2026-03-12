import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { AiRoutingModule } from './ai-routing.module';
import { AiChatComponent } from './view/ai-chat/ai-chat.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ChatApiService } from './service/chat-api.service';
import { MarkdownService } from './service/markdown.service';

@NgModule({
    declarations: [AiChatComponent],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        AiRoutingModule,
        NzButtonModule,
        NzListModule,
        NzAvatarModule,
        NzInputModule,
        NzSelectModule,
        NzDropDownModule,
        NzIconModule,
        NzSpinModule,
        NzEmptyModule
    ],
    providers: [ChatApiService, MarkdownService]
})
export class AiModule {}
