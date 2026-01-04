import {Component, Input} from '@angular/core';
import {Announcement} from "@shared/model/user.model";

@Component({
    standalone: false,
  selector: 'app-announcement-detail',
  templateUrl: './announcement-detail.component.html',
  styleUrls: ['./announcement-detail.component.less']
})
export class AnnouncementDetailComponent {

    @Input() announcement: Announcement

}
