/* English copy for the Python course. Lesson and task order match saved progress IDs.
   Each task's two vocabularies describe the same exercise, including its boundary cases. */
window.AcademyEnglish = (() => {
    'use strict';
    const chapters = [
        'Your first creation', 'Choices and conditions', 'Patterns and loops', 'Text and lists',
        'Functions and tests', 'Data detectives', 'Grids and simulations', 'Your first big project',
        'Lantern festival', 'Telling stories with data', 'Game rules', 'Routes and strategy',
        'The playtest lab', 'Game jam'
    ];
    const phases = ['Predict', 'Lab', 'My project', 'Debug', 'Experiment', 'Reflect'];
    const comments = {
        "Хариулах мөрөө бич.": "Write the reply on the next line.",
        "Эхлэл, эргэлт, шийдлээ бич.": "Write the opening, twist and ending.",
        "Чиглэл тус бүрийг нэг мөрөөр хэвлэ.": "Print each direction on its own line.",
        "Нэрээ хэвлэ.": "Print the name.",
        "Гурван шошгоны мөрөө бич.": "Write the three labeled lines.",
        "Баримтаа хэвлэ.": "Print the receipt.",
        "spent, left тооцоод баримтаа хэвлэ.": "Calculate spent and left, then print the receipt.",
        "Эгнээ бүрийн хоёр захыг тоолоорой.": "Count the two ends of each row.",
        "boxes, rest тооцоол.": "Calculate boxes and rest.",
        "Нэмэлт майхан хэрэгтэй эсэхийг тооц.": "Decide whether another tent is needed.",
        "Нэг цаг 3600, нэг минут 60 секунд.": "An hour has 3600 seconds and a minute has 60.",
        "Бүх өдрийн хэрэглээ, нөөцөө нэгтгэ.": "Combine daily use and reserves.",
        "Бүх хүрээний урт ба үнийг бод.": "Calculate the full frame length and its price.",
        "Хүүхдийн үнийг шинэчил.": "Update the child price.",
        "Савны дээд хязгаарыг шалга.": "Check the tank capacity.",
        "Удаах хоёр бүсээ бич.": "Add the other two ranges.",
        "Тайван хэсгийн дүр зургийг ялга.": "For a calm scene, choose music based on its setting.",
        "Шагналуудын давуу дарааллыг сонго.": "Decide which reward has priority.",
        "Олс, далавчны нөхцөлийг хаалтад нэгтгэ.": "Group the rope and wings checks in parentheses.",
        "Дээд хязгаар болон бусад хоёр нөхцөлийг нэм.": "Add the upper bound and the two remaining conditions.",
        "Хүчийг шалга.": "Check the energy.",
        "Үлдсэн гурван замаа бич.": "Write the other three paths.",
        "Нэн яаралтай шийдвэрээс эхэл.": "Begin with the most urgent decision.",
        "Үсрэх нөхцөлөө нэм.": "Add the jump condition.",
        "Сөрөг алхамтай range хэрэглэ.": "Use range with a negative step.",
        "Гэрэлтэй буудал бүрийн дугаарыг тэмдэглэ.": "Record each lit station number.",
        "3, 6, 9 ... өдөр.": "Days 3, 6, 9 and so on.",
        "Энгийн ба урамшууллын ургац.": "Regular and bonus harvests.",
        "Сондгой ба тэгш ээлжийг ялга.": "Distinguish odd and even turns.",
        "Ээлжийг тоол.": "Count each turn.",
        "Гацах тохиолдлыг тасал.": "Handle the case that cannot make progress.",
        "Дараагийн төлбөрийн дараа нөөц хүрэх эсэхийг шалга.": "Check the reserve after paying for another crossing.",
        "(row+col) тэгш үү?": "Is row + col even?",
        "Өмнөх мөрөөс тусгаарлаад шатаа зур.": "Separate the new step from the previous line.",
        "Эхлэл болон төгсгөлийг залга.": "Join the first and last parts.",
        "Хэдэн үсэг дунд үлдэхийг ол.": "Count the hidden middle letters.",
        "Хоёр зүсмэлийн байрыг соль.": "Swap the two slices.",
        "Үг танигдсан эсэх, хүч хүрэх эсэхийг ялга.": "Check the spell and available energy separately.",
        "Хоосон утгыг шалгаж, доторх зайг соль.": "Check for blanks and replace inner spaces.",
        "item not in result нь давхцаагүй эсэхийг шалгана.": "Use item not in result to avoid duplicates.",
        "Эхний дууг сүүлд оруул. Бис хүсвэл дахин нэм.": "Move the first song to the end and add it again for an encore.",
        "Тэнцүү утгыг бас үлдээнэ.": "Keep values equal to the limit too.",
        "Хоосон түлхүүр, нэр бүрийн таарцыг шалга.": "Check for an empty query, then look for matches in each title.",
        "Индексийг дугаар болго.": "Convert the index to a competitor number.",
        "Нэг баганыг нэг текстээр хадгал.": "Store each bar as a string.",
        "Өнгө бүрийг нотоор соль.": "Convert each color to a note.",
        "Гурван тэмдгийг тус тус өөрчил.": "Replace the three symbols separately.",
        "1. Эхлэл, нийт өндгийг зургаас ол.": "1. Locate the start and count every egg on the map.",
        "2. Боломжит нүүдлээ шалгаад, өндөг ав.": "2. Check each move and collect eggs.",
        "3. E дээр ялалтын дүрмээ шалгаж тайлан буцаа.": "3. At E, check for a win and return the report.",
        "1. Эхлэх координат болон ашигласан түлшний цэгүүд.": "1. Track the start and used fueling points.",
        "2. Зам ба нөөцийн дүрмүүд.": "2. Apply movement and resource rules.",
        "3. Гарц дээр зогсоож тайлангаа буцаа.": "3. Stop at the exit and return the report."
    };
    const taskVocabulary = {
        "1.0": {"Тог тог!": "Knock knock!", "Ороорой!": "Come in!"},
        "1.1": {"КИНО": "FILM", "ТӨГСӨВ": "END", "Өндөг мөчрөөс унав.": "An egg fell from a branch.", "Өндөгнөөс далавч цухуйв.": "A wing peeked out of the egg.", "Бяцхан луу дээш нисэв.": "A little dragon took flight."},
        "1.2": {"ЭХЛЭЛ": "START", "ЭРДЭНЭС": "TREASURE", "ДЭЭШ": "UP", "ДООШ": "DOWN", "БАРУУН": "RIGHT", "ЗҮҮН": "LEFT"},
        "1.3": {"Нэг": "One", "Хоёр": "Two", "Гурав": "Three"},
        "2.0": {"Нэр:": "Name:", "Зэс": "Copper"},
        "2.1": {"Нэр:": "Name:", "Өнгө:": "Color:", "Нутаг:": "Home:", "Гялбаа": "Glimmer", "Мөнгөлөг": "Silver", "Мөсөн нуур": "Ice Lake"},
        "2.2": {"Хэнээс:": "From:", "Хэнд:": "To:", "Илгээмж:": "Parcel:", "Ану": "Anu", "Тэмүүлэн": "Temuulen", "Зэс түлхүүр": "Copper key"},
        "2.3": {"Сайн уу,": "Hello,", "Оюу": "Jade", "Сар": "Moon"},
        "3.1": {"Зарцуулсан:": "Spent:", "Үлдсэн:": "Left:"},
        "3.2": {"Алтлаг:": "Gold:", "Цэнхэр:": "Blue:"},
        "4.1": {"Майхан:": "Tents:", "Хоосон ор:": "Empty beds:"},
        "6.0": {"Нээ": "Open", "Хүлээ": "Wait", "болор": "crystal", "мод": "wood"},
        "6.1": {"өлссөн": "hungry", "тоглож байна": "playing", "унтсан": "asleep"},
        "6.2": {"хүүхэд": "child", "зочин": "guest", "том": "adult"},
        "6.3": {"Яв": "Go", "Зогс": "Stop", "ногоон": "green", "улаан": "red", "шар": "yellow"},
        "7.0": {"Гутал": "Boots", "Пүүз": "Sneakers"},
        "7.3": {"Тэмдэг": "Badge", "Дадлага": "Practice"},
        "8.0": {"Хүйтэн": "Cold", "Таатай": "Comfortable", "Халуун": "Hot"},
        "8.1": {"Бөмбөр": "Drum", "Лимбэ": "Flute", "Ятга": "Harp", "ой": "forest", "агуй": "cave", "нуур": "lake"},
        "8.2": {"Од": "Star", "Гал": "Fire", "Навч": "Leaf"},
        "8.3": {"Алт": "Gold", "Мөнгө": "Silver", "Хүрэл": "Bronze"},
        "9.1": {"Аврахаар яв": "Rescue", "Хоргод": "Take shelter"},
        "10.0": {"Хаалга": "Door", "Уул": "Mountain", "Амар": "Rest"},
        "10.1": {"Нуугд": "Hide", "болор": "crystal", "Болор хай": "Find a crystal", "Дулаацуулах": "Warm the egg", "Луу төрөв": "Dragon hatched", "олс": "rope"},
        "10.2": {"Ослын дохио": "Distress signal", "Хүлээ": "Wait", "Буух": "Land", "Цамхаг хай": "Find the beacon"},
        "10.3": {"Од хар": "Watch the stars", "Майхан": "Tent", "Агуй": "Cave"},
        "12.1": {"Нис!": "Launch!"},
        "17.0": {"сэр": "wake", "СЭР": "WAKE", "Сэр": "Wake", "сэрээ": "fork"},
        "17.1": {"ГАЛ": "FIRE", "гал": "fire", "Мөс": "Ice", "мөс": "ice", "ус": "water", "Танихгүй": "Unknown", "Хүч дутуу": "Low energy"},
        "17.2": {"дутуу": "missing"},
        "18.0": {"хоосон": "empty"},
        "18.3": {"алга": "none"},
        "20.1": {"хөх": "blue", "ХӨХ": "BLUE", "ногоон": "green", "улаан": "red", "шар": "yellow", "хар": "black", "до": "do", "ми": "mi", "соль": "sol"},
        "22.0": {"мөс": "ice", "сэрүүн": "cool", "дулаан": "warm"},
        "22.1": {"зүгээр": "ok", "сануул": "remind", "холбогд": "contact"},
        "22.2": {"алт": "gold", "мөнгө": "silver", "оролцогч": "participant"},
        "25.1": {"гал": "fire", "салхи": "wind", "үүл": "cloud"},
        "25.2": {"алх": "walk", "нар": "sun"},
        "35.1": {"хаа": "block", "алх": "walk"},
        "35.2": {"гэрэл": "light", "харанхуй": "dark"},
        "39.1": {"хэмжээ": "size", "гараа": "start", "өндөг": "egg", "бэлэн": "ready"},
        "39.2": {"хэмжээ": "size", "гараа": "start", "тэмдэг": "symbol", "бэлэн": "ready"},
        "40.0": {"ялалт": "win", "олз дутуу": "missing loot", "замд": "traveling"},
        "41.0": {"аслаа": "lit up"},
        "41.1": {"эхлэл": "start", "төгсгөл": "end", "зам": "trail", "отог": "camp"},
        "45.2": {"унтраалттай": "off"},
        "50.0": {"А": "A", "Б": "B", "тэнцүү": "tie", "дутуу": "missing"},
        "50.3": {"өссөн": "up", "буурсан": "down", "хэвээр": "unchanged", "тодорхойгүй": "unknown"},
        "55.0": {"ялалт": "win", "уналаа": "fell", "аялж байна": "traveling"},
        "55.1": {"хүрэв": "delivered", "зогсов": "stopped", "замд": "traveling"},
        "55.2": {"нууц тайлагдав": "mystery solved", "таамаг": "guess", "үргэлжилнэ": "to be continued"},
        "60.1": {"байхгүй": "none"},
        "62.2": {"хий": "put", "ав": "take"},
        "63.0": {"гацсан": "stuck", "гарсан": "left"},
        "63.2": {"эндэв": "miss", "давлаа": "pass"},
        "64.0": {"эхлэх": "start", "ЭхЛэХ": "StArT", "заавар": "help", "гарах": "quit", "дахин сонго": "choose again"},
        "64.2": {"Од авлаа": "Star collected", "Хаалга тогшив": "Door knocked", "Цаг дууслаа": "Time is up"},
        "64.3": {"сонголтоо шалга": "check your choice"},
        "65.0": {"гарах": "quit", "түү": "pick", "хадгал": "bank"},
        "65.2": {"хадгал": "bank", "түү": "pick", "үз": "look"},
        "65.3": {"гарах": "quit"}
    };
    const lessons = [
        // Lesson 1
        {
            title: "First show",
            intro: "Python runs each line from top to bottom. print() displays the text between matching quotes.",
            question: "What does the second line print?",
            why: "The second print displays its own string on a new line.",
            stretch: "Change the ending of your film or turn one arrow around. Predict the new output before running it.",
            reflect: "What did the viewer see when you moved one line?",
            example: "print(\"Knock knock!\")\nprint(\"Who's there?\")",
            options: ["Knock knock!","Who's there?","print"],
            tasks: [
                {
                    title: "Behind the door",
                    brief: "Print two lines. First print “Knock knock!”, then “Come in!”.",
                    hint: "Use a second print call for the reply."
                },
                {
                    title: "A three-frame cartoon",
                    brief: "Print five lines. Start with FILM, describe three distinct events, then finish with END. Sketch one frame per event.",
                    hint: "Give each frame its own print call."
                },
                {
                    title: "An arrow map",
                    brief: "Print START, three directions, then TREASURE on five lines. Use at least two distinct directions from UP, DOWN, RIGHT and LEFT.",
                    hint: "Trace the printed directions on a grid."
                },
                {
                    title: "Frames out of order",
                    brief: "Repair the misspelling and arrange the calls to print One, Two and Three on separate lines.",
                    hint: "First check each function name, then check the line order."
                }
            ]
        },
        // Lesson 2
        {
            title: "The dragon registry",
            intro: "Assign text to a name with =. print(name) displays the stored value while print(\"name\") displays the word itself.",
            question: "What does the last print display?",
            why: "The second assignment replaces the first value of name.",
            stretch: "Give your character a second identity and print both versions.",
            reflect: "Which lines changed the stored name, and which only displayed it?",
            example: "name = \"Moon\"\nprint(\"Hatchling:\", name)\nname = \"Spark\"\nprint(name)",
            options: ["Moon","name","Spark"],
            tasks: [
                {
                    title: "A name tag",
                    brief: "Give your dragon a name in pet. Print the value of pet on one line. You may add a label of your choice before the name.",
                    hint: "Quote the label but leave the variable outside the quotes."
                },
                {
                    title: "Hatchling passport",
                    brief: "Set pet, color and home to three different strings. Print the name, color and home on three separate lines in that order. Choose your own labels or print just the values.",
                    hint: "Change the three values and run the same print statements again."
                },
                {
                    title: "Lost parcel",
                    brief: "Set sender and receiver to different characters and parcel to the item. Print a three-line receipt with the sender, recipient and item in that order. Choose your own labels.",
                    hint: "Swap the names and check that the receipt changes."
                },
                {
                    title: "The name that would not change",
                    brief: "Fix the two mistakes so assigning Jade to name makes the program display Hello, Jade.",
                    hint: "Look for a quoted variable name and an assignment to the wrong name."
                }
            ]
        },
        // Lesson 3
        {
            title: "Market arithmetic",
            intro: "Store prices and quantities as numbers. Multiply them to find a cost, then add any delivery charge.",
            question: "Four items cost three coins each. What is the total with two coins for delivery?",
            why: "Multiplication happens first, so the result is 12 plus 2.",
            stretch: "Try two different baskets and predict how much money each leaves.",
            reflect: "Which values would you change if the market raised its prices?",
            tasks: [
                {
                    title: "Coin purses",
                    brief: "Four purses each contain seven coins. Calculate their total in total and print it.",
                    hint: "Multiply the number of purses by the coins per purse."
                },
                {
                    title: "An expedition budget",
                    brief: "Start with 100 coins. Bread costs 6 and apples cost 3. Choose positive whole quantities in bread and apples that you can afford. Calculate spent and left, then print them on separate lines in that order. Labels are optional.",
                    hint: "Multiply each price by its quantity before adding the costs."
                },
                {
                    title: "Stage lights",
                    brief: "Choose rows ≥ 2 and cols ≥ 3. The two ends of every row are gold and the other lights blue. Calculate gold and blue, then print the counts on separate lines in that order. Choose your own labels or print just the counts.",
                    hint: "Count the two ends once per row and subtract them from the full grid."
                },
                {
                    title: "A ticket discount",
                    brief: "Four child tickets cost three coins each. Take two coins off the total and print the final price stored in total.",
                    hint: "Apply the discount once after calculating the full price."
                }
            ]
        },
        // Lesson 4
        {
            title: "Sharing supplies",
            intro: "Use // to count complete groups and % to find what is left over. Together they account for every item.",
            question: "What does the last line print?",
            why: "Twenty-three makes five groups of four with three left over.",
            stretch: "Try a quantity divisible by the group size, then add one item.",
            reflect: "When does a remainder mean you need another container?",
            tasks: [
                {
                    title: "Egg cartons",
                    brief: "Pack 19 eggs into cartons of 6. Store the number of full cartons in boxes and the loose eggs in rest. Print each number on its own line.",
                    hint: "Use floor division for whole cartons and remainder for loose eggs."
                },
                {
                    title: "Camp tents",
                    brief: "Choose at least 12 travelers. Tents sleep four. Store the fewest tents that fit everyone in tents and the empty beds in beds. Print those counts on two lines in order, with optional labels.",
                    hint: "Try 16 and 17 travelers to see when one more tent is needed."
                },
                {
                    title: "Race timer",
                    brief: "Choose a whole number of seconds above 60. Convert it to hours, minutes and seconds in h, m and s, then print the three values on one line separated by spaces.",
                    hint: "Convert your result back to seconds to double-check it."
                },
                {
                    title: "Leftover stones",
                    brief: "Pack 28 stones into bags of five. Print the number of full bags and the stones left over, in that order on one line.",
                    hint: "Check the order of // and %."
                }
            ]
        },
        // Lesson 5
        {
            title: "A reusable machine",
            intro: "A function gives a calculation a name. The argument supplies a value for its parameter, and return sends the answer back to the caller.",
            question: "What does fare(4) return?",
            why: "Four stops cost 12, plus a base fare of 2.",
            stretch: "Try your function with two quite different inputs. Predict both results first.",
            reflect: "What changes between calls and what stays in the function?",
            tasks: [
                {
                    title: "Light power",
                    brief: "Return the power of n batteries when each provides 5 units.",
                    hint: "Use n in a multiplication and return the result."
                },
                {
                    title: "Water for the trip",
                    brief: "Each person needs two liters per day. Return the water for everyone plus the reserve. Compare the needs of two different trips.",
                    hint: "Multiply people by days before adding the reserve."
                },
                {
                    title: "A picture frame",
                    brief: "Return the price of a rectangular frame with width w, height h and cost price per unit of length. Try two pictures that cost the same to frame.",
                    hint: "A frame has two sides of each length."
                },
                {
                    title: "Silent return",
                    brief: "Make double(n) return twice n so its caller can use the number.",
                    hint: "Check both the arithmetic and how the result leaves the function."
                }
            ]
        },
        // Lesson 6
        {
            title: "The sleeping gate",
            intro: "An if statement checks a condition. Indent the action for a match and put the alternative under else. Compare values with ==.",
            question: "Which status will be printed?",
            why: "The silver key does not match the gold key, so the alternative runs.",
            stretch: "Test one matching key and two different nonmatching keys.",
            reflect: "Which condition changes the result?",
            example: "def signal(key):\n    if key == \"gold\":\n        return \"Open\"\n    else:\n        return \"Locked\"\nprint(signal(\"silver\"))",
            options: ["gold","Open","Locked"],
            tasks: [
                {
                    title: "The right key",
                    brief: "Return “Open” for the exact key “crystal”. Otherwise return “Wait”.",
                    hint: "Compare key with the required string using ==."
                },
                {
                    title: "Dragon caretaker",
                    brief: "A hungry dragon (“hungry”) eats two portions, and every other mood uses one. Return the portions left. The bowl starts with at least two.",
                    hint: "Feed the remaining portions into the next call."
                },
                {
                    title: "Ticket printer",
                    brief: "Each child ticket (“child”) costs 3 coins. Any other ticket costs 6. Return the total for count tickets.",
                    hint: "Pick the unit price before multiplying."
                },
                {
                    title: "A light that is always green",
                    brief: "Return “Go” only for “green”. All other colors must return “Stop”.",
                    hint: "Check what the alternative branch currently returns."
                }
            ]
        },
        // Lesson 7
        {
            title: "Right on the boundary",
            intro: "The difference between > and >= matters when a value lands exactly on the limit. Test just below, at, and just above it.",
            question: "What happens with exactly 5 energy?",
            why: "Five satisfies the greater-than-or-equal condition.",
            stretch: "Try all three values around a threshold and record the results.",
            reflect: "Which test would catch a missing equals sign?",
            example: "def ready(energy):\n    if energy >= 5:\n        return \"Fly\"\n    return \"Rest\"\nprint(ready(5))",
            options: ["Fly","Rest","Error"],
            tasks: [
                {
                    title: "Snow depth",
                    brief: "At 12 cm of snow or more return “Boots”. Below 12 return “Sneakers”.",
                    hint: "Test snow depths of 11, 12 and 13."
                },
                {
                    title: "Rain reserve",
                    brief: "Return the amount of water after rain. This tank can hold at most 20 liters.",
                    hint: "Compare level + rain with capacity before returning."
                },
                {
                    title: "Charger decision",
                    brief: "If the charge covers the trip cost, return the charge left after traveling. Otherwise stay put and return the original charge.",
                    hint: "Try a battery with exactly enough power."
                },
                {
                    title: "Lost at the cutoff",
                    brief: "Return “Badge” for 20 or more points and “Practice” below 20. Fix the boundary mistake.",
                    hint: "Try 19, 20 and 21."
                }
            ]
        },
        // Lesson 8
        {
            title: "Three endings",
            intro: "An elif checks another possibility only if the earlier condition failed. Put thresholds in an order that lets each branch run.",
            question: "Nine clears both thresholds. Which result is returned?",
            why: "The first condition succeeds, so Python returns immediately.",
            stretch: "Find inputs that reach all three endings.",
            reflect: "Why does the order of the conditions matter?",
            example: "def rank(n):\n    if n >= 8:\n        return \"Gold\"\n    elif n >= 4:\n        return \"Silver\"\n    return \"Bronze\"\nprint(rank(9))",
            options: ["Silver","Gold","Gold, Silver"],
            tasks: [
                {
                    title: "Incubator signals",
                    brief: "Below 18 return “Cold”. From 18 through 26 return “Comfortable”. Above 26 return “Hot”.",
                    hint: "Check both limits of the middle range."
                },
                {
                    title: "Music director",
                    brief: "Danger at least 7 always gives “Drum”. Otherwise a forest scene (“forest”) gives “Flute” and other scenes give “Harp”.",
                    hint: "Check danger before checking the scene."
                },
                {
                    title: "A reader’s reward",
                    brief: "For at least 30 pages return “Star”. Otherwise for at least three days return “Fire”, and for other readers return “Leaf”.",
                    hint: "Test a reader who qualifies for both rewards."
                },
                {
                    title: "Missing gold",
                    brief: "Restore the ranks. At least 8 gives “Gold”, from 4 through 7 gives “Silver”, and 0 through 3 gives “Bronze”.",
                    hint: "Put the highest cutoff first."
                }
            ]
        },
        // Lesson 9
        {
            title: "Two-key puzzle",
            intro: "Use and when both conditions must hold, or when either will do, and not to reverse a Boolean value.",
            question: "What does the gate return when only one item is present?",
            why: "True and False evaluates to False.",
            stretch: "Make a small table of input combinations before running the function.",
            reflect: "Which combination would distinguish and from or?",
            tasks: [
                {
                    title: "A safe tunnel",
                    brief: "Return True only if the light is on and the tunnel is not flooded.",
                    hint: "Combine the light with the opposite of flood."
                },
                {
                    title: "Rescue crew",
                    brief: "Return “Rescue” (go rescue) if there is no storm and you have rope or wings. Otherwise return “Take shelter”.",
                    hint: "Group the two equipment choices together."
                },
                {
                    title: "Rare seed greenhouse",
                    brief: "Return True only at 16–25 degrees inclusive with both water and a lit lamp. Return False otherwise.",
                    hint: "Try both boundary temperatures and switch off one supply."
                },
                {
                    title: "A gate that lets everyone in",
                    brief: "Return True only for someone aged at least 10 who also has a ticket. Repair both checks.",
                    hint: "Age 10 with and without a ticket should give different answers."
                }
            ]
        },
        // Lesson 10
        {
            title: "The fork in the trail",
            intro: "Different clues can affect the same decision. Handle urgent exceptions first, then check the remaining choices in order.",
            question: "Where do you go on a rainy day with enough coins?",
            why: "The rain branch returns before the coin balance is checked.",
            stretch: "Draw a path to every possible ending and test each path.",
            reflect: "When two rules match, which takes priority and why?",
            example: "def path(rain, coins):\n    if rain:\n        return \"Cave\"\n    if coins >= 3:\n        return \"Boat\"\n    return \"Trail\"\nprint(path(True, 10))",
            options: ["Trail","Boat","Cave"],
            tasks: [
                {
                    title: "Choose a route",
                    brief: "A key gives “Door”. Without a key, energy of at least 5 gives “Mountain”, otherwise “Rest”.",
                    hint: "Check the key before checking energy."
                },
                {
                    title: "Rescue a dragon egg",
                    brief: "An awake guard gives “Hide”. With a sleeping guard and tool other than “crystal”, return “Find a crystal”. With the crystal and heat below 20, return “Warm the egg”. Otherwise return “Dragon hatched”.",
                    hint: "Handle the guard, tool and temperature in that order."
                },
                {
                    title: "Space landing",
                    brief: "Fuel below 2 gives “Distress signal”. Otherwise a storm gives “Wait”. With no storm, a lit beacon gives “Land”, and an unlit beacon gives “Find the beacon”.",
                    hint: "Give the fuel emergency the highest priority."
                },
                {
                    title: "An overwritten decision",
                    brief: "Without rain return “Watch the stars”. In rain return “Tent” if there is a tent and “Cave” otherwise. Fix the decision that gets overwritten.",
                    hint: "A later independent if can replace an earlier answer."
                }
            ]
        },
        // Lesson 11
        {
            title: "Rhythm workshop",
            intro: "A for loop repeats its indented body. Build a string one piece at a time and return it after the loop finishes.",
            question: "How many copies of ta will be printed?",
            why: "range(3) runs three times and each turn adds one beat.",
            stretch: "Invent two moves and try their pattern for zero, one and four rounds.",
            reflect: "What happens if the return moves inside the loop?",
            example: "beat = \"\"\nfor i in range(3):\n    beat = beat + \"ta\"\nprint(beat)",
            tasks: [
                {
                    title: "Footstep trail",
                    brief: "Return a string of n greater-than signs. For zero steps return an empty string.",
                    hint: "Start with an empty string."
                },
                {
                    title: "Dance card",
                    brief: "Join left and right, repeat this pair rounds times, and append one exclamation mark at the end.",
                    hint: "The exclamation mark appears only once, even with zero rounds."
                },
                {
                    title: "Robot command tape",
                    brief: "For each of n turns add M. If jump is true add J after every M. End the tape with S.",
                    hint: "Add the stop signal after the loop."
                },
                {
                    title: "A drum with one beat",
                    brief: "Return n copies of x. Zero beats should return an empty string. Fix the early return.",
                    hint: "Look at the indentation of return."
                }
            ]
        },
        // Lesson 12
        {
            title: "Climbing the number steps",
            intro: "range(start, stop, step) starts at start and leaves out stop. A negative step counts backwards.",
            question: "Which sequence will appear?",
            why: "Starting at 2 and adding 3 gives 2, 5 and 8 before reaching the stop.",
            stretch: "Draw a number line and predict the last value before running your code.",
            reflect: "How do you include the last number you want?",
            tasks: [
                {
                    title: "Even stepping stones",
                    brief: "Return the sum of the even numbers from 2 through end, including end if it is even.",
                    hint: "Move two places at a time."
                },
                {
                    title: "Rocket countdown",
                    brief: "Count from start down to 1. Add a space after each number and end the string with “Launch!” (launch).",
                    hint: "Convert each number with str before joining it to text."
                },
                {
                    title: "Station lights",
                    brief: "Starting at station 0, light every gap-th station up to and including last. Return the lit station numbers in brackets, for example [0][3]. gap is positive.",
                    hint: "The stop passed to range must allow last when it is on the route."
                },
                {
                    title: "A missing final number",
                    brief: "Sum the odd numbers from 1 through end. Fix the start, stop and step.",
                    hint: "Check the result when end itself is odd."
                }
            ]
        },
        // Lesson 13
        {
            title: "The scoreboard",
            intro: "Set up an accumulator before a loop. Add to it on the turns that earn points. A remainder of zero identifies a multiple.",
            question: "What score remains after adding 2 and 4?",
            why: "Only the even numbers contribute, giving 6.",
            stretch: "Draw a score table for the first eight turns and compare it with your program.",
            reflect: "Why does it matter where you initialize the total?",
            tasks: [
                {
                    title: "Bonus days",
                    brief: "Award two points on each third day from day 1 through days. Return the total bonus.",
                    hint: "Use the remainder when dividing the day by three."
                },
                {
                    title: "Harvest diary",
                    brief: "Collect rate apples daily and three extra on every fourth day. Return the total for days days.",
                    hint: "Separate the daily harvest from the occasional bonus."
                },
                {
                    title: "Wavy staircase",
                    brief: "Start at height zero. Rise three on odd-numbered steps and descend one on even steps. Return the final height.",
                    hint: "The first step is numbered one."
                },
                {
                    title: "A board that resets daily",
                    brief: "Return the sum from 1 through n. Find why total currently holds only the last number.",
                    hint: "Initialize the accumulator before the loop."
                }
            ]
        },
        // Lesson 14
        {
            title: "When does it stop?",
            intro: "A while loop checks its condition before every turn. Make sure the body changes a value that can make the condition false.",
            question: "Charge goes from 1 to 3 to 5 to 7. How many turns did this take?",
            why: "Three additions bring the charge to or above 6.",
            stretch: "Try a starting value already at the target and a value one step away.",
            reflect: "When should the body run zero times?",
            tasks: [
                {
                    title: "A fading lantern",
                    brief: "Burn two fuel units on each turn that begins with positive fuel. Return how many turns the lantern shines.",
                    hint: "Count the last turn even if only one fuel unit remains."
                },
                {
                    title: "Warming an egg",
                    brief: "Add lamp to warmth each turn until it reaches target. Return the number of turns, zero if already warm enough, or −1 if a nonpositive lamp cannot reach the target.",
                    hint: "Handle the impossible case before the loop."
                },
                {
                    title: "Ferry fuel",
                    brief: "Return the number of complete crossings possible at positive cost while keeping at least reserve fuel. A starting level below reserve gives zero.",
                    hint: "Check the fuel that would remain after another crossing."
                },
                {
                    title: "Incomplete countdown",
                    brief: "Count every turn from n down to and including 1. Repair the condition that skips one turn.",
                    hint: "Try n equal to one."
                }
            ]
        },
        // Lesson 15
        {
            title: "Pixel pattern festival",
            intro: "Use an outer loop for rows and an inner loop for columns. Start a new string for each row and join the rows to make a picture.",
            question: "How many times does the inner action run?",
            why: "Two rows of three columns give six repetitions.",
            stretch: "Render a wide picture and a tall one using the same number of cells.",
            reflect: "Which loop controls the width of the drawing?",
            tasks: [
                {
                    title: "Straight line",
                    brief: "Return mark repeated width times on one line. Width may be zero and mark can contain two characters.",
                    hint: "Test a multi-character mark."
                },
                {
                    title: "Weave a checkerboard",
                    brief: "Draw rows by cols alternating # and . with # at the top left. Alternate the first mark on each row. Separate rows with newlines and leave no final blank line.",
                    hint: "Check whether row + column is even."
                },
                {
                    title: "A staircase drawing",
                    brief: "Draw one mark on the first row, two on the next and height on the last. Separate rows with newlines and leave no trailing blank line.",
                    hint: "Build each row first, then join."
                },
                {
                    title: "Ever-growing rows",
                    brief: "Return a rectangle of X characters with rows separated by /. Every row must have cols characters.",
                    hint: "Start a fresh line inside the outer loop."
                }
            ]
        },
        // Lesson 16
        {
            title: "Secret message window",
            intro: "A string starts at index zero. A slice includes its start and leaves out its end. Check an empty string before indexing it.",
            question: "Which three letters does word[1:4] select?",
            why: "Indices 1, 2 and 3 give the middle three letters.",
            stretch: "Try an empty word, a one-letter word and a longer one.",
            reflect: "When is slicing safer than accessing a single index?",
            example: "word=\"STONE\"\nprint(word[1:4])",
            options: ["STO","TON","ONE"],
            tasks: [
                {
                    title: "Edge letters",
                    brief: "For a nonempty word join its first and last letters. Repeat a single letter twice. Return an empty string for an empty word.",
                    hint: "Handle the empty case before indexing."
                },
                {
                    title: "A secret envelope",
                    brief: "Keep the first and last letters visible. Replace every middle letter with *. Words of length zero, one or two stay unchanged.",
                    hint: "The hidden section has length len(word) − 2."
                },
                {
                    title: "Cipher wheel",
                    brief: "Rotate code left by steps positions. Full turns have no effect. Return an empty string for empty input.",
                    hint: "Use the remainder of steps divided by the length after checking for emptiness."
                },
                {
                    title: "The last index",
                    brief: "Return the final two characters. If there are fewer than two, return the whole word.",
                    hint: "A slice tolerates a short string."
                }
            ]
        },
        // Lesson 17
        {
            title: "Polishing spell words",
            intro: "strip() removes outer spaces, lower() makes lowercase text, and replace() substitutes characters. Each returns a new string.",
            question: "What is stored in clean?",
            why: "strip removes the spaces and lower converts FIRE to fire.",
            stretch: "Try the same command with capitals and extra spaces.",
            reflect: "Which changes should count as the same input?",
            tasks: [
                {
                    title: "Recognize the call",
                    brief: "Return True for the call “wake”, ignoring outer whitespace and case. Return False for other words.",
                    hint: "Chain strip and lower."
                },
                {
                    title: "A magic gate call",
                    brief: "Clean the input and recognize “fire” and “ice”. Unknown spells return “Unknown”. Known spells below 3 energy return “Low energy”. Otherwise append ! to the clean spell.",
                    hint: "Check whether a spell is known before looking at energy."
                },
                {
                    title: "Museum labels",
                    brief: "Trim and lowercase the room and item. Replace inner spaces with hyphens and return room/item. Return “missing” if either cleaned value is empty.",
                    hint: "Clean both parts before making the label."
                },
                {
                    title: "An unchanged name",
                    brief: "Return the name in uppercase with no outer spaces. The current calls lose their results.",
                    hint: "String methods produce new strings."
                }
            ]
        },
        // Lesson 18
        {
            title: "The dragon’s backpack",
            intro: "A list holds items in order. Index zero is the first item, len counts items, and append adds one at the end.",
            question: "Which item will be printed?",
            why: "Appending a third item leaves the item at index 1 in place.",
            stretch: "Try an empty pack, a full pack and one with a duplicate.",
            reflect: "How can you make a new pack without changing the original?",
            example: "bag=[\"apple\",\"rope\"]\nbag.append(\"key\")\nprint(bag[1])",
            options: ["apple","rope","key"],
            tasks: [
                {
                    title: "Top of the bag",
                    brief: "Return the last item or “empty” when there are no items.",
                    hint: "Check the bag before using index −1."
                },
                {
                    title: "Three cargo seats",
                    brief: "Return a new list. Add item only if the bag has fewer than three items and does not contain item. Always leave the original bag intact.",
                    hint: "Start with bag[:] to make a copy."
                },
                {
                    title: "Concert set list",
                    brief: "For an empty set list return []. Otherwise move the first song to the end in a new list. If encore is true add the original first song once more.",
                    hint: "Keep the first song available after moving it."
                },
                {
                    title: "An empty chest",
                    brief: "Return the first find or “none” for an empty chest. Fix the index error.",
                    hint: "An empty list has no index zero."
                }
            ]
        },
        // Lesson 19
        {
            title: "The search party",
            intro: "Read a list in order and append only the items that match your condition to a fresh list. This preserves the order of the matches.",
            question: "Which list does this program produce?",
            why: "Eight and seven qualify in that order.",
            stretch: "Try a search with no matches, then one with a repeated match.",
            reflect: "Which step makes your filter preserve the original order?",
            tasks: [
                {
                    title: "Bright stones",
                    brief: "Return all values at least limit in their original order.",
                    hint: "Use >= so a stone at the limit qualifies."
                },
                {
                    title: "Library search",
                    brief: "Return original titles that contain the search word anywhere, in their original order. Ignore case, strip the query, and return [] for an empty query.",
                    hint: "Compare lowercase copies but keep original titles in your result."
                },
                {
                    title: "Team selection",
                    brief: "Return the 1-based competitor numbers of scores at least limit. Keep tied players separate.",
                    hint: "Use enumerate with a starting index of 1."
                },
                {
                    title: "Stopped after one item",
                    brief: "Return every strictly positive value. Repair the test that keeps zero and the return that stops after the first item.",
                    hint: "Return the finished list outside the loop."
                }
            ]
        },
        // Lesson 20
        {
            title: "The hidden cave exhibition",
            intro: "Turn each piece of data into a new visual or musical symbol. Keep the input, transformation rule and output separate.",
            question: "What pattern is in the third position?",
            why: "The third value is 2, so the third pattern has two stars.",
            stretch: "Design a five-row cave or an eight-note crystal melody and run your converter.",
            reflect: "How could someone reconstruct your rules from the output?",
            tasks: [
                {
                    title: "Columns of light",
                    brief: "Turn each height into a string of that many # marks. Return the list, including an empty string for zero.",
                    hint: "Each input generates exactly one row."
                },
                {
                    title: "Crystal melody",
                    brief: "Trim and lowercase colors. Convert blue to do, green to mi and red to sol. Skip other colors and keep the original order.",
                    hint: "Use one mapping entry per recognized color."
                },
                {
                    title: "Cave map maker",
                    brief: "Return new rows replacing . with a space, # with █ and G with ★. Keep other characters and the original list unchanged.",
                    hint: "Collect transformed strings in a separate list."
                },
                {
                    title: "Duplicate calls",
                    brief: "Strip and lowercase each word. Discard empty words and keep each remaining word once in order of first appearance.",
                    hint: "Check the cleaned word before appending it."
                }
            ]
        },
        // Lesson 21
        {
            title: "Garden calculator",
            intro: "Parameters give names to inputs and return passes a calculated value back to the caller. Try the same function with different arguments.",
            question: "What does boxes(2, 5) return?",
            why: "Two rows of five give ten.",
            stretch: "Compare two garden layouts and predict their cost.",
            reflect: "Which inputs would you change to reuse your calculation?",
            tasks: [
                {
                    title: "Seed reserves",
                    brief: "Return the seeds required for rows rows with each seeds per row plus spare seeds.",
                    hint: "Find the planted seeds first."
                },
                {
                    title: "Seedling budget",
                    brief: "Return [number of seedlings, total cost, money left]. Allow a negative balance when the budget is too small.",
                    hint: "Subtract the whole cost from the budget only once."
                },
                {
                    title: "Book delivery",
                    brief: "Give each house each books. Return [total books, full bags, books in the final partial bag]. bag_size is positive.",
                    hint: "Apply // and % to the total."
                },
                {
                    title: "Printed instead of returned",
                    brief: "Make the function return double the input. The caller currently receives None.",
                    hint: "Look at how the function passes its answer to its caller."
                }
            ]
        },
        // Lesson 22
        {
            title: "Decisions at a threshold",
            intro: "Numbers right at a cutoff reveal mistakes in comparisons. Try the values just below, at and above a boundary.",
            question: "What does the example print?",
            why: "Four falls below 5 while both 5 and 6 pass.",
            stretch: "Choose a cutoff and make three tests around it.",
            reflect: "Which input separates > from >=?",
            tasks: [
                {
                    title: "Temperature signal",
                    brief: "Below 0 return “ice”, from 0 through 19 return “cool”, and at 20 or above return “warm”.",
                    hint: "Test both 0 and 20."
                },
                {
                    title: "Library reminder",
                    brief: "No late days means no fee. Charge 2 per book per day for the first three overdue days, then 4. Return [fee, status] using “ok”, “remind” or “contact” for zero, 1–3 or 4+ late days.",
                    hint: "On day four only the extra day costs the higher rate."
                },
                {
                    title: "Race judge",
                    brief: "Subtract the penalty from the score, floored at zero. Return [final score, rank]. Use “gold” at 10+, “silver” at 5+, otherwise “participant”.",
                    hint: "Classify the score after applying the penalty."
                },
                {
                    title: "The birthday boundary",
                    brief: "Return True at age 10 and above and False below it.",
                    hint: "Test exactly age 10."
                }
            ]
        },
        // Lesson 23
        {
            title: "Build a stage from functions",
            intro: "Short functions that return strings can build a bigger picture. String multiplication repeats a mark, and join connects pieces with a separator.",
            question: "What does \".\".join([\"A\", \"B\", \"C\"]) return?",
            why: "A separator goes between adjacent pieces, never after the last one.",
            stretch: "Draw a second stage by changing just the size or mark.",
            reflect: "Which small function could you reuse in another drawing?",
            tasks: [
                {
                    title: "Stair pattern",
                    brief: "Return a list of patterned rows with lengths from 1 through height.",
                    hint: "Use the same mark an increasing number of times."
                },
                {
                    title: "Stage frame",
                    brief: "Return rows for a rectangular frame at least two cells wide and high. Fill the top and bottom with mark, and outline the edges of the middle rows with mark around spaces.",
                    hint: "Middle rows need two edge marks and width − 2 spaces."
                },
                {
                    title: "Music ribbon",
                    brief: "Turn each positive note number into that many ♪ symbols, and zero into -. Join bars with |, repeat the phrase repeats times, and put one space between phrases.",
                    hint: "Build the phrase first, then join its repetitions."
                },
                {
                    title: "Missing a row",
                    brief: "Include all star rows from one through n. Repair the missing final row.",
                    hint: "Check the exclusive stop of range."
                }
            ]
        },
        // Lesson 24
        {
            title: "Bug hunters",
            intro: "Choose an explicit result for empty input before finding a maximum or average. An assert helps isolate the example that breaks a rule.",
            question: "What does first([]) return?",
            why: "The empty list takes the alternative branch, returning None.",
            stretch: "Add a test for empty data and another for equal or negative values.",
            reflect: "Which case first revealed the bug?",
            example: "def first(items):\n    return items[0] if items else None\n\nassert first([]) is None\nprint(first([\"moon\", \"sun\"]))",
            tasks: [
                {
                    title: "Score range",
                    brief: "Return maximum minus minimum. With no scores or one score return zero.",
                    hint: "Handle the empty list before calling max."
                },
                {
                    title: "Wind station",
                    brief: "Skip negative readings. Return [count, lowest, highest] for the valid readings or [0, None, None] if there are none.",
                    hint: "Zero is a valid reading."
                },
                {
                    title: "Second place",
                    brief: "Return the second highest distinct score. With fewer than two different scores return None.",
                    hint: "Remove duplicate values before choosing second place."
                },
                {
                    title: "Wrong champion",
                    brief: "Find the highest score even if every score is negative. Return None for empty input.",
                    hint: "A starting best of zero can hide the true maximum."
                }
            ]
        },
        // Lesson 25
        {
            title: "The dawn incubator",
            intro: "A simulation updates the current state after each event. Start fresh on each function call and check limits on every step.",
            question: "What is warm(warm(2))?",
            why: "The first call returns 4 and the next is capped at 5.",
            stretch: "Compare two event sequences with the same events in different orders.",
            reflect: "Why can the order change the final state?",
            tasks: [
                {
                    title: "Adjust the heat",
                    brief: "Change the temperature by delta and keep it between zero and six inclusive.",
                    hint: "Clamp the updated value at both limits."
                },
                {
                    title: "Dragon egg",
                    brief: "“fire” raises heat by 2, “wind” lowers it by 1, and anything else leaves it alone. Clamp to 0–6 after each event. Return [final temperature, turns at 3–5 degrees].",
                    hint: "Count comfortable turns after adjusting and clamping."
                },
                {
                    title: "Pocket robot",
                    brief: "“walk” spends two charge if available and “sun” adds three, capped at 8. Return [final charge, successful steps].",
                    hint: "Count a step only when the robot can pay."
                },
                {
                    title: "Limits on each turn",
                    brief: "Apply changes one by one and keep the value at least zero after every change. Fix the code that checks only the final value.",
                    hint: "Try a negative change followed by a positive one."
                }
            ]
        },
        // Lesson 26
        {
            title: "A register of stars",
            intro: "A dictionary links each name to its count. get supplies a starting value when a name appears for the first time.",
            question: "What is sky.get(\"white\", 0)?",
            why: "That key is missing, so get returns its default of zero.",
            stretch: "Add a repeated observation and a previously unseen name.",
            reflect: "Which entry changes on a repeated observation?",
            example: "sky = {}\nfor star in [\"blue\", \"red\", \"blue\"]:\n    sky[star] = sky.get(star, 0) + 1\nprint(sky)",
            options: ["0","\"white\"","1"],
            tasks: [
                {
                    title: "Star census",
                    brief: "Return a dictionary with the number of occurrences of each name.",
                    hint: "Use get(name, 0) for a new entry."
                },
                {
                    title: "Birdwatcher",
                    brief: "Each observation is [species, count]. Skip counts of zero or less. Return a dictionary of the total positive count for each species.",
                    hint: "Update the species only after validating its count."
                },
                {
                    title: "Song requests",
                    brief: "Return sorted names of songs with at least threshold votes, each name once.",
                    hint: "Count first, filter and sort second."
                },
                {
                    title: "Lost duplicates",
                    brief: "Return the frequency of each key. Repeated names should increase their existing counts.",
                    hint: "Look for an assignment that resets an entry to one."
                }
            ]
        },
        // Lesson 27
        {
            title: "The shop inventory",
            intro: "Dictionaries can change in place. Make a copy before trying a sale if the original inventory should stay available.",
            question: "Which pair is printed?",
            why: "Only the copy loses an apple.",
            stretch: "Try one order that fits and one that cannot be filled.",
            reflect: "How can you tell whether the original inventory changed?",
            example: "bag = {\"apple\": 2}\nnew = bag.copy()\nnew[\"apple\"] -= 1\nprint(bag[\"apple\"], new[\"apple\"])",
            tasks: [
                {
                    title: "Restock",
                    brief: "Add n units of item to a copy of the original inventory and return it.",
                    hint: "A previously missing item starts at zero."
                },
                {
                    title: "Fill orders in order",
                    brief: "Each order requests one named item. Sell it if stock remains or count a rejection. Return [final inventory, rejected orders] while keeping the input unchanged.",
                    hint: "Process the next order using the updated stock copy."
                },
                {
                    title: "Pack by weight",
                    brief: "Consider wishes in order. Take items of known weight that fit without exceeding limit. Skip others and keep looking. Return [packed names, total weight].",
                    hint: "A skipped heavy item need not block a lighter item later."
                },
                {
                    title: "An unknown price",
                    brief: "Add the prices of all names in the basket. A name absent from the price list costs zero.",
                    hint: "Supply a default with get."
                }
            ]
        },
        // Lesson 28
        {
            title: "A weather diary",
            intro: "Each dictionary in a list can describe one observation. Select the relevant records before extracting the readings.",
            question: "Which list does the example print?",
            why: "Only the record for city A qualifies and its temperature is 2.",
            stretch: "Add a second city and a tie for warmest day.",
            reflect: "Which part of the code chooses rows and which chooses values?",
            tasks: [
                {
                    title: "City temperatures",
                    brief: "Return temp values from records whose city matches, in original order.",
                    hint: "Filter by the city field before reading temp."
                },
                {
                    title: "Station summary",
                    brief: "For a city return [reading count, lowest temperature, highest temperature]. With no readings return [0, None, None].",
                    hint: "Keep a list of matching readings."
                },
                {
                    title: "Longest rainy spell",
                    brief: "Each day has a rain value. Return [longest consecutive run with rain > 0, total rainy days].",
                    hint: "A dry day resets the current streak, not the total."
                },
                {
                    title: "Warmest day",
                    brief: "Return the index of the first warmest day, or None for no days. Fix the code that picks the last tie.",
                    hint: "Replace the best index only for a strictly warmer day."
                }
            ]
        },
        // Lesson 29
        {
            title: "The voting board",
            intro: "Decide how to treat spaces, capitalization and repeated entries before counting votes. Apply the same cleaning rule to each input.",
            question: "How many valid votes remain?",
            why: "Both blue votes survive cleaning while the blank is discarded.",
            stretch: "Make two spellings of one choice and add an empty vote.",
            reflect: "Which entries should count as one choice and which count as separate votes?",
            tasks: [
                {
                    title: "Clean the names",
                    brief: "Strip outer spaces, lowercase each name and discard blanks. Return the remaining names in their original order.",
                    hint: "Check the string after stripping it."
                },
                {
                    title: "Election results",
                    brief: "Clean names and discard blanks. Return [sorted list of all tied winners, highest votes], or [[], 0] when nobody voted.",
                    hint: "Count votes for cleaned names before looking for the maximum."
                },
                {
                    title: "Club membership",
                    brief: "Each row holds [student code, club]. Strip and lowercase club names, skip blank clubs, and count each code once per club. Return membership counts by club.",
                    hint: "Keep a separate set of codes for each club."
                },
                {
                    title: "Vote percentage",
                    brief: "Return the whole percentage of yes votes, rounded down, or zero for no votes. Fix the calculation order.",
                    hint: "Multiplying by 100 before dividing preserves precision."
                }
            ]
        },
        // Lesson 30
        {
            title: "A report from the exhibition",
            intro: "Group records by category. Track a total and a count for each category before calculating ratios or remaining amounts.",
            question: "What is the whole-number average of 2 and 6?",
            why: "Their sum is 8, divided by two readings.",
            stretch: "Add a refund or an invalid reading and inspect the affected category.",
            reflect: "Which quantities should be combined before calculating an average?",
            tasks: [
                {
                    title: "Group by stall",
                    brief: "Sum amounts in [stall, amount] records by stall and return the dictionary. Negative amounts are refunds.",
                    hint: "Include refunds when updating the total."
                },
                {
                    title: "Average waits",
                    brief: "Skip negative minutes in [stall, minutes] records. Return the floor average for each stall with at least one valid reading.",
                    hint: "Track a sum and a count separately."
                },
                {
                    title: "Donation targets",
                    brief: "Sum income records by stall. For each stall in goals return the amount still needed, with a minimum of zero. A stall with no income needs its whole goal.",
                    hint: "Build the final dictionary from the goals."
                },
                {
                    title: "Collected or remaining?",
                    brief: "Return the positive amount still needed, or zero when the goal has been reached. Repair the backwards subtraction.",
                    hint: "Start with the goal and subtract donations."
                }
            ]
        },
        // Lesson 31
        {
            title: "Coordinates on a map",
            intro: "board[r][c] selects a row first and a column second. Count both from zero starting at the top left.",
            question: "Which symbol is board[0][1]?",
            why: "The second character of the first row is T.",
            stretch: "Trace the corners of a map with different width and height.",
            reflect: "Which coordinate changes when you move one square down?",
            tasks: [
                {
                    title: "Cell lookup",
                    brief: "Return the character at a coordinate. For an empty map, negative index or off-map coordinate return ?.",
                    hint: "Check both coordinates before indexing."
                },
                {
                    title: "Treasure coordinates",
                    brief: "Return [row, column] for every mark, scanning from top to bottom and left to right. No matches or an empty board gives [].",
                    hint: "Enumerate both rows and cells."
                },
                {
                    title: "Count the lake shore",
                    brief: "The ~ symbol marks water. For each water cell count its four neighboring edges that touch land inside the map. Ignore off-map edges.",
                    hint: "Check horizontal and vertical neighbors separately."
                },
                {
                    title: "Swapped indices",
                    brief: "Coordinates are valid. Repair the lookup that swaps row and column on a rectangular map.",
                    hint: "Read board[row] first."
                }
            ]
        },
        // Lesson 32
        {
            title: "Planning a robot route",
            intro: "Each direction changes a row or column. Moving up subtracts one from the row while moving right adds one to the column.",
            question: "Where does one U step from [2, 1] lead?",
            why: "Only the row decreases, to 1.",
            stretch: "Draw a route with a blocked move and check it one command at a time.",
            reflect: "Which coordinates change on a blocked move?",
            tasks: [
                {
                    title: "Direction counter",
                    brief: "On an unbounded grid follow U, D, L and R and return [row, column]. Any other symbol means wait.",
                    hint: "Store the row and column change for each direction."
                },
                {
                    title: "Fenced robot",
                    brief: "Start at [0, 0] and follow a path of U, D, L and R on a grid of size at least one. Cancel off-grid moves. Return [final row, final column, blocked moves].",
                    hint: "Check the proposed position before moving."
                },
                {
                    title: "Chalk trail",
                    brief: "Start at [0, 0] on an unbounded floor. Return the starting cell and each newly visited cell once in first-visit order.",
                    hint: "Keep an ordered result and a set of visited cells."
                },
                {
                    title: "One step out of bounds",
                    brief: "Fix the boundary test so a coordinate equal to the grid height or width is outside.",
                    hint: "The last valid index is size minus one."
                }
            ]
        },
        // Lesson 33
        {
            title: "Each coin counts once",
            intro: "Use a set of coordinate pairs to remember visited cells. Reaching an old cell should not create another treasure there.",
            question: "What is the length after adding the same cell twice?",
            why: "A set stores a distinct pair only once.",
            stretch: "Revisit a cell and then visit a different cell with the same symbol.",
            reflect: "Why store a coordinate instead of just the symbol?",
            tasks: [
                {
                    title: "Count visited places",
                    brief: "Count distinct [row, column] positions in path.",
                    hint: "Convert a list coordinate to a tuple to use it in a set."
                },
                {
                    title: "Treasure report",
                    brief: "Visit the valid coordinates in stops. A new G earns 3 and a new C earns 1. Each cell pays once. Return [score, number of items collected].",
                    hint: "Record a treasure cell before visiting a later stop."
                },
                {
                    title: "Forgotten letters",
                    brief: "Any symbol other than a dot is a letter. Read it on the first visit to its cell. Join letters in visit order, even if two cells hold the same letter.",
                    hint: "Track visited positions rather than letters."
                },
                {
                    title: "The last collection",
                    brief: "List each item ID once in order of first appearance. Fix the version that changes their order.",
                    hint: "Append an ID when it is first seen."
                }
            ]
        },
        // Lesson 34
        {
            title: "Choose-your-path rooms",
            intro: "Describe the exits of each room with a dictionary. After each move, look up the next action in the room you actually reached.",
            question: "What does .get(\"right\", \"forest\") return when the forest has no right exit?",
            why: "The missing key selects the fallback, the current room.",
            stretch: "Build a three-room story and include an invalid exit in a route.",
            reflect: "What does the traveler do when a door is missing?",
            example: "doors = {\"forest\": {\"left\": \"lake\"}, \"lake\": {\"back\": \"forest\"}}\nprint(doors[\"forest\"].get(\"left\", \"forest\"))",
            options: ["lake","forest","Error"],
            tasks: [
                {
                    title: "Next room",
                    brief: "If the current room has an exit named action, return its destination. Otherwise return the current room, even when the room itself is missing.",
                    hint: "Use a default for both lookups."
                },
                {
                    title: "Story tracker",
                    brief: "Follow each choice from the room actually occupied. Stay for missing exits. Return [full room history, invalid choices] including the start and stays.",
                    hint: "Record one room after every choice."
                },
                {
                    title: "To the lighthouse",
                    brief: "Return the 1-based number of the first choice that reaches the target, 0 if already there, and −1 if never reached. Invalid choices still count.",
                    hint: "Check the starting room before the loop."
                },
                {
                    title: "The forgetful guide",
                    brief: "Follow each choice from the updated room and return the final room. The buggy version always looks at the first room.",
                    hint: "Use your current room as the lookup key."
                }
            ]
        },
        // Lesson 35
        {
            title: "A replay of the journey",
            intro: "Record the state after each turn. A history helps you explain why the adventure ended where it did.",
            question: "What is the second value in log?",
            why: "Energy becomes 3 after the first change and 1 after the second.",
            stretch: "Play two different routes and compare their histories.",
            reflect: "Which entry in the history marks the first difference?",
            tasks: [
                {
                    title: "Charge history",
                    brief: "Return the initial charge and the charge after each change, clamping to 0–9 after every step.",
                    hint: "Start the history with one entry."
                },
                {
                    title: "Shield practice",
                    brief: "The hits and plan lists have equal lengths. A block (“block”) reduces damage by 2 to a minimum of zero. Stop at zero health and return health history including the start.",
                    hint: "Keep health at least zero when taking the last hit."
                },
                {
                    title: "Cave lights",
                    brief: "“light” adds two fuel up to 6. “dark” costs one fuel. If you cannot enter a dark room, stop before it. Return [rooms entered, fuel history including the start].",
                    hint: "Append a history entry only for a room you entered."
                },
                {
                    title: "Shared list bug",
                    brief: "Keep a snapshot of the bag after every addition. Fix the history in which all snapshots show the final contents.",
                    hint: "Append a copy of the current bag."
                }
            ]
        },
        // Lesson 36
        {
            title: "Game project 1 · Map your world",
            intro: "Start an egg rescue or a space expedition. Store the map as rows of text with S for start, E for exit, # for a wall and . for a path. Save the map for the next lesson.",
            question: "How can a level support different starting locations?",
            why: "Searching for S works whenever the designer moves the start.",
            stretch: "Design a second map with a new start and exit.",
            reflect: "Which facts can your program discover from the map?",
            options: ["Find S in the map","Always use [0, 0]","Pick a random number first"],
            tasks: [
                {
                    title: "Find a symbol",
                    brief: "Return the first matching [row, column] scanning rows left to right from the top. Return None if missing.",
                    hint: "Return immediately when a match is found."
                },
                {
                    title: "Egg island cartographer",
                    brief: "Each map contains one S and one E. Collect all * egg coordinates in reading order and return a dictionary with start, exit and eggs.",
                    hint: "Store each position as [row, column]."
                },
                {
                    title: "Space base engineer",
                    brief: "Locate the unique S and E, count + fuel cells and ! broken floor cells. Return a dictionary with start, exit, fuel and gaps.",
                    hint: "Coordinates and counts describe different pieces of the report."
                },
                {
                    title: "Search returned too soon",
                    brief: "Check every row for E and return True if any row contains it. Fix the early return.",
                    hint: "A missing symbol in the first row proves nothing about the others."
                }
            ]
        },
        // Lesson 37
        {
            title: "Game project 2 · Movement rules",
            intro: "Try U, D, L and R on your map. Check the proposed cell before changing the player’s coordinates.",
            question: "What should an attempted step into a wall do?",
            why: "A rejected step leaves the player at the current coordinates.",
            stretch: "Try a route that hits each edge and a route that reaches the exit.",
            reflect: "How is a rejected step recorded?",
            options: ["Remove the wall","Keep the current position","Restart the whole route"],
            tasks: [
                {
                    title: "Inside the map",
                    brief: "Return True only if the position is on the map and its cell is not #. Negative coordinates are outside, and an empty map gives False.",
                    hint: "Check for an empty board before reading its width."
                },
                {
                    title: "Island movement test",
                    brief: "Follow U/D/L/R from the given start. Reject walls (#) and off-grid moves. Return [final position, number of blocked moves].",
                    hint: "Start each attempt from the last accepted position."
                },
                {
                    title: "Safe rover route",
                    brief: "Reject off-map cells, # and !. Return the complete position history as [row, column] pairs, including a repeated position for each rejected move.",
                    hint: "Record the start and one position per command."
                },
                {
                    title: "A wrong left turn",
                    brief: "Return the position change for U, D, L or R. Correct the table that confuses left and up.",
                    hint: "Left reduces the column and up reduces the row."
                }
            ]
        },
        // Lesson 38
        {
            title: "Game project 3 · Supplies and loot",
            intro: "Track coordinates where loot has already been collected. Decide the cost of a move, the capacity limit and when movement must stop.",
            question: "What prevents the same refueling point from being reused?",
            why: "A record of the used coordinates identifies the individual locations.",
            stretch: "Revisit a supply cell and record resources before and after each visit.",
            reflect: "In what order do you pay for movement and collect supplies?",
            options: ["Save the map length","Count the fuel symbols","Remember used coordinates"],
            tasks: [
                {
                    title: "Fresh finds",
                    brief: "Count distinct visited cells containing mark. The supplied coordinates are valid.",
                    hint: "Store matching positions in a set."
                },
                {
                    title: "Egg nests and energy",
                    brief: "Each valid move costs one energy. Stop before moving with zero energy. A new * gives one egg and a new + gives two energy. Return [eggs, energy left, steps].",
                    hint: "Deduct the step cost before applying fresh loot."
                },
                {
                    title: "Rover chargers",
                    brief: "Pay one fuel per valid move. Stop before a move with no fuel. A fresh + adds three fuel up to 6. Return [final fuel, chargers used, steps].",
                    hint: "Keep a separate record of used chargers."
                },
                {
                    title: "Walking on empty",
                    brief: "Return how many requested steps you can take at one fuel per step. Fix the extra step taken with zero fuel.",
                    hint: "Check fuel before incrementing the step count."
                }
            ]
        },
        // Lesson 39
        {
            title: "Game project 4 · Validate a level",
            intro: "Check the map shape before looking inside it. Then validate its symbols, start and exit so a designer gets a useful first error.",
            question: "Why is the example map not rectangular?",
            why: "The first row has three cells but the second has two.",
            stretch: "Build maps with two errors and check which error is reported first.",
            reflect: "Why does check order matter for an empty map?",
            options: ["The rows have different lengths","S is at the start","There are two rows"],
            tasks: [
                {
                    title: "Is it rectangular?",
                    brief: "Return True only for a nonempty map with at least one cell and equal row widths.",
                    hint: "Check that the first row is nonempty too."
                },
                {
                    title: "Island opening permit",
                    brief: "Return the first applicable status. An empty or uneven shape gives “size”, a missing or repeated S or E gives “start”, no * gives “egg”, otherwise return “ready”.",
                    hint: "Validate the shape before counting symbols."
                },
                {
                    title: "Space map inspection",
                    brief: "First reject an empty or uneven map with “size”. Require one S and E or return “start”. Reject symbols outside S E . # ! + with “symbol”. Otherwise return “ready”.",
                    hint: "Run the checks in the specified order."
                },
                {
                    title: "Empty map guard",
                    brief: "Return 0 for an empty map and the first row width otherwise. Fix the crash on an empty list.",
                    hint: "Check that a first row exists."
                }
            ]
        },
        // Lesson 40
        {
            title: "Game project 5 · Launch day",
            intro: "Connect your map, moves, resources and win condition. Play two routes and keep a report of one failed attempt as well as a successful one.",
            question: "What would help a new player test your finished game?",
            why: "The map, rules, sample input and expected result let the player repeat the test.",
            stretch: "Make a route that wins on its last move and another that falls just short.",
            reflect: "What information lets someone reproduce your result?",
            example: "def report(pos, score, status):\n    return {\"pos\":pos, \"score\":score, \"status\":status}\n\nprint(report([1,2], 3, \"win\"))",
            options: ["A name and a catchy title","One correct answer","Map, command rules, sample route and expected report"],
            tasks: [
                {
                    title: "Opening screen",
                    brief: "At the exit with collected ≥ target return “win”. At the exit with too little loot return “missing loot”. Otherwise return “traveling”.",
                    hint: "Check both the location and the goal."
                },
                {
                    title: "Egg rescue launch",
                    brief: "Start at S and follow U/D/L/R. Ignore walls and off-grid moves. Collect each * once. Finish immediately on E with all eggs. Return a dictionary with pos, eggs and win.",
                    hint: "Check the win condition after each accepted move."
                },
                {
                    title: "Space rescue launch",
                    brief: "Start at S with 0–6 fuel. Ignore illegal moves outside or onto # or ! at no cost. Each valid move costs one. A fresh + then adds three up to 6. Stop on E or when fuel runs out. Return pos, fuel and win in a dictionary.",
                    hint: "A blocked move spends no fuel."
                },
                {
                    title: "One turn too many",
                    brief: "Return the first win or lose event in the list. If neither appears, return continue. Fix the version that reports a later ending.",
                    hint: "Once an ending is found the function can return."
                }
            ]
        },
        // Lesson 41
        {
            title: "Lantern festival · Light the street",
            intro: "Loop over the names of lanterns so the same code lights a short street or a long one. Append one result per lantern.",
            question: "What does the example print last?",
            why: "The last name is the stage, so its completed message is last in the list.",
            stretch: "Add a sixth lantern and rerun the same code.",
            reflect: "What lets your loop adapt to the longer street?",
            example: "names = [\"Bridge\", \"Mill\", \"Stage\"]\nlit = []\nfor name in names:\n    lit.append(name + \" lit up\")\nprint(lit[-1])",
            options: ["Bridge lit up","Stage lit up","Mill lit up"],
            tasks: [
                {
                    title: "Light every lantern",
                    brief: "Append “ lit up” (lit) to every lantern name. Return all messages in the original order.",
                    hint: "Remember the space at the beginning of the suffix."
                },
                {
                    title: "The grand light trail",
                    brief: "Return [name, label] pairs. Use “start” for the first light, “end” for the last and “trail” in between. A single light is “camp”.",
                    hint: "Handle a one-light street before labeling its ends."
                },
                {
                    title: "Repair crew’s bag",
                    brief: "Return names from the street that also occur in broken. Keep the street order.",
                    hint: "Iterate through names and use broken for membership."
                },
                {
                    title: "The missing sixth light",
                    brief: "Return every name in uppercase. Repair the code that stops after five names.",
                    hint: "Iterate over the actual list."
                }
            ]
        },
        // Lesson 42
        {
            title: "Time the flashes",
            intro: "Treat the festival clock as ticks starting at zero. A tick modulo the period tells you its position in the current cycle.",
            question: "Which two numbers are printed?",
            why: "Among ticks 0 through 6, only 1 and 4 have remainder 1 when divided by 3.",
            stretch: "Shift a light by one tick and draw both schedules.",
            reflect: "How can two different periods flash at the same time?",
            options: ["0 and 3","3 and 6","1 and 4"],
            tasks: [
                {
                    title: "Light schedule",
                    brief: "List the ticks at which a light flashes, starting at 0 and repeating every positive period before ticks.",
                    hint: "The final tick considered is ticks − 1."
                },
                {
                    title: "When the bells meet",
                    brief: "Bells start at zero and ring every a and b ticks respectively. List the ticks before ticks when both ring. Both periods are positive.",
                    hint: "Check both remainders for each candidate tick."
                },
                {
                    title: "Slow-flashing lantern",
                    brief: "Build one string with ● for the first width ticks of each period and · for the others. Width ranges from zero to period.",
                    hint: "Compare the position within a period with width."
                },
                {
                    title: "A late opening signal",
                    brief: "List signal times starting at zero and including last if a signal falls exactly there. period is positive.",
                    hint: "Make the final boundary inclusive."
                }
            ]
        },
        // Lesson 43
        {
            title: "A moving ribbon of color",
            intro: "Use the length of a palette to wrap indices back to its first color. Offset the index to shift the whole pattern.",
            question: "What color is the fourth lantern?",
            why: "With an offset of one, the fourth position wraps back to palette index 1.",
            stretch: "Try a shift longer than the palette and predict the first color.",
            reflect: "Why does the last color lead back to the first?",
            example: "colors = [\"gold\", \"blue\", \"green\"]\nprint([colors[(i + 1) % len(colors)] for i in range(4)])",
            options: ["blue","gold","green"],
            tasks: [
                {
                    title: "A color wave",
                    brief: "Starting at offset shift in a nonempty palette, return count colors in a repeating pattern. Shift is nonnegative.",
                    hint: "Use the remainder to wrap past the last index."
                },
                {
                    title: "Mirror the stage",
                    brief: "Given colors from the left edge through the middle, mirror them into a full list. Use the middle color once.",
                    hint: "Reverse the left half without duplicating its last item."
                },
                {
                    title: "Expand the pattern",
                    brief: "Expand each [color, count] pair into count copies of that color. Counts are nonnegative. Return the full list in order.",
                    hint: "A count of zero adds nothing."
                },
                {
                    title: "Missing first color",
                    brief: "Start at palette[0] and repeat every color in the nonempty palette in order. Fix the shifted start.",
                    hint: "Check the very first index generated."
                }
            ]
        },
        // Lesson 44
        {
            title: "Each lantern has a state",
            intro: "Store each lantern’s on or off state under its name. The not operator flips the Boolean value when a switch is tapped.",
            question: "What is printed after all three taps?",
            why: "Two taps restore the stage and one tap turns the bridge off.",
            stretch: "Tap one lamp twice, another once, and try an unknown name.",
            reflect: "Which information must persist between taps?",
            example: "on = {\"stage\": False, \"bridge\": True}\nfor name in [\"stage\", \"bridge\", \"stage\"]:\n    on[name] = not on[name]\nprint(on[\"stage\"], on[\"bridge\"])",
            tasks: [
                {
                    title: "Switchboard",
                    brief: "All distinct named lights begin off. Toggle the named light for each tap, ignoring unknown names. Return the lights still on in the order of names.",
                    hint: "Use names to order the final result."
                },
                {
                    title: "A dimmer switch",
                    brief: "Brightness starts at zero. Apply each button change and clamp the result to 0–5 after every press. List the brightness after each press.",
                    hint: "Clamp before recording the next value."
                },
                {
                    title: "Peak light count",
                    brief: "Each tap toggles its named lantern. Return the largest number that were on at the same time.",
                    hint: "Update the peak after each tap."
                },
                {
                    title: "Unexpected light",
                    brief: "Starting at initial, toggle the light taps times and return its final state. taps is nonnegative.",
                    hint: "An even number of taps restores the original state."
                }
            ]
        },
        // Lesson 45
        {
            title: "A festival stage schedule",
            intro: "An event occupies the time from its start until its end. Another event can start at exactly that end time. Keep the previous end when checking a request.",
            question: "At what minute does the last accepted act finish?",
            why: "The second act runs from 6 to 8. The request for minute 7 overlaps it.",
            stretch: "Design two acts that touch and two that overlap by one minute.",
            reflect: "What distinguishes a free minute from a booked one?",
            tasks: [
                {
                    title: "Book the stage",
                    brief: "Requests [name, start, duration] are ordered by start. Accept each show that fits the single stage and return the accepted names in order. Durations are positive.",
                    hint: "A show may start at the exact previous end."
                },
                {
                    title: "Find the breaks",
                    brief: "From opening at 0 to close, return every positive-length free interval as [start, end]. Occupied slots are ordered and do not overlap.",
                    hint: "Check before the first and after the last show too."
                },
                {
                    title: "Lighting control",
                    brief: "Given nonoverlapping [start, end, color] shows, return the color at minute. Return “off” when no show is active.",
                    hint: "Include the start, exclude the end."
                },
                {
                    title: "Touching is not overlapping",
                    brief: "For two positive-length [start, end] shows return True only if they run simultaneously for some positive time.",
                    hint: "Compare the later start with the earlier finish."
                }
            ]
        },
        // Lesson 46
        {
            title: "Observations from the square",
            intro: "A festival observation pairs a minute with a count. Measure elapsed time by subtracting the timestamps of neighboring observations.",
            question: "What gaps are printed, in order?",
            why: "Five minus zero is 5, then twelve minus five is 7.",
            stretch: "Try unequally spaced observations and compare counts with time gaps.",
            reflect: "When would using row numbers give the wrong elapsed time?",
            tasks: [
                {
                    title: "Gaps between observations",
                    brief: "Given observation times in increasing order, return the gap between each adjacent pair. Fewer than two observations gives [].",
                    hint: "Pair all but the last timestamp with all but the first."
                },
                {
                    title: "Two observers, same minute",
                    brief: "Each team has at most one [minute, count] record per minute. At common minutes return [minute, second count − first count] in the first log’s order.",
                    hint: "Index the second log by minute."
                },
                {
                    title: "Observer’s shift",
                    brief: "Rows are [place, entrances, exits]. For the selected place return [total entrances, total exits] or [0, 0] when absent.",
                    hint: "Only matching rows contribute to the totals."
                },
                {
                    title: "Row number is not time",
                    brief: "Given ordered [minute, count] rows return the elapsed time from the first to the last observation. With no rows return 0.",
                    hint: "Take the difference of timestamps, not counts."
                }
            ]
        },
        // Lesson 47
        {
            title: "A blank is different from zero",
            intro: "Zero is a real measurement. None means nobody measured. Check explicitly for None to preserve valid zeroes.",
            question: "Which readings remain?",
            why: "The filter removes only None and keeps both measured numbers.",
            stretch: "Try a log containing a measured zero and a missing interval.",
            reflect: "What result would change if you treated missing readings as zero?",
            tasks: [
                {
                    title: "Clean measurement log",
                    brief: "Keep all measured integers in their original order and skip None. Preserve measured zeros and negative readings.",
                    hint: "Use an identity check against None."
                },
                {
                    title: "Missing intervals",
                    brief: "For each run of None return [starting index, length]. Indices start at zero.",
                    hint: "A missing interval can extend to the end of the list."
                },
                {
                    title: "Clean observation labels",
                    brief: "Strip outer spaces and lowercase every label. Discard resulting empty labels, keeping the remaining order.",
                    hint: "Check for emptiness after cleaning."
                },
                {
                    title: "Missing measurements in the mean",
                    brief: "Return the arithmetic mean of measured integers only. Return None for an empty list or a list containing only None.",
                    hint: "Divide by the number of measured values."
                }
            ]
        },
        // Lesson 48
        {
            title: "Following workshop visits",
            intro: "Use a fictional nickname to follow visits. Count every visit for workload, but count distinct names to measure how many people came.",
            question: "What does the example print?",
            why: "There are four visits from two different nicknames.",
            stretch: "Make one visitor return twice and compare visit count with visitor count.",
            reflect: "What does a set forget about an ordered visit log?",
            example: "log = [\"Cloud\", \"Star\", \"Cloud\", \"Cloud\"]\nprint(len(log), len(set(log)))",
            tasks: [
                {
                    title: "Distinct visitors per place",
                    brief: "Rows give [workshop, nickname]. Return a dictionary of distinct nickname counts for each recorded workshop.",
                    hint: "Keep one set of visitors per workshop."
                },
                {
                    title: "Between workshops",
                    brief: "From one visitor’s route return [from, to] pairs for every actual change of place. Skip stays and keep repeated journeys.",
                    hint: "Compare neighbors in the visit list."
                },
                {
                    title: "Returning travelers",
                    brief: "For each nickname seen at least twice, return it once at the moment of its second visit. Preserve that ordering.",
                    hint: "Append a name when its count first reaches two."
                },
                {
                    title: "Forgotten visits",
                    brief: "Return a dictionary of the total visits for every nickname. Three visits must be counted as three.",
                    hint: "Add to an existing entry on every repeat."
                }
            ]
        },
        // Lesson 49
        {
            title: "A typical day",
            intro: "Sort measurements to find the median. For an even number of measurements average the two central values.",
            question: "Which median is printed?",
            why: "The sorted values are 2, 3, 4, 9 and 20. The middle value is 4.",
            stretch: "Add one unusually long wait and compare the median with the mean.",
            reflect: "Which measure would you use to describe a typical visitor’s wait?",
            tasks: [
                {
                    title: "A typical wait",
                    brief: "Return the median of wait times. Return None for empty input. With an even number use the mean of the two middle values.",
                    hint: "Sort a copy before choosing the middle."
                },
                {
                    title: "Most consistent shift",
                    brief: "Each shift has a nonempty list of waits. Return the 0-based index of the shift with smallest range, picking the first tie. Return None if there are no shifts.",
                    hint: "Range is maximum minus minimum."
                },
                {
                    title: "Wait-time bands",
                    brief: "Count nonnegative waits in three bands, 0–4, 5–9 and 10+. Return the three counts in that order.",
                    hint: "Test values 4, 5, 9 and 10."
                },
                {
                    title: "An unsorted median",
                    brief: "Return the median from a nonempty list of odd length. Repair the assumption that the input is already sorted.",
                    hint: "Sort before indexing."
                }
            ]
        },
        // Lesson 50
        {
            title: "Evidence for the noticeboard",
            intro: "Compare visitors per minute when observations have different durations. Totals and rates answer different questions.",
            question: "What conclusion is printed?",
            why: "Eight visitors in ten minutes is a higher rate than twelve in thirty.",
            stretch: "Compare two stations with the same total and different observation times.",
            reflect: "Which numbers would you include to support your conclusion?",
            options: ["False, the second total is higher","True, the first rate is higher","True, the rates are equal"],
            tasks: [
                {
                    title: "Compare visitor rates",
                    brief: "a and b are [visitors, minutes]. Return “A” or “B” for the greater rate, “tie” for a tie and “missing” if either duration is zero.",
                    hint: "Check both durations before dividing."
                },
                {
                    title: "Ready to report?",
                    brief: "A plan has one count or None per observation. Return [measured count, planned count, ready]. Ready means a nonempty plan and at least minimum percent measured.",
                    hint: "Count a measured zero toward completeness."
                },
                {
                    title: "The whole-day report",
                    brief: "Add visitors and observed minutes across [visitors, minutes] shifts, then return [total visitors, total minutes, visitors per minute]. Durations are positive. No shifts gives [0, 0, None].",
                    hint: "Compute the rate from totals."
                },
                {
                    title: "A headline beyond the evidence",
                    brief: "With earlier and later counts return “up” for growth, “down” for decline, “unchanged” for equality, or “unknown” if either count is None.",
                    hint: "Handle missing information before comparing."
                }
            ]
        },
        // Lesson 51
        {
            title: "Replay the stage cues",
            intro: "Keep events in order so the performance can be replayed. A command may leave the state unchanged if it arrives at the wrong time.",
            question: "What is curtain after the last command?",
            why: "The last open command sets the curtain to True.",
            stretch: "Repeat one cue twice and inspect whether the state actually changes.",
            reflect: "Why can the number of commands differ from the number of changes?",
            tasks: [
                {
                    title: "Curtain changes",
                    brief: "Starting closed, process open and close and ignore other commands. Count only the times the curtain actually changes state.",
                    hint: "Compare the new state with the old state."
                },
                {
                    title: "Host’s microphone",
                    brief: "The microphone starts off. on and off control it. Collect all other words heard while it is on, in order.",
                    hint: "Control words are not spoken words."
                },
                {
                    title: "Edit the recording",
                    brief: "Each ordinary word adds a frame. undo removes the last frame when one exists. Return the remaining frames in order.",
                    hint: "Check the recording before removing the last item."
                },
                {
                    title: "When the bell rings",
                    brief: "Starting closed, process open and close and count bells only while the door is open.",
                    hint: "Keep the door state between commands."
                }
            ]
        },
        // Lesson 52
        {
            title: "Scoring a streak",
            intro: "Each consecutive correct tap earns more points. Track the current streak separately from the overall score.",
            question: "Which two numbers are printed?",
            why: "The hits earn 1, 2 and 1. The final streak contains one hit.",
            stretch: "Compare two sequences with the same number of hits and different streaks.",
            reflect: "Which values reset when the player misses?",
            tasks: [
                {
                    title: "Music score",
                    brief: "A 1 is a successful tap, 0 a miss. Successes in a streak earn 1, 2, 3 and so on. A miss resets the streak. Return the total score.",
                    hint: "Add the new streak length after a hit."
                },
                {
                    title: "Fill the buckets",
                    brief: "Each run of size consecutive caught drops fills a bucket and restarts the run. A 1 catches a drop and a 0 breaks the streak. Return [full buckets, remaining drops]. size is positive.",
                    hint: "Reset the current count after filling a bucket or missing."
                },
                {
                    title: "Best dance sequence",
                    brief: "Events are ok or miss. Return [0-based start, length] of the longest consecutive ok run, choosing the earliest tie. With no successes return [-1, 0].",
                    hint: "Keep the earliest best by updating only on a longer run."
                },
                {
                    title: "One streak, one award",
                    brief: "Award one badge when a continuous streak first reaches three. A longer unbroken streak does not earn another badge until a miss starts a new streak. Return the badge count.",
                    hint: "Test for exactly three."
                }
            ]
        },
        // Lesson 53
        {
            title: "A turn for everyone",
            intro: "Treat a list of players as a circle. After the last index, wrap to the first and search only as far as one full turn.",
            question: "Starting from Bold, who is two turns ahead?",
            why: "The next two names are Star and then Tuya.",
            stretch: "Test a single available player and a round when nobody is ready.",
            reflect: "What condition prevents an endless search?",
            example: "names = [\"Star\", \"Tuya\", \"Bold\"]\ni = 2\nfor _ in range(2):\n    i = (i + 1) % len(names)\nprint(names[i])",
            options: ["Star","Bold","Tuya"],
            tasks: [
                {
                    title: "Next ready player",
                    brief: "From the player after now, search at most one full circle for the first True in ready and return its index. You may return now after a full turn. Empty or all busy gives −1.",
                    hint: "Wrap with modulo and limit the number of checks."
                },
                {
                    title: "Radio request rotation",
                    brief: "Each group contributes a list of songs. Play one next song per group per round, skipping exhausted groups, until all songs are played. Return the playlist.",
                    hint: "Keep order both within groups and across rounds."
                },
                {
                    title: "Share colored pencils",
                    brief: "Visit children left to right in rounds. Give one pencil to each child still below their cap until pencils run out or all caps are reached. Return [amounts given, spare pencils].",
                    hint: "Stop if a complete round gives out nothing."
                },
                {
                    title: "Wrap past the final turn",
                    brief: "From start in a nonempty list move forward steps turns, wrapping past the end. Return the resulting name. steps can be zero.",
                    hint: "Use the remainder of the final index."
                }
            ]
        },
        // Lesson 54
        {
            title: "The trading stall",
            intro: "Check the complete transaction before changing either side of an exchange. If a resource is missing, both balances stay as they were.",
            question: "With no paint in stock, what balances remain?",
            why: "Both conditions must pass before either balance changes.",
            stretch: "Test a purchase with just enough cash and another with insufficient stock.",
            reflect: "Which records should remain unchanged after a refused trade?",
            tasks: [
                {
                    title: "Fill the entire order",
                    brief: "Each item costs price. Buy all wanted items only when both stock and money cover the full order. Return [coins left, stock left]. All inputs are nonnegative.",
                    hint: "Check both requirements before changing either balance."
                },
                {
                    title: "Instrument deposits",
                    brief: "Borrowing costs two deposit tokens. On take, borrow one instrument if tokens and stock permit. On back, return one borrowed instrument and refund two. Start with none borrowed. Return [tokens, shelf stock, borrowed].",
                    hint: "Reject a return if nothing is held."
                },
                {
                    title: "Workshop recipe",
                    brief: "bag holds material counts and cost holds one recipe’s requirements. Deduct the whole recipe once only if all ingredients are available. Missing counts are zero. Return the resulting dictionary.",
                    hint: "Check every ingredient before deducting the first."
                },
                {
                    title: "Keep the change",
                    brief: "Deduct the ticket price if there is enough money. Otherwise return the wallet balance unchanged.",
                    hint: "Try balances just below and equal to the fare."
                }
            ]
        },
        // Lesson 55
        {
            title: "Recognize the ending",
            intro: "Once a terminal event happens, the rest of the move list no longer belongs to this playthrough. Stop at the first applicable ending.",
            question: "How many lines will print?",
            why: "The first two events print, then break stops before rain.",
            stretch: "Add events after a win and compare your results.",
            reflect: "Does success on the final unit of energy count, and why?",
            tasks: [
                {
                    title: "Two cave exits",
                    brief: "Start without a key. key followed by exit gives “win”; fall immediately gives “fell”. Ignore an exit without a key. At the end of an unfinished route return “traveling”.",
                    hint: "Apply the first ending you actually reach."
                },
                {
                    title: "Robot delivery",
                    brief: "Each step costs one battery unit. A home step succeeds even when it spends the final unit. Return [status, steps taken], with “delivered” for arrival, “stopped” if power ran out and “traveling” otherwise.",
                    hint: "Check arrival on the current step before declaring an empty battery."
                },
                {
                    title: "Three lines of a mystery",
                    brief: "Each clue adds one fact. On tell return “mystery solved” with at least two clues, otherwise “guess”. Without tell the result is “to be continued”. Return [ending, number of cards read]. Commands are lowercase.",
                    hint: "Stop counting cards once the story ends."
                },
                {
                    title: "Score before the whistle",
                    brief: "Each point adds one. The first stop ends the game. Fix the count that includes later points.",
                    hint: "Exit the event loop at the first stop."
                }
            ]
        },
        // Lesson 56
        {
            title: "Mark the streets",
            intro: "Represent a street with a row of cells. A run of open cells starts at the first open cell or immediately after a wall.",
            question: "At which indices do the open sections begin?",
            why: "Index 0 starts the street and index 3 follows the wall at index 2.",
            stretch: "Draw a street starting and ending with a wall, then remove an end wall.",
            reflect: "When should an unfinished open section be recorded?",
            options: ["0 and 3","0 and 4","1 and 2"],
            tasks: [
                {
                    title: "Streets divided by walls",
                    brief: "Read a row of . and #. Return lengths of consecutive open stretches from left to right. Exclude empty stretches.",
                    hint: "Close a run at a wall and check the trailing run."
                },
                {
                    title: "Exhibition rugs",
                    brief: "For a rectangular map of floor (.) and obstacles (#), return the top-left [row, column] of every open 2×2 area, including overlaps, in row-major order. Empty maps are valid.",
                    hint: "A rug needs four open cells."
                },
                {
                    title: "Cross the river",
                    brief: "Two equal-length rows show opposite banks. A bridge fits at any column with a dot on both banks. Return qualifying column indices from left to right.",
                    hint: "Inspect the same index in both rows."
                },
                {
                    title: "Outside the map",
                    brief: "Return True only for an in-bounds dot at r, c on a rectangular, possibly empty board. Repair the negative-index problem.",
                    hint: "Check both lower bounds before indexing."
                }
            ]
        },
        // Lesson 57
        {
            title: "One-way neighbors",
            intro: "A directed road is an ordered pair from a source to a destination. A road in one direction does not guarantee a return road.",
            question: "Which destinations print directly from A, in order?",
            why: "Only rows with A as their source contribute destinations.",
            stretch: "Add a return road and compare the incoming and outgoing neighbors.",
            reflect: "Why should closing one direction leave the opposite direction open?",
            example: "roads = [[\"A\", \"B\"], [\"C\", \"A\"], [\"A\", \"D\"]]\nfor src, dst in roads:\n    if src == \"A\":\n        print(dst)",
            options: ["B, C, D","A, A","B, D"],
            tasks: [
                {
                    title: "Roads out of the square",
                    brief: "From [source, destination] pairs return distinct places reachable directly from here, in order of first appearance.",
                    hint: "Only rows with here as their source count."
                },
                {
                    title: "Buses arriving here",
                    brief: "Rows are [route name, departure stop, arrival stop]. Return sorted distinct route names arriving at stop.",
                    hint: "Filter by arrival before removing duplicates."
                },
                {
                    title: "Two-way story doors",
                    brief: "Find distinct pairs connected directly in both directions. Omit self-loops. Sort names within each pair and sort the pairs. Return a list of pairs.",
                    hint: "Check for the reverse edge as well."
                },
                {
                    title: "Close one direction",
                    brief: "Remove every road from a to b. Return the other roads in their original order, keeping the reverse road.",
                    hint: "The source and destination must both match for removal."
                }
            ]
        },
        // Lesson 58
        {
            title: "A wave of new stops",
            intro: "Explore every new neighbor one step from the current group before going farther. Record each place when it is discovered to avoid duplicates.",
            question: "Which stops enter the next layer?",
            why: "Both paths lead to D, which is recorded once.",
            stretch: "Draw a network where two branches join and predict its layers.",
            reflect: "When does a newly found place become visited?",
            tasks: [
                {
                    title: "Expand by one layer",
                    brief: "links maps each place to its outgoing neighbors. From current, return newly discovered places not already in visited, once in discovery order. Missing keys have no exits.",
                    hint: "Mark a place as soon as you discover it."
                },
                {
                    title: "Two hours for a messenger",
                    brief: "News begins at start and spreads along every outgoing road each hour. Return in sorted order all places reached within hours, including start. Hours is nonnegative.",
                    hint: "Expand one group of new places per hour."
                },
                {
                    title: "An island of one color",
                    brief: "From a valid cell on a nonempty rectangular board, count all cells connected to it by the same color, using only up, down, left and right.",
                    hint: "Record visited coordinates to avoid exploring a cell twice."
                },
                {
                    title: "Invite each name once",
                    brief: "Read candidate lists in groups. Skip known names and names already invited in this pass. Return new names in first-seen order.",
                    hint: "Update the seen set immediately."
                }
            ]
        },
        // Lesson 59
        {
            title: "Reconstruct the path",
            intro: "Remember each place’s first predecessor. Trace backward from the goal and reverse that list to recover the route.",
            question: "Which journey is reconstructed in forward order?",
            why: "The reverse trace runs from mountain through river to home, so forward travel starts at home.",
            stretch: "Break a link, then try tracing a goal with two possible routes.",
            reflect: "What is the difference between a list of visited places and an actual route?",
            example: "previous = {\"river\": \"home\", \"mountain\": \"river\"}\nroute = [\"mountain\"]\nwhile route[-1] in previous:\n    route.append(previous[route[-1]])\nprint(route[::-1])",
            options: ["mountain, river, home","home, mountain, river","home, river, mountain"],
            tasks: [
                {
                    title: "Trace the flag’s route",
                    brief: "parent maps a place to its first predecessor without cycles. Return the path start to goal inclusive, [] for a missing link, or [start] when start equals goal.",
                    hint: "Build backward then reverse."
                },
                {
                    title: "Pass the letter",
                    brief: "Chronological [giver, receiver] records describe a letter initially held only at origin. Keep only first arrivals from someone who already has it. Return the chain from origin to reader, or [] if unreached.",
                    hint: "Remember who first gave the reader a copy."
                },
                {
                    title: "Fewest tunnels",
                    brief: "In a directed graph with unit-cost tunnels return one shortest start-to-goal path. Break ties by the given neighbor order during breadth-first search. Return [] if unreachable.",
                    hint: "Record each place’s first predecessor."
                },
                {
                    title: "Route length",
                    brief: "An empty route means no path and gives −1. Otherwise return the number of moves between consecutive stops.",
                    hint: "A path containing one stop has zero moves."
                }
            ]
        },
        // Lesson 60
        {
            title: "Which road reaches the festival?",
            intro: "Compare the total time, cost and closures of candidate routes. Having fewer sections does not guarantee a shorter journey.",
            question: "How many sections does the fastest route contain?",
            why: "The three-section route takes six minutes, ahead of seven and nine.",
            stretch: "Make two routes tie on time and test the next tie-breaking rule.",
            reflect: "What should the program report if no route qualifies?",
            tasks: [
                {
                    title: "Fastest route index",
                    brief: "Each route lists segment times. Return the first 0-based index with smallest total time, or −1 for no candidates. An empty route takes zero time.",
                    hint: "Compare sums and keep the first tie."
                },
                {
                    title: "The tool cart’s journey",
                    brief: "From [name, minutes, fee] choose the fastest affordable route. Break ties by lower fee, then original order. Return the name or “none” if none fit.",
                    hint: "Filter by budget before comparing times."
                },
                {
                    title: "A rainy-day tour",
                    brief: "Exclude tours through closed places. Maximize the number of distinct places visited, then minimize total stops, then choose the earliest index. Return −1 if none qualify.",
                    hint: "Distinct places and number of stops may differ."
                },
                {
                    title: "Two tied routes",
                    brief: "Return the first index with the minimum time or −1 for empty input. Repair the update that picks the last tie.",
                    hint: "Update only on a strictly better time."
                }
            ]
        },
        // Lesson 61
        {
            title: "Change one rule per trial",
            intro: "Pair old and new results from the same track. Subtract within each pair to avoid comparing an easy course with a difficult one.",
            question: "What happened on the third map?",
            why: "Its result changed from 9 to 6, a reduction of 3.",
            stretch: "Change one rule, run the same maps again and record the differences.",
            reflect: "Which conditions should you keep fixed during the comparison?",
            options: ["It became 3 steps longer","It became 3 steps shorter","It became 6 steps shorter"],
            tasks: [
                {
                    title: "Which routes changed?",
                    brief: "Compare equally long old and new time lists. Return the 0-based indices whose times changed in ascending order.",
                    hint: "Compare both readings for the same route."
                },
                {
                    title: "Cycle track measurements",
                    brief: "Compare equally long time lists. Return [faster count, unchanged count, slower count]. A smaller new time means faster.",
                    hint: "Each pair belongs to exactly one category."
                },
                {
                    title: "An incomplete trial",
                    brief: "Each record is [stage, version, seconds] with at most one A and B per stage. For stages with both, return [stage, B time − A time] in first-seen stage order.",
                    hint: "Track A and B measurements separately for every stage."
                },
                {
                    title: "Too many changes",
                    brief: "Two settings dictionaries have identical keys. Return True only when exactly one value changed. Fix the test that accepts multiple changes.",
                    hint: "Count changed values before checking the total."
                }
            ]
        },
        // Lesson 62
        {
            title: "A replayable bug report",
            intro: "Record the initial state, commands and expected results. Look for the first difference between expected and observed, then replay that turn.",
            question: "On which turn does the first mismatch occur?",
            why: "The first values agree and the second differ. Turn numbers here start at 1.",
            stretch: "Save the shortest sequence that still reveals the discrepancy.",
            reflect: "What evidence would help someone reproduce your bug?",
            tasks: [
                {
                    title: "First mismatch",
                    brief: "Compare two logs. Return the 0-based first differing index. If a common prefix ends because one log is shorter, return the first missing index. Identical logs give −1.",
                    hint: "Check the lengths if all paired entries agree."
                },
                {
                    title: "Cart recorder",
                    brief: "A cart starts at start on a track from 0 through last. Apply each integer displacement, stopping at the boundary on overshoot. Return the start and every later position.",
                    hint: "Clamp after each displacement."
                },
                {
                    title: "Trace the bag",
                    brief: "Start with an empty bag. Each event is [“put”, item] to insert or [“take”, item] to take one matching copy if available. Return the item count after every event.",
                    hint: "Taking an absent item leaves the count unchanged."
                },
                {
                    title: "A changing old snapshot",
                    brief: "After adding each color, save a separate list of all colors so far. Fix the history in which every entry shows the last state.",
                    hint: "Append a copy rather than the working list."
                }
            ]
        },
        // Lesson 63
        {
            title: "Listen to playtesters",
            intro: "Count distinct players as well as comments. Repeated reports from one player and reports from several players tell different stories.",
            question: "How many distinct players mentioned the door?",
            why: "Anu is counted once and Bat once.",
            stretch: "Collect fictional playtest notes and rank the obstacles by affected players.",
            reflect: "Which issue would you address first and what evidence supports it?",
            example: "notes = [(\"Anu\", \"door\"), (\"Anu\", \"door\"), (\"Bat\", \"door\")]\nprint(len({player for player, place in notes if place == \"door\"}))",
            tasks: [
                {
                    title: "Count obstacles",
                    brief: "Rows are [place, action]. Count only “stuck” events by place. Omit places with no stuck events.",
                    hint: "Filter by action before counting."
                },
                {
                    title: "Prioritize repairs",
                    brief: "Rows are [nickname, obstacle]. Return [obstacle, number of distinct players] sorted by decreasing count, then increasing obstacle name using ordinary Python order.",
                    hint: "Count distinct nicknames within each obstacle."
                },
                {
                    title: "When to offer a hint",
                    brief: "Events are “miss” or “pass”. Record the 1-based turn on the second consecutive miss. No more hints in that streak. A pass resets it.",
                    hint: "Record a turn when the miss counter first equals two."
                },
                {
                    title: "Lost first impressions",
                    brief: "Rows are [stage, comment]. Keep only the first comment for each stage in a dictionary. Fix the code that overwrites it.",
                    hint: "Check for an existing key before assigning."
                }
            ]
        },
        // Lesson 64
        {
            title: "A menu for a new player",
            intro: "Give actions clear names and numbers. Offer a useful response to unknown input and text captions for events usually communicated by sound.",
            question: "Which number appears before help in the example?",
            why: "enumerate starts at 1 and the instructions are the second entry.",
            stretch: "Try navigating using only numbers, then try playing with sound off.",
            reflect: "Which piece of feedback helps a new player recover from a mistake?",
            example: "options = [\"start\", \"help\", \"exit\"]\nfor number, name in enumerate(options, 1):\n    print(number, name)",
            tasks: [
                {
                    title: "Menu shortcuts",
                    brief: "Ignore outer spaces and case. Map 1 or start to “start”, ? or help to “help”, and 0 or quit to “quit”. Unknown input returns “choose again”.",
                    hint: "Clean the text before looking up an alias."
                },
                {
                    title: "A menu of levels",
                    brief: "Display size names per page from an ordered list. Pages start at 1 and size is positive. Return the requested page preserving order, or an empty list for a page outside the valid range.",
                    hint: "The first index of a page is (page − 1) × size."
                },
                {
                    title: "Text instead of sound",
                    brief: "Convert ding to “Star collected”, tap to “Door knocked” and bell to “Time is up”. Skip unknown events and preserve order and repetitions.",
                    hint: "Map only recognized sounds to captions."
                },
                {
                    title: "Zero opens the last choice",
                    brief: "A valid 1-based number returns its option name. An invalid number returns “check your choice”. Fix the accidental use of negative indices.",
                    hint: "Validate the number before subtracting one."
                }
            ]
        },
        // Lesson 65
        {
            title: "Game jam · Build your game",
            intro: "Choose a secret pattern puzzle or a crystal collection game. Test the rules of one turn, then connect them to a playable game in the experiment.",
            question: "How many moves did the player use?",
            why: "Instructions do not use a turn and the quit command stops the loop. Two guesses count.",
            stretch: "Change your game title, secret or reward, then play through one full round.",
            reflect: "Which change made the player’s decision more interesting?",
            example: "moves = [\"help\", \"AAA\", \"BAB\", \"exit\", \"BBB\"]\nused = 0\nfor move in moves:\n    if move == \"exit\":\n        break\n    if move != \"help\":\n        used += 1\nprint(used)",
            tasks: [
                {
                    title: "Recognize legal moves",
                    brief: "Return commands from allowed in their original order until “quit” or limit accepted moves. Unknown commands use no turn. limit is a nonnegative integer.",
                    hint: "Stop at the limit even if more valid commands remain."
                },
                {
                    title: "Secret pattern decoder",
                    brief: "For equal-length secret and guess return [exact position matches, matches in other positions]. Count exact positions first. Each remaining symbol can match only one remaining symbol in the secret.",
                    hint: "Remove exact matches before counting shared symbols."
                },
                {
                    title: "Pick or bank crystals?",
                    brief: "Return [bag, bank] after one turn. “bank” banks the whole bag and empties it. “pick” adds a positive gem to the bag, or empties the bag for a zero gem. Other commands leave both values unchanged.",
                    hint: "Write down the two balances for each action."
                },
                {
                    title: "A player asks to leave",
                    brief: "Return a new list of commands before the first “quit”, excluding quit itself. Repair the game that keeps playing after quit.",
                    hint: "Stop at the first quit command."
                }
            ]
        },
        // Lesson 66
        {
            title: "Game jam · Playtest and revise",
            intro: "Open the project you chose in the previous lesson. Add a clue or a shield, play a round, try one invalid command and repair a problem you find.",
            question: "What are the second steps in the old and new versions?",
            why: "The copy gets a new entry at index 1, while the old list keeps its original entry.",
            stretch: "Replay the same sequence before and after one change and record the difference.",
            reflect: "What evidence shows that the new version fixes the problem?",
            example: "old = [\"help\", \"play\", \"result\"]\nnew = old.copy()\nnew.insert(1, \"example\")\nprint(old[1], new[1])",
            options: ["play example","example example","play play"],
            tasks: [
                {
                    title: "Did the fix work?",
                    brief: "Given equal-length lists of test names and old and new Boolean results, return [formerly failing tests now passing, formerly passing tests now failing]. Keep the original name order.",
                    hint: "Look at transitions in both directions."
                },
                {
                    title: "Buy a pattern clue",
                    brief: "Undiscovered symbols in mask are underscores. If at least two stars and an unrevealed position remain, reveal the leftmost unknown from secret and spend two stars. Return [new mask, stars left], otherwise keep both values.",
                    hint: "Check the price and the first unknown position before spending stars."
                },
                {
                    title: "A shield for the collector",
                    brief: "Return [new bag, remaining shields] after picking a gem. Add a positive gem. On zero, spend a shield to keep the bag if possible, otherwise empty it.",
                    hint: "Handle the zero-gem event separately."
                },
                {
                    title: "A full bag on replay",
                    brief: "From the previous game’s name, bag, bank and turns return a fresh dictionary keeping the name and resetting all three numbers to zero.",
                    hint: "Build a new state instead of editing the old one."
                }
            ]
        }
    ];

    function translatedComments(source) {
        return source.replace(/^([ \t]*# )([^\r\n]*)/gm, (line, prefix, comment) =>
            Object.hasOwn(comments, comment) ? prefix + comments[comment] : line);
    }

    // Only the game's own shell is translated; an experiment can include an
    // arbitrary function written by the learner, including personal text.
    const gamePhrases = {
        'Нууц хээ · Нууц хээ, тоглоомын нэр, оролдлогын тоог өөрчлөөрэй.': 'Secret pattern. Change the title, secret and number of guesses.',
        'Сарны хаалганы нууц хээ': 'The moon gate puzzle',
        'тэмдэгттэй нууцыг таа. Сонгох тэмдгүүд:': 'symbols in the secret. Choose from:',
        'Тэмдэг давтагдаж болно. Тоглоомыг зогсоох бол гарах гэж бич.': 'Symbols may repeat. Enter quit to stop playing.',
        '2 од зарцуулж нэг байрлал нээхийн тулд сэжүүр гэж бич.': 'Enter hint to spend 2 stars and reveal a position.',
        'Таамаг: ': 'Your guess: ',
        'Нээгдсэн хээ:': 'Pattern revealed:',
        'Үлдсэн од:': 'Stars left:',
        'Дахиад оролдоорой. Урт:': 'Try again. Required length:',
        'Ашиглах тэмдэг:': 'Available symbols:',
        'Яг таарсан:': 'Exact matches:',
        'Өөр байранд:': 'Right symbol, wrong position:',
        'Хаалга нээгдлээ! Та яллаа.': 'The gate opens! You win.',
        'Үлдсэн оролдлого:': 'Guesses left:',
        'Хээ далд үлдлээ. Нууц нь': 'The gate stays closed. The secret was',
        'байжээ.': '.',
        'Болор түүх · Зам, зорилго, тоглоомын нэрийг өөрөө зохиогоорой.': 'Crystal collector. Design your own trail, goal and title.',
        'Саран агуйн болор': 'Crystals of Moon Cave',
        'Ээлж тус бүрийн болор. 0 бол хоосон чулуу.': 'Crystals per turn. A zero is an empty stone.',
        'ээлжид авдартаа': 'turns to store',
        'болор хийвэл ялна.': 'crystals in your chest to win.',
        'түү — болрыг уутандаа хий; 0 таарвал уут асгарна.': 'Enter pick to put a crystal in your bag. A zero empties the bag.',
        'хадгал — энэ ээлжийн чулууг өнгөрөөж уутаа авдарт хий. гарах — тоглоомыг зогсоо.': 'Enter bank to skip this stone and empty your bag into the chest. Enter quit to stop.',
        'Чулуу таарахад нэг удаа хамгаалалт уутыг аварна.': 'One shield can protect your bag from an empty stone.',
        'Ээлж': 'Turn',
        'Уут:': 'Bag:',
        'Авдар:': 'Chest:',
        'Дараа уулзъя!': 'See you next time!',
        'түү эсвэл хадгал гэж бичээрэй.': 'Enter pick or bank.',
        'Таарсан чулуу:': 'Stone found:',
        'Үлдсэн хамгаалалт:': 'Shields left:',
        'Авдар дүүрлээ! Та яллаа.': 'The chest is full! You win.',
        'болор': 'crystals',
        'Аялал өндөрлөлөө. Авдар:': 'The journey is over. Chest:',
        'Зорилго:': 'Goal:'
    };

    function translateGameShell(source) {
        const phrases = text => Object.hasOwn(gamePhrases, text) ? gamePhrases[text] : text;
        return source
            .replace('action = input("түү / хадгал / гарах: ").strip().lower()',
                'command = input("pick / bank / quit: ").strip().lower()\n    action = {"pick": "түү", "bank": "хадгал", "quit": "гарах"}.get(command, command)')
            .replace('command.lower() == "гарах"', 'command.lower() in ("quit", "гарах")')
            .replace('command.lower() == "сэжүүр"', 'command.lower() in ("hint", "сэжүүр")')
            .replace('SYMBOLS = "АБВ"', 'SYMBOLS = "ABC"')
            .replace('SECRET = "АБА"', 'SECRET = "ABA"')
            .replace(/"([^"\n]*)"/g, (_, literal) => '"' + phrases(literal) + '"')
            .replace(/^# (.*)$/gm, (_, comment) => '# ' + phrases(comment));
    }

    function prepareGame(game, project, kind, english) {
        const marker = '__LEARNER_FUNCTION_GOES_HERE__';
        const build = game.withProject;
        const [prefix, suffix] = build(marker).split(marker);
        const before = english ? translateGameShell(prefix) : prefix;
        const after = english ? translateGameShell(suffix) : suffix;
        game.withProject = source => {
            const original = build(source);
            const mechanic = original.slice(prefix.length, original.length - suffix.length);
            // The controller uses the original command keys, but the learner's
            // harvest function may use English or Mongolian from a saved draft.
            const harvestDefinition = (prefix + mechanic).match(/def harvest\([^]*?(?=\ndef |$)/)?.[0] || '';
            const englishHarvest = /["'](?:pick|bank)["']/.test(harvestDefinition);
            const shell = englishHarvest ? after.replaceAll('harvest(bag, bank, action, gem)',
                'harvest(bag, bank, {"түү": "pick", "хадгал": "bank"}.get(action, action), gem)') : after;
            return before + mechanic + shell;
        };
        game.code = game.withProject(project.solution);
        if (!english) return;
        if (kind === 0) {
            game.stdin = game.stdin.replaceAll('сэжүүр', 'hint').replaceAll('А', 'A').replaceAll('Б', 'B');
        } else {
            game.stdin = game.stdin.replaceAll('түү', 'pick').replaceAll('хадгал', 'bank');
        }
    }

    function localizeTask(task, fields, vocabulary, english) {
        const sampleMarker = ' Эхний жишээний үр дүн: ';
        const sampleAt = task.brief.indexOf(sampleMarker);
        const sample = sampleAt < 0 ? '' : task.brief.slice(sampleAt + sampleMarker.length);
        const words = Object.keys(vocabulary || {}).sort((a, b) => b.length - a.length);
        // Dictionary keys contain letters, spaces and literal punctuation only.
        const pattern = words.length && new RegExp('(?<![\\p{L}])(' +
            words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
            ')(?![\\p{L}])', 'gu');
        const translate = value => pattern ? value.replace(pattern, word => vocabulary[word]) : value;
        if (english) {
            Object.assign(task, fields);
            if (sample) task.brief += ' First example result: ' + translate(sample);
            task.starter = translatedComments(task.starter);
            task.checkHint = task.hint;
        }
        if (!words.length) return;
        // Localize only the trusted exercise fixtures. Saved user drafts stay verbatim.
        const originalCheck = task.check;
        const translatedCheck = translate(originalCheck);
        if (english) {
            task.starter = translate(task.starter);
            task.solution = translate(task.solution);
        }
        if (translatedCheck !== originalCheck) {
            task.check = english ? translatedCheck : originalCheck;
            task.checkAlternative = english ? originalCheck : translatedCheck;
        }
    }

    function apply(course, chapterList, language = 'en') {
        const english = language === 'en';
        if (english) chapterList.forEach((chapter, index) => {
            if (!chapters[index]) return;
            chapter.title = chapters[index];
            chapter.timing = chapter.timing.map(([, duration], phase) => [
                phase === 4 && index === chapters.length - 1 ? 'Playtest' : phases[phase], duration
            ]);
        });
        course.forEach((lesson, index) => {
            const entry = lessons[index];
            if (!entry) return;
            const {tasks, ...fields} = entry;
            if (english) Object.assign(lesson, fields);
            [lesson.lab, ...lesson.projects, lesson.debug].forEach((task, slot) => {
                localizeTask(task, tasks[slot], taskVocabulary[(index + 1) + '.' + slot], english);
            });
            lesson.capstone?.games.forEach((game, kind) => prepareGame(game, lesson.projects[kind], kind, english));
        });
    }

    return {apply};
})();
