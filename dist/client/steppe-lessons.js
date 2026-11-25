// The two tracks share a journey. Each program can also be saved and run on its own.
window.SteppeLessons = (() => {
    function get(track, language = 'mn') {
        if (track !== 'c' && track !== 'cpp') return [];
        const isC = track === 'c';
        const t = (mn, en) => language === 'en' ? en : mn;
        const exampleGreeting = t('Сайн уу, Тэмүүлэн!', 'Hello, Temuulen!');
        const header = isC ? '#include <stdio.h>\n\nint main(void)' : '#include <iostream>\n\nint main()';
        const program = body => header + ' {\n' + body + '\n    return 0;\n}\n';

        function printLine(message) {
            return isC ? 'printf("%s\\n", "' + message + '");' : 'std::cout << "' + message + '" << \'\\n\';';
        }
        function readNumber(name) {
            return '    int ' + name + ';\n' + (isC
                ? '    if (scanf("%d", &' + name + ') != 1) return 1;\n'
                : '    if (!(std::cin >> ' + name + ')) return 1;\n');
        }
        function pack(bags, loose) {
            return program(readNumber('shagai') + '\n    int bags = ' + bags + ';\n    int loose = ' + loose + ';\n' +
                (isC ? '    printf("%d %d\\n", bags, loose);' : "    std::cout << bags << ' ' << loose << '\\n';"));
        }
        function chooseRoute(operator) {
            return program(readNumber('depth') + '\n    if (depth ' + operator + ' 40) {\n' +
                (isC ? '        printf("1\\n");' : "        std::cout << 1 << '\\n';") + '\n    } else {\n' +
                (isC ? '        printf("2\\n");' : "        std::cout << 2 << '\\n';") + '\n    }');
        }

        // Let students choose formatting while checking the number, order and value of the results.
        function numberTask(inputs, answer) {
            const cases = inputs.map(n => ({input:String(n), expected:answer(n).join(' ')}));
            return {
                sampleInput: cases[0].input,
                cases,
                check(stdout, input = cases[0].input) {
                    const raw = String(input).trim();
                    if (!/^\d+$/.test(raw) || Number(raw) > 999) return false;
                    const tokens = String(stdout).trim().split(/\s+/);
                    const wanted = answer(Number(raw));
                    return tokens.length === wanted.length &&
                        tokens.every((token, i) => /^[+-]?\d+$/.test(token) && Number(token) === wanted[i]);
                }
            };
        }
        return [
            {
                id: track + '/greeting',
                title: t('Өртөөнд ирсэн захиа', 'A letter at the relay camp'),
                concept: t('Текст хэвлэх', 'Text output'),
                story: t('Орхоны хөндийд өглөө болжээ. Өртөөний үүдэнд Тэмүүлэн хүлээж байна. Чиний анхны програм түүнд захианы эхний мөрийг хүргэнэ.',
                    'Dawn breaks in the Orkhon Valley. Temuulen is waiting at the relay camp. Your first program delivers the opening line of a letter to your guide.'),
                task: t('Код доторх гурван цэгийг өөрийн мэндчилгээгээр солиод ажиллуулаарай. Ямар ч хэлээр нэг мөр бичиж болно. Хашилтыг хэвээр үлдээгээрэй.',
                    'Replace the three dots in the code with your own greeting and run it. Write one line in any language. Keep the quotation marks.'),
                hint: isC
                    ? t('main доторх printf дэлгэцэд бичдэг. Хоёр дахь хос хашилт доторх ... хэсгийг солиорой. %s нь тэр текстийг хэвлэж, \\n нь шинэ мөр эхлүүлнэ.',
                        'Inside main, printf writes to the screen. Change the ... in the second pair of quotes. %s prints that text, and \\n starts a new line.')
                    : t('main дотор std::cout руу << тэмдгээр текст дамжуулдаг. Эхний хоёр хашилтын хооронд байгаа ... хэсгийг солиорой.',
                        'Inside main, << sends text to std::cout. Change the ... between the first pair of quotation marks.'),
                prediction: {
                    question: printLine(t('Орхон', 'Orkhon')) + '\n' + t('Энэ мөрийг ажиллуулбал захианд юу бичигдэх вэ?', 'What will this line write in the letter?'),
                    options: [t('Орхон', 'Orkhon'), t('"Орхон" (хашилттай)', '"Orkhon" (with quotes)'), isC ? 'printf' : 'std::cout'],
                    correct: 0,
                    explanation: t('Хашилт нь текст хаана эхэлж, дуусахыг заадаг. Захианд зөвхөн доторх үг нь гарна.',
                        'The quotation marks show where the text starts and ends. Only the word inside appears in the letter.')
                },
                starter: program('    ' + printLine('...')),
                solution: program('    ' + printLine(exampleGreeting)),
                sampleInput: '',
                cases: [{input:'', expected:t('Өөрийн мэндчилгээ', 'Your own greeting')}],
                check(stdout) {
                    const message = String(stdout).trim();
                    return !/[\r\n]/.test(message) && /\p{L}/u.test(message);
                },
                outcome: t('Тэмүүлэн захиаг уншаад «Замдаа гаръя!» гэлээ. Эхлээд дараагийн өртөөний хүүхдүүдэд аваачих шагайгаа бэлдэнэ.',
                    'Temuulen reads your letter. “Time to get going!” First, you need to pack the shagai for the children at the next camp.')
            },
            {
                id: track + '/shagai',
                title: t('Аянд авч явах шагай', 'Pack the shagai'),
                concept: t('Бүхэл тооны хуваалт ба үлдэгдэл', 'Integer division and remainder'),
                story: t('Өртөөний хүүхдүүд дараагийн айлд тоглоом явуулжээ. Нэг уутанд гурван шагай багтана. Дүүрсэн уутаа богцонд хийж, үлдсэн шагайгаа халаасандаа авч явна.',
                    'The children have sent shagai, traditional ankle bones used in games, to the next camp. Each bag holds three. Full bags go in the saddlebag and loose pieces go in your pocket.'),
                task: t('0–999 ширхэг шагайн тоог програм уншина. bags болон loose хоёрын тооцоог засаад дүүрэн уутны тоо, үлдсэн шагайн тоог энэ дарааллаар хэвлээрэй. Жишээ нь 7 шагай өгвөл 2 1 гарна.',
                    'The program reads a count from 0 to 999. Edit the calculations for bags and loose to print the number of full bags, then the pieces left over. For 7 pieces, print 2 1.'),
                hint: t('7-г 3-аар бүхлээр хуваахад 2, үлдэгдэл нь 1. Кодонд / нь бүхэл тоонуудын ногдворыг, % нь үлдэгдлийг өгнө. 3 ба 0 шагайгаар бас туршаарай.',
                    'Seven divided by three gives 2 whole bags with 1 left over. For integers, / gives the quotient and % gives the remainder. Try 3 pieces and then 0.'),
                prediction: {
                    question: t('Найман шагайг гурваар нь уутлав. Богцонд хэдэн дүүрэн уут, халаасанд хэдэн сул шагай байх вэ?',
                        'You pack eight shagai, three to a bag. How many full bags go in the saddlebag, and how many loose pieces go in your pocket?'),
                    options: [t('3 уут, 0 шагай', '3 bags, 0 loose'), t('2 уут, 2 шагай', '2 bags, 2 loose'), t('2 уут, 0 шагай', '2 bags, 0 loose')],
                    correct: 1,
                    explanation: t('Хоёр уутанд зургаан шагай орно. Наймаас зургааг хасахад хоёр шагай үлдэнэ.',
                        'Two bags hold six pieces. Subtract six from eight and two are left.')
                },
                starter: pack('shagai', '0'),
                solution: pack('shagai / 3', 'shagai % 3'),
                ...numberTask([7, 0, 2, 3, 8, 999], n => [Math.floor(n / 3), n % 3]),
                outcome: t('Тэмүүлэн дүүрэн уутаа богцонд, сул шагайгаа халаасандаа хийлээ. Одоо захиа, тоглоом хоёрыг голын цаадах өртөөнд хүргэнэ.',
                    'Temuulen stows the bags and pockets the loose shagai. The letter and the games are ready for the camp across the river.')
            },
            {
                id: track + '/river',
                title: t('Гарам уу, гүүр үү?', 'Ford or bridge?'),
                concept: t('Нөхцөл ба зааг утга', 'Conditions and boundary values'),
                story: t('Орхоны эрэг дээр зам салаална. Тоглоомын газрын зурагт усны түвшин 40 см буюу түүнээс бага бол гарам нээгдэнэ. Үүнээс их бол Тэмүүлэн модон гүүрээр тойрно.',
                    'The trail forks at the Orkhon. On the game map, the ford opens when the water gauge reads 40 cm or less. A higher reading sends Temuulen around to the wooden bridge.'),
                task: t('Програм 0–999 см-ийн нэг хэмжилт уншина. Гарам сонговол 1, гүүр сонговол 2 гэж хэвлэнэ. 40 см дээр буруу зам зааж байгаа тул if доторх харьцуулалтыг засаарай.',
                    'The program reads one gauge value from 0 to 999 cm. Print 1 for the ford and 2 for the bridge. At 40 cm it points the wrong way. Fix the comparison inside if.'),
                hint: t('39, 40, 41 гэсэн гурван утгаар туршаарай. < нь зөвхөн бага утгыг авна. Тэнцүү утгыг бас оруулахад <= хэрэглэдэг.',
                    'Try 39, 40, and 41. The < operator includes only smaller values. Use <= to include an equal value too.'),
                prediction: {
                    question: t('Хэмжүүр яг 40 см гэж заажээ. Газрын зургийн дүрмээр аль зам нээгдэх вэ?', 'The gauge reads exactly 40 cm. Which route opens under the map rule?'),
                    options: [t('Гүүр (2)', 'Bridge (2)'), t('Зам хаалттай', 'Neither route'), t('Гарам (1)', 'Ford (1)')],
                    correct: 2,
                    explanation: t('«40 буюу түүнээс бага» гэдэгт 40 өөрөө багтана. 41 см-ээс эхлэн гүүр сонгоно.',
                        '“40 or less” includes 40 itself. From 41 cm onward, choose the bridge.')
                },
                starter: chooseRoute('<'),
                solution: chooseRoute('<='),
                ...numberTask([40, 39, 41, 0, 999], n => [n <= 40 ? 1 : 2]),
                outcome: t('Тэмүүлэн чиний заасан замаар Орхоны цаад эрэгт хүрэв. Өртөөний эзэн захиаг авч, хүүхдүүд шагайгаа дэвсэн тоглож эхэллээ.',
                    'Temuulen follows your directions to the far bank. The camp keeper takes the letter, and the children spread out the shagai to play.')
            }
        ];
    }
    return {get};
})();
