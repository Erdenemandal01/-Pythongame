// Display copy for the adventure. IDs, Python identifiers and progression are shared.
(() => {
    const worlds = [
        ['Orkhon Valley','Stop at a riverside ger, print a greeting and count the coins in your saddlebags.',[
            'Here we are at the ger door. What would you like to say to our hosts?',
            'Here’s some paper and a pencil. Leave two lines for the people at home.',
            'Bold is riding with us. Write his name in the travel book.',
            'One saddlebag holds 12 coins. The other holds 8. How many in all?',
            'Anu is back from gathering the sheep. Greet her by name!',
            'See the coin on the wooden bridge over the Orkhon? It’s three steps away.'
        ]],
        ['Khentii Taiga','Follow a fork in the larch forest. Test a condition to choose a trail.',[
            'The forest keeper handed over three keys. Will that be enough to open the gate?',
            'Can we reach the edge of the forest before nightfall? Check our energy before setting off.',
            'The keeper whispered the password. Does it match the word you wrote down?',
            'We need both a map and a key to enter the taiga. Do we have them?',
            'You scored 65 on the keeper’s test. Which badge should you take?',
            'A trail leads between the trees. Check the next square, then step out and pick up the coin.'
        ]],
        ['Altai Pass','Find a steady rhythm with loops and gather the coins on the mountain crossing.',[
            'Fresh snow has fallen on the pass. Call out each of your three steps.',
            'The climbers set out five trail poles. Number them in order from the foot of the pass.',
            'There are five pouches of coins along the trail. Keep a running total as we go.',
            'The lookout is counting down from three. Stop counting when you reach zero.',
            'Six numbered stones mark the path. Pick out the even ones.',
            'Four coins lie on the bridge over the ravine. Step and collect, then do it again.'
        ]],
        ['Gobi Caravan Trail','Join a camel caravan and record what’s in its saddlebags using Python lists.',[
            'The caravan is loading its camels. Read out the items in your bag one by one.',
            'A trader has set the stones in a row. Which ones are at the two ends?',
            'Pack an apple for the ride. How many things are in your bag now?',
            'The wind has faded the lettering. Print it in capitals so we can read it.',
            'We met Anu by the well. Look up her name and level in the record.',
            'The traders are sorting their finds. Add up the ones valued at ten or more.'
        ]],
        ['Kharakhorum Relay Station','Welcome travelers with reusable functions and carry the final letter to the relay station.',[
            'Riders arrive at the station one after another. Prepare a greeting you can use for each one.',
            'The station keeper calls out a number. Can you always reply with double?',
            'Two pouches of coins arrived. Find a way to add any pair of pouches.',
            'The keeper is sorting loads with even numbers. Give them a hand with a function.',
            'Let’s count the travel fund. Your function should handle any number of pouches.',
            'Three gaps lie on the mail route. Combine one jump and one pickup into a single routine.'
        ]]
    ];
    const lessons = [
        ['Hello, Python!', 'print()', 'A program gives the computer instructions. print() displays a value. Put text inside matching single or double quotes.', 'Use print() to write a one-line greeting of your own. Below is one example.', 'Put your words in quotes inside print().', 'Try print("Hi, traveler!").'],
        ['A two-line letter','Sequence','Python runs instructions from top to bottom. Each print() normally starts a new line. A line beginning with # is a comment.', 'Print I am learning on the first line and I can do this! on the second.', 'Use one print() per message.', 'Start the second print() on a new unindented line.'],
        ['The traveler’s name','Variables','A variable is a name for a value. name = "Anu" assigns text to name. print(name) displays its value.', 'Store Bold in the variable name and print its value.', 'Inside print(), use the variable name without quotes.', 'Assign name = "Bold".'],
        ['Counting coins','Arithmetic','Write numbers without quotes. Use + to add, - to subtract, * to multiply and / to divide.', 'Add 12 and 8, store the sum in coins and print it.', 'Use coins = 12 + 8.', 'Print the sum with print(coins).'],
        ['Your own greeting','f-strings','An f-string puts values inside text. Prefix the string with f and enclose the variable name in braces, as in f"Hello, {name}!".', 'With hero = "Anu", use an f-string to print Hello, Anu!', 'Start with print(f"...").', 'Put {hero} where the name belongs.'],
        ['The Orkhon bridge','Moving with code','In this game move() takes your hero one square to the right. collect() picks up a coin on the current square.', 'Call move() three times to reach the coin, then call collect().', 'Each move() advances one square.', 'After the three moves, collect the coin.'],
        ['The taiga gate','if','Write a condition after if, followed by a colon. Indent the instructions below it by four spaces. >= means greater than or equal to.', 'When keys is at least 3, print Door open.', 'End the if line with a colon.', 'Indent print("Door open") inside the condition.'],
        ['A fork in the forest','else','When an if condition is false, the else block runs. Align else: with its if.', 'Set energy to 0. Print Rest when energy is zero and Walk when it is positive.', 'You can start with if energy > 0:.', 'Put print("Rest") inside the else block.'],
        ['The password','Equality with ==','A single = assigns a value. A double == compares two values. Uppercase and lowercase letters differ.', 'Print Correct if password equals python.', 'Write if password == "python":.', 'Indent print("Correct") below it.'],
        ['A pair of keys','and / or','and requires both conditions to be true. or requires at least one to be true. True and False are Boolean values.', 'Print Ready when has_key and has_map are both true.', 'Write if has_key and has_map:.', 'Indent print("Ready") below the condition.'],
        ['Three ranks','elif','Use elif to check another condition. Python takes the first branch whose condition is true.', 'Print Gold for scores of 80 or more, Silver for 50 or more, and Bronze otherwise. Start with score = 65.', 'Check the highest threshold first.', 'Use print("Silver") in the elif score >= 50 branch.'],
        ['The forest guard','Condition challenge','A function can return a value for an if condition. Here can_move() tells you whether the next square is safe.', 'Use if can_move(): to take one step, then collect the coin.', 'Call move() when can_move() is true.', 'Indent move() inside the if block.'],
        ['Three steps','for / range','for i in range(3): repeats a block three times. The values of i are 0, 1 and 2.', 'Print Step three times, each on a new line.', 'Put one print() inside the loop.', 'Use print("Step").'],
        ['A staircase of numbers','Range endpoints','range(1, 5) produces 1, 2, 3 and 4. The end value is excluded.', 'Print the numbers 1 through 5, one per line.', 'To include 5, stop at 6.', 'Use range(1, 6).'],
        ['A trail of coins','Running totals','total += n adds n to the running total. Set total to 0 before the loop starts.', 'Add the numbers 1 through 5 with a for loop, store the sum in total and print it.', 'Use total += n inside the loop.', 'Place print(total) after the loop, without indentation.'],
        ['The watchful guard','while','A while loop runs as long as its condition stays true. Change the counter so the loop can stop.', 'Start count at 3. Print 3, 2 and 1, subtracting 1 each time.', 'count -= 1 subtracts one.', 'Indent that line inside the loop.'],
        ['Even stones','Remainder with %','n % 2 is the remainder after dividing by 2. Even numbers have a remainder of 0. A for loop can contain an if.', 'Loop from 1 through 6 and print just the even numbers.', 'Indent if n % 2 == 0: by four spaces.', 'Indent print(n) by eight spaces.'],
        ['The bridge on the pass','Loop challenge','Use a loop to repeat the same actions. Stop and collect each coin along the way.', 'Use a for loop to move four times and collect a coin after each move.', 'Use range(4).', 'Put both move() and collect() inside the loop.'],
        ['The caravan saddlebags','Lists','A list stores values between square brackets, separated by commas. for item in bag: visits each item.', 'Print the items in the bag in order, one per line.', 'Start with for item in bag:.', 'Put print(item) inside the loop.'],
        ['The first gem','Indexing','List indices start at 0. bag[0] is the first item and bag[1] is the second.', 'Print the first and last items in gems on separate lines.', 'Index 0 gives the first item and -1 gives the last.', 'Use print(gems[0]) and print(gems[-1]).'],
        ['Pack your bag','append / len','bag.append("Apple") adds an item at the end. len(bag) returns the number of items.', 'Add Apple to bag, then print the length of the list.', 'Use bag.append("Apple").', 'Then use print(len(bag)).'],
        ['A secret message','String methods','The .upper() method returns an uppercase copy of a string. .lower() returns a lowercase copy.', 'Print the string python quest from message in uppercase.', 'message.upper() creates a new string.', 'Use print(message.upper()).'],
        ['The hero’s record','Dictionaries','A dictionary stores keys and values. Use hero["name"] to look up the value of the name key.', 'Print the name and level from hero, each on its own line.', 'hero["name"] is Anu.', 'hero["level"] is 5.'],
        ['The caravan’s finds','Data challenge','You can loop through a list, filter its values using a condition and add up the matches.', 'Add all the numbers in values that are at least 10. Save the sum in total and print it.', 'Put if value >= 10: inside for value in values:.', 'Use total += value inside the if block.'],
        ['Welcome to the relay station','def','Use def to define a reusable function. After defining def greet():, call it with greet().', 'Define greet() so each call prints Hello, traveler! Call it once.', 'Start with def greet():.', 'Indent print("Hello, traveler!") inside the function.'],
        ['Double power','return','A parameter receives an input. return sends a result back to the caller. print() displays a value on screen.', 'Make double(n) return twice n. Print double(7).', 'Use return n * 2.', 'The function is also tested with other numbers.'],
        ['Combining two coins','Multiple parameters','A function can receive several inputs. Separate the parameters with commas, as in def add(a, b):.', 'Make add(a, b) return the sum of its inputs. Print add(12, 8).', 'Add the variables a and b.', 'Use return a + b.'],
        ['The guard’s decision','Returning a Boolean','A function can return True or False. The expression n % 2 == 0 already produces a Boolean.', 'Make is_even(n) return True for even numbers and False for odd numbers. Print is_even(6).', 'An even number has remainder 0 when divided by 2.', 'Use return n % 2 == 0.'],
        ['Team strength','Lists and functions','A function can receive a list. Start a total at zero, add each number and return the total at the end.', 'Make total_coins(coins) return the sum of its list using a for loop. Print the result for [10, 20, 30].', 'Indent the for loop by four spaces inside the function.', 'Indent total += coin by eight spaces. Return total after the loop.'],
        ['The relay rider','Final challenge','Combine functions, loops and game commands. Make a skill you can use again. jump() moves two squares forward.', 'Inside cross(), call jump() and collect(). Use a for loop to call cross() three times and collect every gem.', 'jump() moves two squares.', 'Place jump() and collect() in the function, then loop with range(3).']
    ];
    const literals = new Map(Object.entries({
        'Сайн уу, Python!':'Hello, Python!', 'Сайн уу, аялагч!':'Hello, traveler!', 'Сайн уу, {hero}!':'Hello, {hero}!',
        'Сайн уу, Ану!':'Hello, Anu!', 'Би суралцаж байна':'I am learning', 'Би чадна!':'I can do this!',
        'Газрын зураг':'Map','Түлхүүр':'Key','Алим':'Apple','Бадмаараг':'Ruby','Болор':'Crystal','Алмаз':'Diamond',
        'Хаалга нээгдлээ':'Door open','Алхам':'Step','Алх':'Walk','Амар':'Rest','Зөв':'Correct','Бэлэн':'Ready',
        'Алт':'Gold','Мөнгө':'Silver','Хүрэл':'Bronze','Ану':'Anu','Болд':'Bold'
    }));
    const checks = {
        'print() дотор мэндчилгээний текстээ хэвлээрэй.':'Use print() to display greeting text.',
        'Хоёр print() дуудаарай.':'Use two calls to print().','name хувьсагчийн утгыг шалгаарай.':'Check the value of name.',
        'Нэмэх үйлдлээр coins-ийг бодоорой.':'Use addition to calculate coins.','f-string ашиглаарай.':'Use an f-string.',
        'if нөхцөл ашиглаарай.':'Use an if condition.','else салаа нэмээрэй.':'Add an else branch.',
        '== харьцуулалттай if бичээрэй.':'Use == in an if condition.','and ашиглан хоёр нөхцөлийг холбоорой.':'Combine both conditions with and.',
        'if, elif гэсэн хоёр шалгалт хэрэгтэй.':'Use both if and elif.','if ашиглаарай.':'Use if.',
        'for давталт хэрэглээрэй.':'Use a for loop.','for давталтаар тоолоорой.':'Count with a for loop.',
        'Давталтаар total-ийг тооцоолоорой.':'Use a loop to calculate total.','while давталтаа 0 дээр зогсоогоорой.':'Stop the while loop at zero.',
        'for, if, % гурвыг ашиглаарай.':'Use for, if and %.','Дөрвөн ижил командыг for-оор давтаарай.':'Use a for loop to repeat the moves.',
        'Жагсаалтаар давтаарай.':'Loop through the list.','Индексээр хоёр зүйлээ аваарай.':'Use list indices to get both items.',
        'bag-д Алим нэмээрэй.':'Add Apple to the bag.','upper() ашиглаарай.':'Use upper().',
        'Толь дотроос түлхүүрээр утгаа аваарай.':'Look up the dictionary values by key.','Жагсаалтыг давталт, нөхцөлөөр шүүгээрэй.':'Filter the list with a loop and a condition.',
        'greet функцийг үүсгээрэй.':'Define the greet function.','greet() өөрөө мэндчилгээг хэвлэх ёстой.':'Print the greeting inside greet().',
        'double функц үүсгээрэй.':'Define the double function.','double({n}) буруу үр дүн өглөө.':'double({n}) returned the wrong value.',
        'add өөр оролт дээр буруу байна.':'Check add with other inputs.','Тэгш ба сондгой тоог хоёуланг шалгаарай.':'Test both even and odd numbers.',
        'Өөр жагсаалт дээр нийлбэр буруу байна.':'Check the sum for a different list.','Функцээ үүсгээд for давталтаар дуудаарай.':'Define the function and call it from a for loop.'
    };
    function translateSample(source) {
        for (const [mn, en] of literals) source = source.replaceAll(mn,en);
        return source;
    }
    function localize(missions, worldList, english) {
        for (const [id, mission] of missions.entries()) {
            const expected = translateSample(mission.expected);
            if (expected !== mission.expected) mission.alternateExpected = english ? mission.expected : expected;
            if (!english) continue;
            const [title,concept,info,task,...hints] = lessons[id];
            Object.assign(mission,{title,concept,info,task,hints});
            mission.check = mission.check.replace(/"([^"\n]+)"/g, (full,key) => Object.hasOwn(checks,key) ? JSON.stringify(checks[key]) : full);
            mission.expected = expected;
            mission.solution = translateSample(mission.solution);
            mission.start = translateSample(mission.start).replace(/#[^\n]*[А-Яа-яӨҮөү][^\n]*/g, '# Write your code here');
        }
        if (english) worldList.forEach((world,id)=>{ [world.name,world.desc,world.stops] = worlds[id]; });
    }
    globalThis.AdventureEnglish = {localize};
})();
