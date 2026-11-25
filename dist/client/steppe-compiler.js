/* Clang and its WASI libraries are fetched only when the learner asks to run code. */
(() => {
    'use strict';
    let active = null;

    function compilerWorker() {
        const compilerUrl = 'https://cdn.jsdelivr.net/npm/browsercc@0.1.1/dist/index.js';
        const wasiUrl = 'https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/dist/index.js';
        const outputLimit = 16 * 1024;

        async function execute(module, stdin, api) {
            const warnings = [];
            const stdout = [];
            let totalSize = 0;
            function sink(chunks) {
                return new api.ConsoleStdout(bytes => {
                    totalSize += bytes.byteLength;
                    if (totalSize > outputLimit) throw new Error('Output limit exceeded (16 KiB).');
                    chunks.push(bytes.slice());
                });
            }
            const input = new TextEncoder().encode(stdin);
            const descriptors = [new api.OpenFile(new api.File(input)), sink(stdout), sink(warnings)];
            const wasi = new api.WASI(['adventure'], [], descriptors);
            const instance = await WebAssembly.instantiate(module, {wasi_snapshot_preview1: wasi.wasiImport});
            const code = wasi.start(instance);
            const output = await new Blob(stdout).text();
            const diagnostics = await new Blob(warnings).text();
            return {code, output, diagnostics};
        }

        self.onmessage = async ({data}) => {
            const outputs = [];
            let stage = 'loading';
            try {
                const [compiler, wasi] = await Promise.all([import(compilerUrl), import(wasiUrl)]);
                stage = 'compiling';
                self.postMessage({phase: stage});
                const isC = data.track === 'c';
                const flags = [
                    isC ? '--driver-mode=gcc' : '--driver-mode=g++',
                    isC ? '-std=c17' : '-std=c++17', '-O0', '-Wall', '-Wextra',
                    '-pedantic-errors', '-ferror-limit=5', '-Wl,--max-memory=67108864'
                ];
                if (!isC) flags.push('-fno-exceptions');
                const result = await compiler.compile({
                    source: data.source.endsWith('\n') ? data.source : data.source + '\n',
                    fileName: isC ? 'main.c' : 'main.cpp', flags
                });
                let diagnostics = result.compileOutput.slice(0, outputLimit);
                if (!result.module) {
                    self.postMessage({status:'compile', outputs, diagnostics});
                    return;
                }
                stage = 'running';
                for (const input of data.inputs) {
                    self.postMessage({phase:stage});
                    const run = await execute(result.module, input, wasi);
                    outputs.push(run.output);
                    diagnostics = (diagnostics + run.diagnostics).slice(0, outputLimit);
                    if (run.code !== 0) {
                        self.postMessage({status:'runtime', outputs, diagnostics:diagnostics + '\nExit code ' + run.code});
                        return;
                    }
                }
                self.postMessage({status:'ok', outputs, diagnostics});
            } catch (error) {
                self.postMessage({status:stage === 'running' ? 'runtime' : 'unavailable',
                    outputs, diagnostics:String(error.message || error).slice(0, outputLimit)});
            }
        };
    }

    function cancel() {
        if (active) active({status:'cancelled', outputs:[], diagnostics:''});
    }

    function run(track, source, inputs, onPhase) {
        cancel();
        if (!['c', 'cpp'].includes(track) || typeof source !== 'string' || source.length > 65536 ||
            !Array.isArray(inputs) || !inputs.length || inputs.length > 24 ||
            inputs.some(input => typeof input !== 'string' || input.length > 16384)) {
            return Promise.resolve({status:'runtime', outputs:[], diagnostics:'Input exceeds the lesson limits.'});
        }
        return new Promise(resolve => {
            let worker;
            let url;
            let timer;
            function finish(result) {
                clearTimeout(timer);
                worker?.terminate();
                if (url) URL.revokeObjectURL(url);
                if (active === finish) active = null;
                resolve(result);
            }
            function phase(name) {
                clearTimeout(timer);
                const timeout = name === 'running' ? 4000 : 180000;
                timer = setTimeout(() => finish({status:'timeout', outputs:[], diagnostics:name}), timeout);
                onPhase?.(name);
            }
            active = finish;
            try {
                const script = '(' + compilerWorker.toString() + ')();';
                url = URL.createObjectURL(new Blob([script], {type:'text/javascript'}));
                worker = new Worker(url, {name:'steppe-clang'});
                worker.onerror = event => finish({status:'unavailable', outputs:[], diagnostics:event.message || ''});
                worker.onmessage = ({data}) => data.phase ? phase(data.phase) : finish(data);
                phase('loading');
                worker.postMessage({track, source, inputs});
            } catch (error) {
                finish({status:'unavailable', outputs:[], diagnostics:error.message});
            }
        });
    }

    window.SteppeCompiler = Object.freeze({run, cancel});
})();
