export interface Cpu {
    cpuNum: number;
    freq: string;
    sys: string;
    user: string;
    usage: number | string;
}

export interface Mem {
    total: string;
    used: string;
    free: string;
    usage: number | string;
}

export interface Jvm {
    total: string;
    used: string;
    free: string;
    usage: number | string;
    name: string;
    version: string;
    threadCount: number;
    pid: string;
    home: string;
    path: string;
    inputArgs: string;
}

export interface Sys {
    hostName: string;
    name: string;
    date: string;
    arch: string;
}

export interface Gpu {
    deviceId: string;
    name: string;
    vendor: string;
    memorySize: number;
    versionInfo: string;
}

export interface SysFile {
    dirName: string;
    sysTypeName: string;
    typeName: string;
    total: string;
    free: string;
    used: string;
    usage: string;
}

export interface Io {
    netRecv: number;
    netSent: number;
    diskRead: number;
    diskWrite: number;
    netRecvText: string;
    netSentText: string;
    diskReadText: string;
    diskWriteText: string;
}

export interface Server {
    cpu: Cpu;
    mem: Mem;
    jvm: Jvm;
    sys: Sys;
    gpus: Gpu[];
    io: Io;
    sysFiles: SysFile[];
    startupDate: string;
    runDay: string;
}

export interface Platform {
    eruptVersion: string;
    eruptCount: number;
    eruptModules: string[];
    sessionStrategy: string;
    uploadPath: string;
}

export interface RedisCmdStat {
    name: string;
    value: string;
}

export interface RedisInfo {
    version: string;
    port: string;
    day: string;
    clientNum: string;
    totalMem: string;
    usedMem: string;
    usedMemPeak: string;
    fragRatio: string;
    keyNum: number;
    evictedKeys: number;
    ops: string;
    hitRate: string;
    isCluster: boolean;
    isAOF: boolean;
    rdbStatus: string;
    redisCmdStat: RedisCmdStat[];
}

export interface Gc {
    name: string;
    count: number;
    time: number;
}

export interface MemoryPool {
    name: string;
    type: string;
    used: number;
    committed: number;
    max: number;
    usedText: string;
    committedText: string;
    maxText: string;
    usage: string;
}

export interface ClassLoad {
    loaded: number;
    total: number;
    unloaded: number;
}

export interface ThreadStat {
    live: number;
    daemon: number;
    peak: number;
    totalStarted: number;
    deadlock: number;
    states: { [state: string]: number };
}

export interface JvmDiagnosis {
    gc: Gc[];
    memoryPools: MemoryPool[];
    classLoading: ClassLoad;
    threads: ThreadStat;
}

export interface HttpStat {
    uri: string;
    count: number;
    avgMs: number;
    maxMs: number;
    errorCount: number;
}

export interface DataSourcePool {
    name: string;
    jdbcUrl: string;
    active: number;
    idle: number;
    total: number;
    waiting: number;
    max: number;
    min: number;
}
