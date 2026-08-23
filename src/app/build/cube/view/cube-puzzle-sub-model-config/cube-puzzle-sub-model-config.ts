import {Component, Input, OnInit} from '@angular/core';
import {DashboardDSL, FieldMapping, SubModelDSL} from '../../model/dashboard.model';
import {BaseField, CubeMeta} from '../../model/cube.model';
import {CubeApiService} from '../../service/cube-api.service';
import {VL} from '../../../erupt/model/erupt-field.model';
import {cloneDeep} from 'lodash';

@Component({
    selector: 'cube-puzzle-sub-model-config',
    templateUrl: './cube-puzzle-sub-model-config.html',
    styleUrls: ['./cube-puzzle-sub-model-config.less'],
    standalone: false
})
export class CubePuzzleSubModelConfig implements OnInit {

    @Input() cubeMeta: CubeMeta;
    @Input() dsl: DashboardDSL;

    subModels: SubModelDSL[] = [];
    sourcesList: VL[] = [];
    cubesMap: { [source: string]: VL[] } = {};
    exploresMap: { [sourceCube: string]: VL[] } = {};
    subMetaMap: { [key: string]: CubeMeta } = {};

    searchKeyword = '';

    get filteredSubModels(): { item: SubModelDSL; origIndex: number }[] {
        const kw = this.searchKeyword.trim().toLowerCase();
        return this.subModels
            .map((item, origIndex) => ({item, origIndex}))
            .filter(({item}) =>
                !kw ||
                item.alias?.toLowerCase().includes(kw) ||
                this.getCubeLabel(item.cube, item.source)?.toLowerCase().includes(kw) ||
                this.getExploreLabel(item.cube, item.explore, item.source)?.toLowerCase().includes(kw)
            );
    }

    readonly NEW_IDX = -2;
    editingIndex: number = -1;
    editForm: SubModelDSL = null;
    editSubMeta: CubeMeta = null;
    loadingExplores = false;
    loadingMeta = false;

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit() {
        if (!this.dsl.subModels) this.dsl.subModels = [];
        this.subModels = this.dsl.subModels;
        this.cubeApiService.sources().subscribe(res => {
            this.sourcesList = res.data || [];
        });
        // preload cube lists for every source referenced, so table labels resolve
        const sources = new Set<string>(this.subModels.map(it => this.src(it.source)));
        sources.add('local');
        sources.forEach(source => this.loadCubes(source));
    }

    src(source?: string): string {
        return source || 'local';
    }

    private loadCubes(source: string) {
        if (this.cubesMap[source]) return;
        this.cubeApiService.cubes(source).subscribe(res => {
            this.cubesMap[source] = res.data || [];
        });
    }

    onSourceChange() {
        this.editForm.cube = null;
        this.editForm.explore = null;
        this.editSubMeta = null;
        this.loadCubes(this.src(this.editForm.source));
    }

    onCubeChange(cube: string) {
        this.editForm.explore = null;
        this.editSubMeta = null;
        if (!cube) return;
        this.loadExplores(cube, this.editForm.source);
    }

    private loadExplores(cube: string, source?: string) {
        const key = `${this.src(source)}/${cube}`;
        if (this.exploresMap[key]) return;
        this.loadingExplores = true;
        this.cubeApiService.explores(cube, source).subscribe(res => {
            this.exploresMap[key] = res.data || [];
            this.loadingExplores = false;
        });
    }

    onExploreChange() {
        this.editForm.fieldMappings = [];
        this.editSubMeta = null;
        this.loadSubMeta();
    }

    loadSubMeta() {
        if (!this.editForm?.cube || !this.editForm?.explore) return;
        const key = `${this.src(this.editForm.source)}/${this.editForm.cube}/${this.editForm.explore}`;
        if (this.subMetaMap[key]) {
            this.editSubMeta = this.subMetaMap[key];
            return;
        }
        this.loadingMeta = true;
        this.cubeApiService.cubeMetadata(this.editForm.cube, this.editForm.explore, this.editForm.source).subscribe(res => {
            const meta = res.data;
            const fieldTitleMap = new Map<string, string>();
            const fieldMap = new Map<string, BaseField>();
            meta.dimensions?.forEach(it => {
                fieldTitleMap.set(it.code, it.title);
                fieldMap.set(it.code, it);
            });
            meta.measures?.forEach(it => {
                fieldTitleMap.set(it.code, it.title);
                fieldMap.set(it.code, it);
            });
            meta.parameters?.forEach(it => {
                fieldTitleMap.set(it.code, it.title);
                fieldMap.set(it.code, it);
            });
            meta.fieldTitleMap = fieldTitleMap;
            meta.fieldMap = fieldMap;
            this.subMetaMap[key] = meta;
            this.editSubMeta = meta;
            this.loadingMeta = false;
        });
    }

    private generateId(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    addNew() {
        this.editingIndex = this.NEW_IDX;
        this.editForm = {id: this.generateId(), alias: '', source: 'local', cube: '', explore: '', fieldMappings: []};
        this.editSubMeta = null;
    }

    startEdit(index: number) {
        this.editingIndex = index;
        this.editForm = cloneDeep(this.subModels[index]);
        this.editForm.source = this.src(this.editForm.source);
        this.editSubMeta = null;
        this.loadCubes(this.src(this.editForm.source));
        if (this.editForm.cube) {
            this.loadExplores(this.editForm.cube, this.editForm.source);
            if (this.editForm.explore) {
                this.loadSubMeta();
            }
        }
    }

    confirmEdit() {
        if (!this.editForm?.alias?.trim()) return;
        if (this.editingIndex === this.NEW_IDX) {
            this.subModels.push(this.editForm);
        } else {
            this.subModels[this.editingIndex] = this.editForm;
        }
        this.cancelEdit();
    }

    cancelEdit() {
        this.editingIndex = -1;
        this.editForm = null;
    }

    remove(index: number) {
        this.subModels.splice(index, 1);
        if (this.editingIndex === index) {
            this.cancelEdit();
        } else if (this.editingIndex > index) {
            this.editingIndex--;
        }
    }

    onDashboardFieldChange(mapping: FieldMapping) {
        if (!mapping.subField) return;
        const dashType = this.cubeMeta?.fieldMap?.get(mapping.dashboardField)?.type;
        const subType = this.editSubMeta?.fieldMap?.get(mapping.subField)?.type;
        if (dashType !== subType) {
            mapping.subField = null;
        }
    }

    getCompatibleSubDimensions(dashboardFieldCode: string) {
        const type = this.cubeMeta?.fieldMap?.get(dashboardFieldCode)?.type;
        return (this.editSubMeta?.dimensions || []).filter(f => !f.hidden && f.type === type);
    }

    getCompatibleSubParameters(dashboardFieldCode: string) {
        const type = this.cubeMeta?.fieldMap?.get(dashboardFieldCode)?.type;
        return (this.editSubMeta?.parameters || []).filter(f => !f.hidden && f.type === type);
    }

    addMapping() {
        if (!this.editForm.fieldMappings) this.editForm.fieldMappings = [];
        this.editForm.fieldMappings.push({dashboardField: null, subField: null});
    }

    removeMapping(index: number) {
        this.editForm.fieldMappings.splice(index, 1);
    }

    getAllMainFields() {
        if (!this.cubeMeta) return [];
        return [
            ...(this.cubeMeta.dimensions || []),
            ...(this.cubeMeta.parameters || [])
        ].filter(f => !f.hidden);
    }

    getAllSubFields() {
        if (!this.editSubMeta) return [];
        return [
            ...(this.editSubMeta.dimensions || []),
            ...(this.editSubMeta.parameters || [])
        ].filter(f => !f.hidden);
    }

    getCubeLabel(cube: string, source?: string): string {
        return (this.cubesMap[this.src(source)] || []).find(c => c.value === cube)?.label || cube;
    }

    getExploreLabel(cube: string, explore: string, source?: string): string {
        return (this.exploresMap[`${this.src(source)}/${cube}`] || []).find(e => e.value === explore)?.label || explore;
    }

    getSourceLabel(source?: string): string {
        const s = this.src(source);
        return this.sourcesList.find(it => it.value === s)?.label || s;
    }

    getFieldLabel(meta: CubeMeta, code: string): string {
        return meta?.fieldTitleMap?.get(code) || code;
    }

}
