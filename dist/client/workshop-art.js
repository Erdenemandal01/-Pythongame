// Low-resolution game scenes, rendered at integer pixel coordinates.
const WorkshopArt = (() => {
    const WIDTH=224, HEIGHT=88;
    function paint(canvas, type, active=false, variant=0) {
        canvas.width=WIDTH;canvas.height=HEIGHT;
        const ctx=canvas.getContext('2d');
        if(!ctx)return;
        const box=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
        const block=(x,y,rows,inks,scale=1)=>{
            rows.forEach((row,j)=>Array.from(row).forEach((key,i)=>{
                if(inks[key])box(x+i*scale,y+j*scale,scale,scale,inks[key]);
            }));
        };
        const skies={
            dragon:['#193951','#345a66','#72917b','#acc384'],
            music:['#211937','#352449','#533255','#895064'],
            detective:['#18293e','#244052','#395968','#6f8b88'],
            city:['#202440','#383655','#655171','#bc7d82']
        };
        const sky=skies[type];
        [0,22,40,56].forEach((y,i)=>box(0,y,WIDTH,HEIGHT-y,sky[i]));
        for(let i=0;i<29;i++)box((17*i+9)%WIDTH,(i*i*7+5)%39,i%5===0?2:1,1,'#cecdb1');
        if(type==='dragon') {
            box(173,8,14,14,'#f6dc99');box(170,11,20,8,'#f6dc99');
            for(let x=0;x<WIDTH;x+=3){
                const h=Math.floor(15+8*Math.sin(x/19)+4*Math.sin(x/8));
                box(x,64-h,3,h,'#486f68');box(x,61,3,27,'#668953');
            }
            for(let i=0;i<15;i++){
                const x=(i*47+11)%WIDTH,y=36+(i*9)%21;
                box(x+2,y+9,2,9,'#4f4b38');box(x,y+3,6,9,'#375f50');box(x+2,y,2,4,'#6c9765');
            }
            box(0,76,WIDTH,12,'#4d703e');
            block(130,54,['...hh...','..hwwh..','.hwwwsh.','.hwgswh.','hwwwwwsh','hwsgwssh','.hssssh.','..hhhh..'],{h:'#635044',w:'#ffe4ac',s:'#d1ac72',g:'#9e7aa6'},2);
            block(112,65,['..yy..','.ywwy.','ywwwwy','ywwywy','.yyyy.'],{y:'#785f46',w:'#ffe2a8'},2);
        } else if(type==='music') {
            for(let n=0;n<26;n++){const h=4+Math.round(12*(1+Math.sin(n*1.6)));box(n*9,62-h,5,h,'#704761');}
            box(0,72,WIDTH,16,'#342942');box(0,73,WIDTH,2,'#d08c9e');
            const speaker=x=>{box(x,26,22,46,'#271f34');box(x+2,28,18,42,'#5f4964');for(const cy of [33,51]){box(x+5,cy,12,12,'#25283e');box(x+7,cy+2,8,8,'#856787');box(x+9,cy+4,4,4,'#e0a3b5');}};
            speaker(22);speaker(180);
            const drum=(x,y,w,h,c)=>{box(x,y,w,h,'#292537');box(x+2,y+2,w-4,h-4,c);box(x,y,w,3,'#ffd8aa');box(x+3,y+h-3,w-6,2,'#d7aeb7');box(x+4,y+h,2,6,'#d3b1bd');box(x+w-6,y+h,2,6,'#d3b1bd');};
            drum(76,43,24,15,'#be7180');drum(125,42,22,15,'#b85f76');drum(96,51,31,24,'#a45d83');
            for(const [x,y] of [[62,35],[151,31]]){box(x+9,y,2,37,'#c7a7a7');box(x,y,23,3,'#edba76');box(x+6,y-2,11,2,'#ffe0a5');}
            for(const [x,y] of [[83,15],[119,10],[158,18]]){box(x,y,9,2,'#f9ce88');box(x,y,2,10,'#f9ce88');box(x-3,y+8,5,3,'#f9ce88');}
        } else if(type==='detective') {
            const amber=['#eab56c','#8cd8c7','#c4a2e8','#e8bc71','#a8ce80'][variant%5];
            for(let i=0;i<7;i++){const x=1+i*34;box(x,18+(i%3)*4,20,34,'#2d4354');box(x+2,20+(i%3)*4,7,2,'#678082');}
            box(0,66,WIDTH,22,'#3c4e59');box(0,67,WIDTH,2,'#93a297');
            for(let x=0;x<WIDTH;x+=18){box(x,72,8,2,'#627575');box(x+9,80,11,2,'#465f65');}
            box(129,21,53,47,'#1b2d3c');box(126,21,59,5,'#70868a');box(127,25,4,43,'#86a19a');box(180,25,4,43,'#6c8887');
            for(let i=0;i<5;i++){const y=active?27+i:28+i*7;box(134,y,43,active?1:6,i%2?'#56727a':'#69868b');}
            box(141,17,29,4,active?'#91df95':amber);box(184,40,8,13,'#2a394a');box(186,42,4,3,active?'#99e9ab':'#f6a58c');
            block(active?100:66,39,[
                '...kk.....kk...','....k..y..k....','...kkkkkkkkk...','..kccccccccck..',
                '..kkoooooookk..','..kobbooobbok..','..koooooooook..','...kccccccck...',
                '....kkwwkkk....','..kkccccccckk..','.ksskaaaakcssk.','.ksskaaaakcssk.',
                '....kcccccck...','....kkkkkkkk...','....kss..ssk...','...kkkk..kkkk..'
            ],{k:'#24303f',c:'#b4c8be',o:'#334d58',b:active?'#bdf298':'#8ee2df',w:'#d2b087',a:amber,s:'#637d83'},2);
            box(35,61,13,6,'#b88962');box(35,61,13,2,'#d5b276');
        } else {
            box(156,9,12,12,'#ffe0aa');box(153,12,18,6,'#ffe0aa');
            for(let i=0;i<17;i++){const x=i*14-3,h=10+(i*17)%26;box(x,64-h,12,h,'#4c4a60');}
            for(let i=0;i<10;i++){
                const x=i*25-3,h=15+(i*13)%26,y=64-h;box(x,y,19,h,'#373d56');box(x-1,y,21,2,'#8a7691');
                for(let wy=y+5;wy<61;wy+=7)for(let wx=x+3;wx<x+16;wx+=6)box(wx,wy,3,3,(wx+wy)%3?'#e1b684':'#636a84');
            }
            box(0,64,WIDTH,24,'#3a4252');box(0,64,WIDTH,2,'#a28b8f');
            for(let x=0;x<WIDTH;x+=20)box(x,80,10,2,'#e7c694');
            box(87,57,46,17,'#d88c5f');box(91,54,36,3,'#f3c882');box(89,60,40,6,'#7cb0b7');
            for(let x=94;x<129;x+=8)box(x,60,2,6,'#3e4c60');
            for(const x of [95,121]){box(x,71,7,6,'#282c3b');box(x+2,73,3,2,'#9a91a0');}
            box(161,42,2,25,'#aaa1a4');box(157,31,10,15,'#252f41');box(160,33,4,4,'#ec997c');box(160,39,4,4,'#699679');
        }
    }
    return {paint};
})();
