(() => {
    'use strict';

    const stages = [
        {
            hours: '20–40 цаг',
            title: 'Анхан шат · Суурь ойлголт',
            topics: 'Хувьсагч, if/else нөхцөл, for/while давталт, функц, жагсаалт (list), толь бичиг (dict) ашиглаж сурна.',
            project: 'Долоо хоногийн зарлагаа ангилж, ангилал бүрийн нийлбэрийг гаргаарай.'
        },
        {
            hours: '60–120 цаг',
            title: 'Дунд шат · Практик хэрэглээ',
            topics: 'Объект хандалтат програмчлал (OOP), файл унших, бичих, алдаа боловсруулах, API-аас өгөгдөл авах аргыг туршаарай.',
            project: 'Цаг агаарын мэдээг API-аас авч файлд хадгалаарай. Холболт тасарвал хэрэглэгчид мэдэгдээрэй.'
        },
        {
            hours: '150–300+ цаг',
            title: 'Ахисан шат · Мэргэших чиглэл',
            topics: 'Цааш веб хөгжүүлэлтэд Django эсвэл Flask, өгөгдлийн шинжилгээнд pandas, NumPy болон SQL судалж болно. Сонирхвол хиймэл оюун, машин сургалт (AI/ML) руу гүнзгийрээрэй.',
            project: 'Номын бүртгэлийн апп эсвэл зарлагын тайлан бүтээгээд, бодит өгөгдлөөр шалгаж, бүтээлийн сандаа оруулаарай.'
        }
    ];

    function element(tag, className, text) {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function create({expanded = false} = {}) {
        const guide = element('details', 'pace-guide');
        guide.open = expanded;
        const summary = element('summary', 'pace-summary', 'Python сурахад хэдэн цаг төлөвлөх вэ?');
        const note = element('p', 'pace-note', 'Эдгээр нь эхэлсэн өдрөөсөө хойш хичээл, бие даасан дадлагад зарцуулах нийт цагийн баримжаа. Өмнөх туршлага, сурах хэмнэлээс тань шалтгаалж хугацаа өөр байна.');
        const list = element('ol', 'pace-stages');
        for (const stage of stages) {
            const item = element('li', 'pace-stage');
            const project = element('p', 'pace-project');
            project.append(element('strong', 'pace-project-label', 'Өөрөө турших'), ' · ' + stage.project);
            item.append(element('span', 'pace-hours', stage.hours), element('strong', 'pace-title', stage.title),
                element('p', 'pace-topics', stage.topics), project);
            list.append(item);
        }
        guide.append(summary, note, list);
        return guide;
    }

    window.StudyPace = Object.freeze({create});
})();
