(() => {
    'use strict';
    const t = (mn, en) => GameLocale.lang === 'en' ? en : mn;
    const companions = {
        1: {
            sprite:'archer', name:t('Халиун', 'Khaliun'), meet:t('Халиунтай уулзах','Meet Khaliun'), role:t('Тайгын харваач', 'Taiga archer'),
            portrait:t('Хүрэн улаан хувцас, дугуй гуулин зүүлттэй Халиун нумаа барин зогсоно.','Khaliun holds a bow and wears burgundy with a round brass medallion.'),
            title:t('Салаа жим', 'A fork in the trail'),
            story:t('Борооны дараа доод жимд ус тогтдог юм. Гутлаа норгохгүй гэвэл аль жимээр явах вэ? Чи энэ кодын хариуг түрүүлээд хэл дээ.',
                'The lower trail floods after rain. Which path would keep your boots dry? Try to predict what this code will say.'),
            code:t('wet = True\nif wet:\n    print("Дээд жим")\nelse:\n    print("Доод жим")',
                'wet = True\nif wet:\n    print("Upper trail")\nelse:\n    print("Lower trail")'),
            output:t('Дээд жим', 'Upper trail'),
            clue:t('wet нь True тул if доторх мөр ажиллана. Жим хатаж утга нь False болбол else доторх мөр ажиллана.',
                'Because wet is True, the line inside if runs. When the trail dries and wet becomes False, the line inside else runs.')
        },
        2: {
            sprite:'guardian', name:t('Түшиг', 'Tushig'), meet:t('Түшигтэй уулзах','Meet Tushig'), role:t('Давааны харуул', 'Pass guardian'),
            portrait:t('Саарал үстэй дуулга, мөнгөлөг ялтсан хуяг, урт түрийтэй гутал өмссөн Түшиг.','Tushig wears a grey fur-trimmed helmet, silver lamellar armour and tall riding boots.'),
            title:t('Давааны гурван тэмдэг', 'Three trail markers'),
            story:t('Манан буухаас өмнө давааны тэмдгүүдээ дугаарлая. Энэ давталт хэдээс эхлээд хаана зогсох бол?',
                'Let’s number the markers before the mist rolls in. Where will this loop start and stop?'),
            code:'for marker in range(1, 4):\n    print(marker)',
            output:'1\n2\n3',
            clue:t('range(1, 4) нь 1-ээс эхэлж, 4-ийн өмнө зогсоно. Тиймээс гурван тэмдгийн дугаар хэвлэгдлээ.',
                'range(1, 4) starts at 1 and stops before 4. That gives us exactly three numbered markers.')
        },
        3: {
            sprite:'pathfinder', name:t('Мөрөн', 'Mörön'), meet:t('Мөрөнтэй уулзах','Meet Mörön'), role:t('Жингийн хөтөч', 'Caravan pathfinder'),
            portrait:t('Хөх дээл, шар бүс, улаан оройтой малгай, ээтэн хоншоортой монгол гутал өмссөн Мөрөн саравчлан алсыг харж байна.','Mörön shades his eyes to scout the trail. He wears a blue Mongolian deel, a saffron sash, a red-tipped hat and upturned leather boots.'),
            title:t('Богцоо задалъя', 'Unpacking the saddlebag'),
            story:t('Богцоо яг жагсаалтын дарааллаар багласан. Эхэнд нь хийсэн зүйлээ доороос нь ухалгүй мэдэж болох уу?',
                'I packed my saddlebag in the order shown here. Can you find the first thing I packed without digging to the bottom?'),
            code:t('bag = ["ус", "олс", "аяга"]\nprint(bag[0])','bag = ["water", "rope", "cup"]\nprint(bag[0])'),
            output:t('ус','water'),
            clue:t('Жагсаалтын эхний зүйлийн дугаар 0. bag[1] гэвэл дараагийн зүйл болох олс гарна.',
                'The first item has index 0. Using bag[1] instead would print the next item, rope.')
        },
        4: {
            sprite:'falconer', name:t('Саруул', 'Saruul'), meet:t('Саруултай уулзах','Meet Saruul'), role:t('Бүргэдчин', 'Eagle keeper'),
            portrait:t('Цэнхэр дээл, савхин монгол гуталтай Саруулын бээлий дээр бүргэд суужээ.','A golden eagle perches on Saruul’s glove. She wears a blue deel and leather Mongolian boots.'),
            title:t('Бүргэдээ дуудах үг', 'A call for the eagle'),
            story:t('Миний бүргэдийг Алтан гэдэг. Нэрийг нь өгмөгц дуудах үг бэлддэг функц бичлээ. Дуудахад нь юу гэж сонсогдох бол?',
                'My eagle is called Altan. This function makes a call using the name you give it. What greeting will you hear?'),
            code:t('def call(name):\n    return name + ", наашаа!"\n\nprint(call("Алтан"))',
                'def call(name):\n    return name + ", come here!"\n\nprint(call("Altan"))'),
            output:t('Алтан, наашаа!', 'Altan, come here!'),
            clue:t('call() доторх name нь дуудсан нэрийг авна. return бэлэн үгийг буцааж, print() түүнийг хэвлэнэ.',
                'Inside call(), name holds the name you passed in. return sends the greeting back, then print() shows it.')
        }
    };
    let active = null;
    function element(tag, className, value) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (value !== undefined) el.textContent = value;
        return el;
    }
    function portrait(npc, description='') {
        const image = element('img','rc-portrait');
        image.src = 'art/companions/' + npc.sprite + '.webp';
        image.alt = description;
        image.draggable = false;
        return image;
    }
    function encounter(world, opener) {
        if (active || document.querySelector('dialog[open]')) return;
        const npc = companions[world];
        const dialog = element('dialog','rc-encounter');
        dialog.dataset.world = world;
        dialog.setAttribute('aria-labelledby','rc-speaker');
        const figure = element('figure','rc-figure');
        figure.append(portrait(npc,npc.portrait), element('figcaption','rc-territory',WORLDS[world].name));
        const panel = element('div','rc-message');
        const title = element('h2','',npc.name);
        title.id = 'rc-speaker';
        const dismiss = element('button','rc-close',t('Хаах','Close'));
        dismiss.type = 'button';
        dismiss.autofocus = true;
        const heading = element('header','rc-heading');
        const speaker = element('div','rc-speaker');
        speaker.append(element('p','rc-role',npc.role),title);
        heading.append(speaker,dismiss);
        const code = element('pre','rc-code'), source = element('code');
        source.append(window.PythonSyntax?.highlight(npc.code) ?? npc.code);
        code.append(source);
        const reveal = element('details','rc-answer');
        reveal.append(element('summary','',t('Гаралтыг харах','Reveal the output')),
            element('pre','',npc.output),element('p','',npc.clue));
        panel.append(heading,element('h3','rc-topic',npc.title),element('p','rc-story',npc.story),code,reveal);
        const shell = element('div','rc-shell');
        shell.append(figure,panel);dialog.append(shell);
        function leave(restoreFocus=true){
            if(dialog.open)dialog.close();
            dialog.remove();
            active=null;
            if(restoreFocus && opener.isConnected && opener.getClientRects().length)opener.focus({preventScroll:true});
        }
        active = {leave};
        dismiss.addEventListener('click',()=>leave());
        dialog.addEventListener('cancel',event=>{event.preventDefault();leave();});
        document.body.append(dialog);
        dialog.showModal();
    }
    function opener(world) {
        const npc = companions[world];
        const control = element('button','rc-meet');
        control.type = 'button';
        control.dataset.companion = npc.sprite;
        control.setAttribute('aria-haspopup','dialog');
        control.append(portrait(npc),element('span','',npc.meet));
        control.addEventListener('click',()=>encounter(world,control));
        return control;
    }
    function refresh(view, questWorld) {
        if(active)active.leave(false);
        if(view==='map'){
            for(const number of Object.keys(companions)){
                const description=document.querySelector('#world-'+number+' .world-card-head > div');
                if(description && !description.querySelector('.rc-meet'))description.append(opener(number));
            }
        }
        if(view==='quest'){
            const hints=document.querySelector('#questView .hint-buttons');
            hints.querySelector('.rc-meet')?.remove();
            if(companions[questWorld])hints.append(opener(questWorld));
        }
    }
    window.RouteCompanions = {refresh};
})();
