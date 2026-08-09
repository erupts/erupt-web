import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {SharedModule} from '@shared/shared.module';
import {CanvasApiService} from '../../service/canvas-api.service';

/**
 * End-user access page of an AI canvas: fetches the generated page source by
 * its short code and embeds it in a full-size iframe. Mounted at #/ai/canvas/{code}.
 */
@Component({
    standalone: true,
    selector: 'erupt-ai-canvas-view',
    template: `
        <nz-spin [nzSpinning]="loading" style="height:100%">
            @if (html) {
                <iframe [srcdoc]="html" frameborder="0"
                        style="width:100%;height:100%;display:block;border:0"></iframe>
            }
        </nz-spin>
    `,
    styles: [`
        :host {
            display: block;
            height: 100%;
        }

        :host ::ng-deep .ant-spin-container {
            height: 100%;
        }
    `],
    imports: [SharedModule],
    providers: [CanvasApiService]
})
export class AiCanvasViewComponent implements OnInit {

    loading = true;

    html: SafeHtml | null = null;

    constructor(private api: CanvasApiService,
                private route: ActivatedRoute,
                private sanitizer: DomSanitizer) {
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.loading = true;
            this.api.html(params['code']).subscribe({
                next: html => {
                    this.loading = false;
                    this.html = this.sanitizer.bypassSecurityTrustHtml(html || '');
                },
                error: () => this.loading = false
            });
        });
    }

}
