(() => {
    'use strict';

    const originalTopics = [
        {
            id: "range",
            title: "range() • Тооны дараалал",
            question: "Яагаад 5 хэвлэгдэхгүй байна?",
            explanation: "range(1, 5) нь 1-ээс эхэлж 5-ын өмнө зогсоно. Тиймээс давталтын утгууд 1, 2, 3, 4 байна.",
            code: "for step in range(1, 5):\n    print(step)",
            expected: "1\n2\n3\n4",
            tryThis: "5-ыг бас хэвлэхийн тулд төгсгөлийг 6 болгоорой.",
            aliases: ["range","ренж","рэнж","давталтын сүүлийн тоо","сүүлийн тоо яагаад гарахгүй байна","эцсийн тоо хэвлэхгүй","тав хүртэл тоолох","5 хүртэл хэвлэх","тоо дутуу хэвлэгдэх","сүүлчийн утга алга","хүртэл давтах","suuliin too yagaad garahgui baina","yagaad 5 hevlegdehgui baina","яагаад 5 гарахгүй байна","яагаад 5 хэвлэхгүй байна","range-ийн төгсгөл","яагаад сүүлийн тоо хэвлэгдэхгүй байна"]
        },
        {
            id: "print",
            title: "print() • Гаралт хэвлэх",
            question: "Дэлгэц дээр үг, тоог яаж харуулах вэ?",
            explanation: "print() дотор өгсөн утга гаралтын мөрөнд харагдана. Үг бичихдээ хашилт хэрэглэнэ. Таслалаар тусгаарласан утгуудын хооронд зай гарна.",
            code: "print(\"Олсон зоос\", 3)\nprint(\"Дараагийн буудал\")",
            expected: "Олсон зоос 3\nДараагийн буудал",
            tryThis: "Зоосны тоог өөрчлөөд гурав дахь мөрөнд өөрийн мэндчилгээг хэвлээрэй.",
            aliases: ["print","принт","хэвлэх","хэвлэе","хэвлэлт","гаралт","мэндчилгээ","мөр хэвлэх","hevleh","хариугаа харах"]
        },
        {
            id: "variable",
            title: "Хувьсагч • Утга хадгалах",
            question: "Оноогоо хадгалаад дараа нь яаж нэмэх вэ?",
            explanation: "= тэмдэг баруун талын утгыг зүүн талын нэрд онооно. Дахин онооход тухайн нэрийн утга шинэчлэгдэнэ.",
            code: "score = 4\nscore = score + 3\nprint(score)",
            expected: "7",
            tryThis: "Хоёр дахь мөрөнд 3-ын оронд 5 нэмээд эцсийн оноог таагаарай.",
            aliases: ["хувьсагч","утга оноох","утга хадгалах","оноо нэмэх","variable","huvisagch","huvisagchiin","huvsgch","+=","-="]
        },
        {
            id: "for",
            title: "for • Эд зүйл бүрээр давтах",
            question: "Цүнхэн дэх зүйл бүрийг тус тусад нь яаж хэвлэх вэ?",
            explanation: "for давталт жагсаалтын утга бүрийг дарааллаар нь авна. Энэ жишээнд item гэдэг нэрийн утга алхам бүрд солигдоно.",
            code: "bag = [\"олс\", \"дэнлүү\", \"луужин\"]\nfor item in bag:\n    print(item)",
            expected: "олс\nдэнлүү\nлуужин",
            tryThis: "Цүнхэнд дөрөв дэх зүйл нэмбэл код хэдэн удаа хэвлэх вэ?",
            aliases: ["for","давталт","жагсаалтаар давтах","жагсаалт доторх бүх утга","зүйл бүрд","нэг нэгээр","давтах","davtalt","давталтыг"]
        },
        {
            id: "if",
            title: "if, elif, else • Нөхцөл шалгах",
            question: "Онооноос шалтгаалаад өөр өөр үг яаж хэвлэх вэ?",
            explanation: "Python нөхцөлүүдийг дээрээс нь шалгана. Эхний үнэн нөхцөлийн блок ажиллана. Өмнөх нөхцөлүүд бүгд худал бол else ажиллана.",
            code: "score = 6\nif score >= 8:\n    print(\"Алт\")\nelif score >= 5:\n    print(\"Мөнгө\")\nelse:\n    print(\"Хүрэл\")",
            expected: "Мөнгө",
            tryThis: "Оноог 4, 5, 8 болгож тус бүр ямар медаль гарахыг үзээрэй.",
            aliases: ["if","elif","else","нөхцөл","салаалах","хэрэв","үгүй бол","nohtsol","nuhtsul","salbarlalt","нөхцлийг","нөхцөлөө"]
        },
        {
            id: "compare",
            title: "< ба <= • Заагийн утга",
            question: "Яг 30 дээр нөхцөл яагаад биелэхгүй байна?",
            explanation: "< нь заасан тооноос бага үед үнэн. <= нь түүнтэй тэнцүү үед бас үнэн. Ийм заагийг шалгахад тооны хоёр хөршөөр нь туршиж болно.",
            code: "charge = 30\nprint(charge < 30)\nprint(charge <= 30)",
            expected: "False\nTrue",
            tryThis: "charge-д 29, дараа нь 31 өгч хоёр үр дүнг харьцуулаарай.",
            aliases: ["<","<=",">",">=","харьцуулах","бага буюу тэнцүү","их буюу тэнцүү","тэнцүү үед","заагийн утга","хязгаар","yag 30 deer","ih baga","30 хувь"]
        },
        {
            id: "equal",
            title: "= ба == • Тэнцүү эсэх",
            question: "Хоёр утга тэнцүү эсэхийг яаж шалгах вэ?",
            explanation: "= нь утга онооно. == нь хоёр утгыг харьцуулж True эсвэл False буцаана. != нь хоорондоо ялгаатай эсэхийг шалгана.",
            code: "keys = 2\nprint(keys == 2)\nprint(keys != 2)",
            expected: "True\nFalse",
            tryThis: "keys-д 3 гэсэн утга өгөөд үр дүнг таагаарай.",
            aliases: ["=","==","!=","тэнцүү эсэх","хоёр тэнцүү","ялгаатай эсэх","тэнцүүгийн тэмдэг","тэнцүүлэх","tentsuu"]
        },
        {
            id: "logic",
            title: "and, or, not • Нөхцөл хослуулах",
            question: "Түлхүүртэй бас хаалган дээр ирснийг яаж шалгах вэ?",
            explanation: "and хэрэглэхэд хоёр нөхцөл хоёулаа үнэн байх ёстой. or хэрэглэхэд аль нэг нь үнэн байхад хангалттай. not нь логик утгыг эсрэгээр нь солино.",
            code: "has_key = True\nat_gate = False\nprint(has_key and at_gate)\nprint(has_key or at_gate)\nprint(not at_gate)",
            expected: "False\nTrue\nTrue",
            tryThis: "at_gate-ийг True болгоход аль мөрүүдийн хариу өөрчлөгдөх вэ?",
            aliases: ["and","or","not","true","false","boolean","хоёр нөхцөл","аль нэг нь","хоёулаа","үнэн худал","логик"]
        },
        {
            id: "while",
            title: "while • Нөхцөл үнэн үед давтах",
            question: "Миний давталт яагаад дуусахгүй байна?",
            explanation: "while нөхцөлөө эргэлт бүрийн өмнө дахин шалгана. Тоолуурыг блокийн дотор өөрчилбөл нөхцөл нэг мөчид худал болж давталт зогсоно.",
            code: "steps = 3\nwhile steps > 0:\n    print(steps)\n    steps -= 1",
            expected: "3\n2\n1",
            tryThis: "Эхлэх тоог 5 болгоод хэдэн мөр хэвлэгдэхийг үзээрэй.",
            aliases: ["while","төгсгөлгүй давталт","давталт гацсан","давталт зогсохгүй","дуусахгүй","хугацаа хэтэрлээ","тоолуур","арагш тоолох","davalt zogsohgui","davtalt duusahgui"]
        },
        {
            id: "modulo",
            title: "% • Үлдэгдэл олох",
            question: "Тоо тэгш үү, сондгой юу гэдгийг яаж мэдэх вэ?",
            explanation: "% нь хуваасны үлдэгдлийг өгнө. Бүхэл тоог 2-т хуваахад үлдэгдэл нь 0 байвал тэгш тоо.",
            code: "number = 7\nprint(number % 2)\nprint(number % 2 == 0)",
            expected: "1\nFalse",
            tryThis: "7-г 8 болгож үлдэгдэл болон шалгалтын үр дүнг хараарай.",
            aliases: ["%","үлдэгдэл","хуваахын үлдэгдэл","сондгой","тэгш тоо","modulo","tegsh","sondgoi","uldegdel"]
        },
        {
            id: "index",
            title: "Жагсаалтын индекс • IndexError",
            question: "Гурван зүйлтэй жагсаалтын гурав дахь зүйлийг яаж авах вэ?",
            explanation: "Индексийг 0-ээс тоолно. Гурван зүйлтэй жагсаалтын зөв индексүүд 0, 1, 2. 3 гэсэн индексэд хандахад IndexError гарна. -1 нь хамгийн сүүлийн зүйлийг заана.",
            code: "bag = [\"чулуу\", \"олс\", \"аяга\"]\nprint(bag[2])\nprint(bag[-1])",
            expected: "аяга\nаяга",
            tryThis: "bag[2]-ыг bag[3] болгож IndexError гаргаад, зөв индексээр засаарай.",
            aliases: ["IndexError","list index out of range","индекс","жагсаалтын байрлал","сүүлийн элемент","эхний элемент","жагсаалтаас авах","жагсаалтын гурав дахь","jagsaaltiin indeks","index aldaa"]
        },
        {
            id: "append",
            title: "append() • Жагсаалтад нэмэх",
            question: "Цүнхний жагсаалтад шинэ зүйл яаж нэмэх вэ?",
            explanation: "append() нэг утгыг жагсаалтын төгсгөлд нэмнэ. Одоо байгаа жагсаалт өөрөө шинэчлэгдэнэ. Дараа нь жагсаалтаа хэвлээд шинэ утгыг харна.",
            code: "bag = [\"олс\"]\nbag.append(\"газрын зураг\")\nprint(bag)",
            expected: "['олс', 'газрын зураг']",
            tryThis: "Дахиад нэг append() дуудаж цүнхэндээ шинэ зүйл нэмээрэй.",
            aliases: ["append","жагсаалтад нэмэх","жагсаалтанд нэмэх","шинэ элемент оруулах","list нэмэх","jagsaaltand nemeh"]
        },
        {
            id: "len",
            title: "len() • Уртыг олох",
            question: "Жагсаалтад хэдэн зүйл байгааг яаж мэдэх вэ?",
            explanation: "len() нь жагсаалтын элементийн тоог өгнө. Текстэд хэрэглэвэл тэмдэгтийн тоог өгнө. Хоосон жагсаалтын урт 0.",
            code: "bag = [\"олс\", \"ус\", \"түлхүүр\"]\nprint(len(bag))\nprint(len(\"сар\"))",
            expected: "3\n3",
            tryThis: "Цүнхээ хоосолбол аль мөрийн хариу өөрчлөгдөх вэ?",
            aliases: ["len","урт","жагсаалтын уртыг олох","үсэг тоолох","хэдэн ширхэг","элементийн тоо","тэмдэгтийн тоо"]
        },
        {
            id: "sum",
            title: "sum() • Нийлбэр бодох",
            question: "Бүх өдрийн цуглуулсан зоосыг яаж нэмэх вэ?",
            explanation: "sum() жагсаалт дахь тоонуудын нийлбэрийг олно. Тоонуудыг нэг нэгээр нь нэмж бичих шаардлагагүй.",
            code: "coins = [4, 0, 3, 2]\nprint(sum(coins))",
            expected: "9",
            tryThis: "Цуглуулсан зоосонд 5-ыг нэмж оруулаад нийлбэрээ таагаарай.",
            aliases: ["sum","нийлбэр","нийт дүн","нийлбэрийг олох","бүх тоог нэмэх","жагсаалтын нийлбэр","niilber"]
        },
        {
            id: "dictionary",
            title: "dict, get() • Түлхүүрээр утга авах",
            question: "Толь бичигт түлхүүр байхгүй бол яах вэ?",
            explanation: "Толь бичиг утга бүрийг түлхүүртэй хадгална. Байхгүй түлхүүрийг дөрвөлжин хаалтаар авбал KeyError гарна. get(түлхүүр, 0) гэвэл ийм үед 0 буцаана.",
            code: "stock = {\"ус\": 2, \"олс\": 1}\nprint(stock[\"ус\"])\nprint(stock.get(\"түлхүүр\", 0))",
            expected: "2\n0",
            tryThis: "Толь бичигт «түлхүүр» гэсэн нэрээр 3 ширхэг нэмээд кодоо ажиллуулаарай.",
            aliases: ["dict","get","dictionary","KeyError","толь бичиг","түлхүүр олдохгүй","түлхүүр утга","tol bichig","toli bichig"]
        },
        {
            id: "function",
            title: "def ба return • Утга буцаах",
            question: "Функц маань яагаад None буцааж байна?",
            explanation: "def ашиглаж функцээ тодорхойлно. return бичсэн утгаа дуудсан газар нь буцаана. Функц зөвхөн хэвлээд дуусвал буцаах утга нь None байна.",
            code: "def double(coins):\n    return coins * 2\n\nreward = double(4)\nprint(reward)",
            expected: "8",
            tryThis: "return coins * 2 мөрийг print(coins * 2) болгож хоёр мөрийн гаралтыг харьцуулаарай.",
            aliases: ["def","return","функц","None","утга буцаах","буцах утга","функц дуудах","параметр","functs","funkts","funktsiin butsaah utga"]
        },
        {
            id: "types",
            title: "int(), str() • Тоо ба текст",
            question: "Тоо нэмэхэд яагаад TypeError гардаг вэ?",
            explanation: "Хашилттай тоо бол текст. Тооцоонд хэрэглэхийн өмнө int() ашиглаж бүхэл тоонд хувиргана. Тоог тексттэй залгах бол str() хэрэглэнэ.",
            code: "amount = \"12\"\nprint(int(amount) + 3)\nprint(\"Зоос: \" + str(15))",
            expected: "15\nЗоос: 15",
            tryThis: "int(amount) + 3-ын оронд amount + 3 гэж бичээд гарсан алдааг өөрөө засаарай.",
            aliases: ["int","str","TypeError","integer","тоо болгох","төрөл хөрвүүлэх","текстийг тоо болгох","string тоо нэмэх","unsupported operand type","can only concatenate str","too bolgoh"]
        },
        {
            id: "indent",
            title: "Догол мөр • IndentationError",
            question: "Кодын мөрийн эхэнд яагаад зай хэрэгтэй вэ?",
            explanation: "if, for, def зэрэг блокийн доторх мөрүүдийг ижил зайгаар доголдуулна. Дараах жишээнд эхний print нөхцөл биелэхэд, хоёр дахь print бүх тохиолдолд ажиллана.",
            code: "coins = 0\nif coins > 0:\n    print(\"Зоос байна\")\nprint(\"Шалгаж дууслаа\")",
            expected: "Шалгаж дууслаа",
            tryThis: "coins-д 1 өгч үзээрэй. Дараа нь блокийн доторх дөрвөн зайг арилгаад алдааг ажиглаарай.",
            aliases: ["IndentationError","TabError","expected an indented block","unexpected indent","догол","зай авах","дөрвөн зай","мөрийн эхний зай","dogol mor","indent"]
        },
        {
            id: "syntax",
            title: "Хаалт ба хашилт • SyntaxError",
            question: "Яагаад SyntaxError гэж гараад ажиллахгүй байна?",
            explanation: "Python бүтцийн алдааг илрүүлбэл кодыг ажиллуулахаас өмнө SyntaxError өгнө. Хашилт, хаалт хосоороо бичигдсэн эсэх, if мөрийн төгсгөлд хоёр цэг байгаа эсэхийг шалгаарай.",
            code: "if 2 < 3:\n    print(\"Хаалга нээлттэй\")",
            expected: "Хаалга нээлттэй",
            tryThis: "if мөрийн төгсгөлийн хоёр цэгийг түр хасаад алдааг хар. Буцааж нэмээд дахин ажиллуулаарай.",
            aliases: ["SyntaxError","invalid syntax","unterminated string","was never closed","expected ':'","хаалт хаагдаагүй","хашилт","хоёр цэг","синтакс","бичлэгийн алдаа"]
        },
        {
            id: "name",
            title: "Хувьсагчийн нэр • NameError",
            question: "Python яагаад миний хувьсагчийн нэрийг танихгүй байна?",
            explanation: "Python-д том, жижиг үсэг ялгаатай. Хэвлэхээсээ өмнө хувьсагчид утга өгөөд, мөр бүрд нэрийг нь яг ижил бичээрэй.",
            code: "points = 7\nprint(points)",
            expected: "7",
            tryThis: "Хоёр дахь мөрөнд Points гэж бичээд алдааг унш. Аль үсэг өөрчлөгдсөн бэ?",
            aliases: ["NameError","name is not defined","нэр танихгүй","хувьсагч олдохгүй","том жижиг үсэг","утга өгөөгүй","тодорхойлогдоогүй"]
        },
        {
            id: "division",
            title: "/, // • Хуваах",
            question: "Хуваахад яагаад бутархай тоо гардаг вэ?",
            explanation: "/ нь ноогдворыг бутархай тоогоор өгнө. // нь ноогдворыг доош бүхэлчилнэ. Хуваагч 0 байвал ZeroDivisionError гарна.",
            code: "coins = 11\npeople = 2\nprint(coins / people)\nprint(coins // people)",
            expected: "5.5\n5",
            tryThis: "people-ийг 0 болгож туршаад, дахин ажиллуулахын өмнө эерэг тоогоор солиорой.",
            aliases: ["/","//","ZeroDivisionError","division by zero","тэгээр хуваах","бүхлээр хуваах","бүхэл ноогдвор","хуваалт","huvaah"]
        },
        {
            id: "fstring",
            title: "f-string • Нэр, тоог өгүүлбэрт оруулах",
            question: "Баатрын нэр болон оноог нэг мөрөнд яаж бичих вэ?",
            explanation: "Хашилтын өмнө f бичээд, оруулах утгаа тахир хаалтын дотор бичнэ. Хувьсагчийн утга өөрчлөгдөхөд хэвлэх өгүүлбэр дагаж өөрчлөгдөнө.",
            code: "hero = \"Тэмүүлэн\"\nscore = 4\nprint(f\"{hero} {score} зоос оллоо.\")",
            expected: "Тэмүүлэн 4 зоос оллоо.",
            tryThis: "Баатрын нэр, оноог хоёуланг өөрчлөөд өгүүлбэрийг дахин хэвлээрэй.",
            aliases: ["f-string","fstring","форматлах","өгүүлбэрт утга оруулах","мэндчилгээнд нэр оруулах","текст дотор хувьсагч","formatted string"]
        },
        {
            id: "break",
            title: "break • Давталтаас эрт гарах",
            question: "Олсон зүйл дээрээ давталтыг яаж зогсоох вэ?",
            explanation: "break ажиллахад тухайн давталт тэр дороо дуусна. Дараах замд хана таарвал түүний цаадах өртөөг хэвлэхгүй.",
            code: "for place in [\"гол\", \"хана\", \"тал\"]:\n    if place == \"хана\":\n        break\n    print(place)",
            expected: "гол",
            tryThis: "«хана»-г жагсаалтын төгсгөл рүү зөөгөөд хэдэн газар хэвлэгдэхийг таагаарай.",
            aliases: ["break","давталтыг таслах","давталтаас гарах","эрт зогсоох","давталтыг зогсоох","эхнийхийг олоод зогсох"]
        },
        {
            id: "contains",
            title: "in • Жагсаалтад байгаа эсэх",
            question: "Цүнхэнд түлхүүр байгаа эсэхийг яаж шалгах вэ?",
            explanation: "in нь хайсан зүйл жагсаалтад байвал True өгнө. Текстэд хэрэглэвэл нэг текст нөгөөдөө багтсан эсэхийг шалгана.",
            code: "bag = [\"олс\", \"ус\"]\nprint(\"түлхүүр\" in bag)\nprint(\"ус\" in bag)",
            expected: "False\nTrue",
            tryThis: "«түлхүүр»-ийг жагсаалтдаа нэмвэл ямар хариу өөрчлөгдөх вэ?",
            aliases: ["in","not in","агуулах","багтсан эсэх","байгаа эсэх","жагсаалтаас хайх","элемент шалгах"]
        },
        {
            id: "slice",
            title: "[эхлэл:төгсгөл] • Хэсэг таслах",
            question: "Текстийн эхний гурван үсгийг яаж авах вэ?",
            explanation: "s[0:3] нь 0, 1, 2 дугаартай тэмдэгтүүдийг авна. Зүүн хязгаарыг орхивол эхнээс нь авна. Үүнтэй ижил бичлэгийг жагсаалтын хэсгийг авахад хэрэглэж болно.",
            code: "word = \"дэнлүү\"\nprint(word[:3])\nprint(word[3:])",
            expected: "дэн\nлүү",
            tryThis: "word[:3]-ыг word[:4] болгоод ямар үсэг нэмэгдэхийг хараарай.",
            aliases: ["slice","slicing","зүсэлт","таслах","эхний үсэг","текстээс хэсэг авах","жагсаалтын хэсэг"]
        },
        {
            id: "sort",
            title: "sorted() • Дараалалд оруулах",
            question: "Оноонуудыг ихээс бага руу яаж эрэмбэлэх вэ?",
            explanation: "sorted() эрэмбэлсэн шинэ жагсаалт буцаана. reverse=True гэвэл ихээс бага руу жагсаана. Анхны жагсаалтын дараалал хэвээр үлдэнэ.",
            code: "points = [5, 2, 8]\nprint(sorted(points))\nprint(sorted(points, reverse=True))",
            expected: "[2, 5, 8]\n[8, 5, 2]",
            tryThis: "Жагсаалтад дахин нэг 5 нэмээд ижил хоёр тоо хаана орсныг хараарай.",
            aliases: ["sorted","эрэмбэлэх","өсөхөөр","буурахаар","ихээс бага","багаас их","жагсаалтыг жагсаах","sort","erembeleh"]
        },
        {
            id: "value",
            title: "ValueError • Тоо мөн эсэхийг шалгах",
            question: "Хоосон текстийг тоо болгоход яагаад алдаа гардаг вэ?",
            explanation: "int() бүхэл тоо хэлбэртэй текстийг уншина. Хоосон текст эсвэл үг өгвөл ValueError гарна. Энд зөвхөн 0–9 цифрээс тогтох эерэг бүхэл тоо болон тэгийг шалгаж байна.",
            code: "text = \"42\"\nif text.isascii() and text.isdigit():\n    print(int(text) + 1)\nelse:\n    print(\"Цифрээр бичээрэй\")",
            expected: "43",
            tryThis: "text-ийг хоосон хашилт, дараа нь «тав» гэсэн үг болгоод хариуг харьцуулаарай.",
            aliases: ["ValueError","invalid literal for int","isdigit","цифр мөн эсэх","хоосон текст","буруу утга","цифр шалгах"]
        }
    ];

    const english = window.GameLocale?.lang === 'en' && window.PythonReferenceEnglish;
    const topics = english ? originalTopics.map(topic => {
        const translated = english[topic.id];
        return {...topic, ...translated, aliases: [...topic.aliases, ...translated.aliases]};
    }) : originalTopics;

    // A pupil can type with a Mongolian or a Latin keyboard on a classroom computer.
    const letters = {
        а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'j', з:'z', и:'i', й:'i',
        к:'k', л:'l', м:'m', н:'n', о:'o', ө:'o', п:'p', р:'r', с:'s', т:'t', у:'u',
        ү:'u', ф:'f', х:'h', ц:'ts', ч:'ch', ш:'sh', щ:'sh', ъ:'', ы:'i', ь:'',
        э:'e', ю:'yu', я:'ya'
    };
    const symbols = /[\p{L}\p{N}_]+|<=|>=|!=|==|\+=|-=|\/\/|[<>=%\/]/gu;
    function words(text) {
        const normalized = String(text ?? '').normalize('NFKC').toLowerCase()
            .replace(/[а-яёөү]/gu, letter => letters[letter] ?? letter);
        return (normalized.match(symbols) || []).map(word => word.replace(/kh/g, 'h'));
    }

    const fillers = new Set(words('яагаад яаж хэрхэн байна байнаа юм бэ вэ бол болох уу үү нь би миний яах дээр бас ын ийн ийг д т аар оор ээр өөр байна уу what how why do does the is'));
    if (english) {
        fillers.delete('in');
        for (const word of ['a','an','can','i','my','to','of','it','me','doesn','t','am','are','on','with','when']) {
            fillers.add(word);
        }
    }
    // Common inflections students use when a keyword is embedded in a question.
    const stems = {
        davtal:'davt', davtah:'davt', davtag:'davt', davtuu:'davt',
        hevle:'hevl', hewle:'hevl',
        jagsaalt:'jagsaalt', jagsaali:'jagsaalt', huvisagch:'huvisagch',
        nohtsol:'nohtsol', nuhtsul:'nohtsol', nohtsl:'nohtsol',
        suulch:'suul', suuli:'suul', indeks:'indeks', toonuud:'too',
        tsikl:'davt'
    };
    function rootOf(word) {
        for (const [prefix, root] of Object.entries(stems)) {
            if (word.startsWith(prefix)) return root;
        }
        if (word.length < 6 || !/^[a-z]+$/.test(word)) return word;
        const base = word.replace(/(?:nuudiig|nuud|uudiig|uud|iig|iin|aar|eer|oor|tai|tei)$/, '');
        return base.length >= 3 ? base : word;
    }
    function tokens(text) {
        return words(text).filter(word => !fillers.has(word));
    }
    const index = topics.map(topic => {
        const names = [topic.id, ...topic.aliases];
        const aliases = names.map(name => words(name).join(' '));
        const preferred = new Set([...names, topic.title, topic.question].flatMap(tokens));
        const details = new Set(tokens(topic.explanation));
        return {topic, aliases, preferred, details, roots: new Set([...preferred].map(rootOf)),
            question: words(topic.question).join(' ')};
    });
    const frequency = new Map();
    for (const entry of index) {
        for (const word of entry.roots) frequency.set(word, (frequency.get(word) || 0) + 1);
    }
    function search(query = '') {
        if (!String(query ?? '').trim()) return topics.slice();
        const phrase = words(query).join(' ');
        const terms = [...new Set(tokens(query))];
        if (!terms.length) return [];
        const scores = index.map((entry, position) => {
            let score = 0;
            for (const term of terms) {
                const root = rootOf(term);
                const weight = 1 + Math.log((index.length + 1) / ((frequency.get(root) || 0) + 1));
                if (entry.aliases.includes(term)) score += 4 * weight;
                if (entry.preferred.has(term)) score += 3 * weight;
                else if (entry.roots.has(root)) score += 2 * weight;
                else if (term.length >= 4 && [...entry.preferred].some(word => word.startsWith(term))) score += weight;
                else if (entry.details.has(term)) score += 0.5 * weight;
            }
            if (entry.aliases.includes(phrase) || entry.question === phrase) score += 80;
            else if (entry.aliases.some(alias => alias.includes(' ') && (' ' + phrase + ' ').includes(' ' + alias + ' '))) score += 16;
            return {topic: entry.topic, score, position};
        });
        return scores.filter(match => match.score > 0)
            .sort((a, b) => b.score - a.score || a.position - b.position)
            .map(match => match.topic);
    }
    window.PythonReferenceData = Object.freeze({topics, search});
})();

