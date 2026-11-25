const Workshops=(()=>{
    const workshopText = globalThis.PQEnglishWorkshops?.literal || (text => text);
    const catalogue = {
        greenhouse:[workshopText('Миний хүлэмж'),workshopText('Нөхцөл ба давталт'),workshopText('Гурван саванд хоёр дусал ус хуваарилаарай. Аль саванд ус орохыг тааж, дүрмээ Python дээр турш.'),'GreenhouseStudio'],
        dragon:[workshopText('Луугаа сурга'),workshopText('Нөхцөл ба шийдвэр'),workshopText('Луу чинь ядарсан үедээ өндөг олбол яах вэ? Хоёр дүрэм бичээд нэг талбайд турш.'),'DragonStudio'],
        music:[workshopText('Хөгжмийн урлан'),workshopText('Жагсаалт ба давталт'),workshopText('Кодоор хэмнэл зохио. Нэг хэсгийг өөрчлөөд найздаа хоёр хувилбарыг сонсго.'),'MusicStudio'],
        detective:[workshopText('Алдааны мөрдөгч'),workshopText('Туршилт ба захын утга'),workshopText('Роботын алдаа ямар оролт дээр гардаг вэ? Нотлох жишээ олоод кодыг зас.'),'DetectiveStudio'],
        city:[workshopText('Ангийн хот'),workshopText('Функц ба хамтын төсөл'),workshopText('Автобус, гэрлэн дохио, гудамжны гэрлээ тус тусад нь кодлоод нэг хотод ажиллуул.'),'CityStudio']
    };
    const moduleFor=key=>window[catalogue[key][3]];
    let active=null;
    function read(raw) {
        const result={};
        for(const key of Object.keys(catalogue)){
            if(raw?.[key] && typeof raw[key]==='object')result[key]=moduleFor(key).normalize(raw[key]);
        }
        return result;
    }
    function runner(key) {
        const pending=new Set();
        let closed=false;
        function stop(){for(const cancel of [...pending])cancel();}
        function run(code,payload={}){
            if(closed)return Promise.reject(Error(workshopText('Урлан хаагдсан байна.')));
            return new Promise((resolve,reject)=>{
                const worker=new Worker('worker.js?v=15');
                let timer;
                const complete=(callback,value)=>{
                    clearTimeout(timer);worker.terminate();pending.delete(cancel);callback(value);
                };
                const cancel=()=>complete(reject,new DOMException(workshopText('Кодыг зогсоолоо.'),'AbortError'));
                pending.add(cancel);
                const fail=message=>complete(reject,Error(message));
                timer=setTimeout(()=>fail(workshopText('Python ачаалах хугацаа дууслаа. Дахин ажиллуулаарай.')),90000);
                worker.onerror=e=>fail(e.message||workshopText('Python ажиллаж чадсангүй. Дахин оролдоорой.'));
                worker.onmessage=({data})=>{
                    if(data.type==='fatal')return fail(data.error);
                    if(data.type==='ready'){
                        clearTimeout(timer);
                        timer=setTimeout(()=>fail(workshopText('Код 5 секундээс удаан ажиллалаа. Давталтын төгсөх нөхцөлийг шалгаарай.')),5000);
                        worker.postMessage({code,studio:{mode:key,payload}});
                    }else if(data.type==='result')complete(resolve,globalThis.PQEnglishWorkshops?.result(data) ?? data);
                };
            });
        }
        return {run,stop,close(){closed=true;stop();}};
    }
    function element(tag,cls,text){
        const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;
    }
    function hub(root) {
        root.replaceChildren(element('h1','ws-title',workshopText('Сонголтот урлан')));
        const cards=element('div','ws-cards');
        for(const [key,[name,concept,summary]] of Object.entries(catalogue)){
            const card=element('a','ws-card ws-'+key);
            card.href='#'+key;
            const art=element('img','ws-art');
            art.src='art/workshops/'+key+'.webp';
            art.alt='';
            art.width=625;
            art.height=416;
            const copy=element('div','ws-copy');
            copy.append(element('small','',concept),element('h2','',name),element('p','',summary));
            card.append(art,copy);cards.append(card);
        }
        root.append(cards);
    }
    function leave(){
        if(!active)return;
        const current=active;active=null;
        try{current.studio.leave();}finally{current.runtime.close();}
    }
    function mount(root,key,group,startMode) {
        leave();
        if(key==='workshops'){hub(root);return;}
        const studio=moduleFor(key),runtime=runner(key);
        const top=element('nav','ws-subnav');top.setAttribute('aria-label',workshopText('Сонголтот урлан'));
        const back=element('a','',workshopText('Бүх урлан'));back.href='#workshops';top.append(back);
        const current=element('span','',catalogue[key][0]);top.append(current);
        const body=element('div','ws-body');body.id=key+'Studio';root.replaceChildren(top,body);
        if(!group[key]){group[key]=studio.normalize(null);persist();}
        active={studio,runtime};
        studio.mount(body,{state:group[key],save:persist,run:runtime.run,stop:runtime.stop,startMode,
            lessonProgress:()=>state.done.length+state.academy.won.length,
            onMilestone:updateHeader,
            getLevel:()=>LevelBoard.validate(state.academy.level.map||LevelBoard.defaultMap())});
    }
    return {read,mount,leave,has:key=>Object.hasOwn(catalogue,key),
        describe:key=>Object.hasOwn(catalogue,key)?catalogue[key].slice(0,2):null,names:Object.keys(catalogue)};
})();
