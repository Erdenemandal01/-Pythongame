"""Build the distributable classroom edition; the original HTTPS site stays small."""
import base64
import json
import re
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist' / 'client'
TARGET = DIST / 'python-quest-classroom.zip'

# A worker cannot normally import another file:// script. The classroom edition
# starts its own blob worker and supplies local runtime bytes through browser APIs.
WORKER_SHIM = """
const packagedFiles = __FILES__;
const base = 'https://classroom.invalid/';
const decode = file => Uint8Array.from(atob(file.b64), c => c.charCodeAt(0));
const actualImport = self.importScripts.bind(self);
function packed(url) {
    const key = new URL(String(url),base).pathname.slice(1);
    if (!Object.hasOwn(packagedFiles,key)) throw Error('Файл багцад алга: '+key);
    return packagedFiles[key];
}
self.fetch = async function(input) {
    const file=packed(typeof input === 'string' || input instanceof URL ? input : input.url);
    return new Response(decode(file), {status:200,headers:{'Content-Type':file.type}});
};
self.importScripts = function(...urls) {
    for(const url of urls) {
        const file=packed(url);
        const local=URL.createObjectURL(new Blob([decode(file)],{type:file.type}));
        try { actualImport(local); } finally { URL.revokeObjectURL(local); }
    }
};
"""
LAUNCHER = """
(() => {
    window.PQ_CLASSROOM_KIT=true;
    const nativeWorker=window.Worker;
    let runnerURL;
    window.Worker = class ClassroomWorker extends nativeWorker {
        constructor(url,options) {
            if (new URL(url, document.baseURI).pathname.endsWith('/worker.js')) {
                if(!runnerURL) runnerURL=URL.createObjectURL(new Blob([__SCRIPT__],{type:'application/javascript'}));
                super(runnerURL,options);
            } else { super(url,options); }
        }
    };
})();
"""

def main():
    suffix_types={'.py':'text/plain;charset=utf-8','.js':'application/javascript',
                  '.json':'application/json','.zip':'application/zip','.wasm':'application/wasm'}
    runtime={}
    for path in [*sorted((DIST/'runtime').glob('*')), *sorted(DIST.glob('*-runner.py'))]:
        if path.suffix in suffix_types:
            runtime[path.relative_to(DIST).as_posix()] = {
                'type':suffix_types[path.suffix],
                'b64':base64.b64encode(path.read_bytes()).decode('ascii')
            }
    worker=(DIST/'worker.js').read_text(encoding='utf-8').replace('self.location.href', 'base')
    script=WORKER_SHIM.replace('__FILES__',json.dumps(runtime,separators=(',',':'))) + '\n' + worker
    launcher=LAUNCHER.replace('__SCRIPT__',json.dumps(script,ensure_ascii=True))
    with zipfile.ZipFile(TARGET,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
        for path in sorted(DIST.rglob('*')):
            if not path.is_file() or path==TARGET: continue
            name=path.relative_to(DIST).as_posix()
            if name in runtime or name=='worker.js': continue
            if name=='index.html':
                html=path.read_text(encoding='utf-8').replace('<script src="curriculum.js">',
                    '<script src="classroom-engine.js"></script><script src="curriculum.js">')
                html=re.sub(r'<span id="kit-download">.*?</span>', 'Python хөдөлгүүр энэ багцад багтсан.', html, count=1)
                archive.writestr(name,html)
            else: archive.write(path,name)
        archive.writestr('classroom-engine.js',launcher)
        archive.writestr('START-HERE.txt',
            'КОДЫН НҮҮДЭЛ / CODE NOMAD\n\n'
            'English: Extract all files and open index.html in a desktop browser. Choose English in the top bar. '
            'Start with Core lessons or open Optional practice to explore games. Python is included and runs offline. '
            'For the C and C++ relay adventure, open All lessons and choose a language. You can also download your source for a local compiler.\n\n'
            '1. ZIP файлыг бүгдийг нь нэг хавтаст задлаарай.\n'
            '2. Компьютер дээр index.html-ийг Chrome эсвэл Edge-ээр нээнэ. Python суулгах шаардлагагүй.\n'
            '3. «Python урлан»-д ороод хичээлийн дугаараа сонгоно.\n'
            '   C эсвэл C++ сурах бол «Бүх хичээл» хэсэгт хэлээ сонгоорой. Эх кодоо татаж компьютерийн хөрвүүлэгчээр ажиллуулж болно.\n'
            '4. Хичээл эхлэхэд баруун дээд буланд аялагчийн нэрээ ялгах хочоор солиорой.\n'
            '5. «Бүтээлээ татах» товчоор урлангийн ажлаа JSON файлд хадгална. Файлаа багшид өгөх эсвэл дараа «Бүтээлээ сэргээх» товчоор үргэлжлүүлээрэй.\n'
            '6. Төхөөрөмжийн профайл дахь «Нэг компьютер ээлжилж ашиглах» хэсэгт хүүхэд бүр өөрийн хочоор тоглож болно.\n'
            '7. «Миний түвшин» хэсэгт лууны өндгийг аварч, газрын зургаа засаж өөрөө даваарай. Түвшний файлыг найздаа өгвөл тэр өөрийн кодоор тоглоно.\n'
            '8. «Сонголтот урлан»-аас хүлэмж арчлах, луу сургах, хөгжим зохиох, алдаа мөрдөх эсвэл ангийн хот бүтээхийг сонгоно. «Миний хүлэмж»-д таван савтай сорилынхоо богино кодыг найздаа өгч болно.\n'
            '9. 41-р хичээлээр Дэнлүүний баярыг эхлүүлнэ. 65, 66-р хичээлээр өөрийн тоглоомыг туршиж, .py файлаа татаж ангийнхантайгаа солилцоорой.\n'
            '\nӨөрийн хурдаар сураарай. «Бүх хичээл» хэсгээс зорилгодоо тохирох хугацааны баримжааг харж болно. Хичээл бүрийн минут нь төлөвлөхөд зориулсан ойролцоо хугацаа.\n')
    print(f'{TARGET.name}: {TARGET.stat().st_size:,} bytes')

if __name__=='__main__': main()
