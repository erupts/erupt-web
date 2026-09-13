import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {Status} from '../../../erupt/model/erupt-api.model';
import {RemoteApiService} from '../../service/remote-api.service';
import {ReuseTabService} from '@delon/abc/reuse-tab';
import {leaveReuseTab, setReuseTabTitle} from '@core';

/**
 * Route target for /remote/:id — requests the first ticket to learn the host's protocol,
 * then hands over to the desktop (VNC) or terminal (SSH) view.
 */
@Component({
    standalone: false,
    selector: 'app-remote-entry',
    template: `
        @if (protocol === 'SSH') {
            <app-remote-ssh [hostId]="hostId" [hostName]="hostName" [initialTicket]="ticket"></app-remote-ssh>
        } @else if (protocol) {
            <app-remote-desktop [hostId]="hostId" [hostName]="hostName" [initialTicket]="ticket"></app-remote-desktop>
        } @else {
            <div class="remote-shell">
                <div class="overlay" style="top: 0">
                    <div class="overlay-card">
                        @if (!error) {
                            <div class="spinner"></div>
                        }
                        <div class="overlay-text" [class.error]="!!error">{{ error || 'Requesting session…' }}</div>
                        @if (error) {
                            <div class="overlay-actions">
                                <button class="tb-btn" (click)="back()">Back</button>
                                <button class="tb-btn primary" (click)="load()">Retry</button>
                            </div>
                        }
                    </div>
                </div>
            </div>
        }
    `,
    styleUrls: ['../shared.less'],
    encapsulation: ViewEncapsulation.None
})
export class RemoteEntryComponent implements OnInit {

    hostId!: string;
    hostName = '';
    protocol = '';
    ticket = '';
    error = '';

    constructor(private route: ActivatedRoute, private router: Router, private location: Location, private api: RemoteApiService,
                private reuseTab: ReuseTabService) {
    }

    ngOnInit(): void {
        this.hostId = this.route.snapshot.paramMap.get('id')!;
        this.load();
    }

    load(): void {
        this.error = '';
        this.api.ticket(this.hostId).subscribe({
            next: res => {
                if (res.status !== Status.SUCCESS || !res.data) {
                    this.error = res.message || 'Failed to obtain a session ticket';
                    return;
                }
                this.hostName = res.data.name;
                // Not a menu item: name the tab after the host instead of the /remote/:id address
                setReuseTabTitle(this.reuseTab, this.route, this.hostName);
                this.ticket = res.data.ticket;
                this.protocol = res.data.protocol;
            },
            error: () => this.error = 'Failed to obtain a session ticket'
        });
    }

    back(): void {
        leaveReuseTab(this.reuseTab, this.router, this.location, '/build/table/RemoteHost');
    }
}
