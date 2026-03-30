const fs = require('fs');
const path = require('path');

function applyDarkMode(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const replacements = [
    // Container background
    [
      'border-gray-300 bg-white transition-all duration-200 ease-in-out ${',
      'border-gray-300 dark:border-white/10 bg-white transition-all duration-200 ease-in-out dark:bg-black ${'
    ],
    // Select Subject Title
    [
      'text-[16px] font-semibold sm:text-[14px]">',
      'text-[16px] font-semibold sm:text-[14px] dark:text-gray-200">'
    ],
    // Close Button
    [
      'className="ml-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-600 transition duration-200 hover:bg-gray-100"',
      'className="ml-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-600 transition duration-200 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"'
    ],
    // Dropdown Select Button
    [
      'focus:outline-none sm:py-[3.5px]"',
      'dark:border-white/10 dark:bg-[#1a1a1a] dark:text-gray-200 dark:hover:bg-white/5 focus:outline-none sm:py-[3.5px]"'
    ],
    // List Icon
    [
      'bx-list-ul text-2xl text-gray-500',
      'bx-list-ul text-2xl text-gray-500 dark:text-gray-400'
    ],
    // Dropdown containers (p-1)
    [
      'border border-gray-300 bg-white p-1 shadow-lg"',
      'border border-gray-300 bg-white dark:border-white/10 dark:bg-[#1a1a1a] p-1 shadow-lg"'
    ],
    // Dropdown containers Kebab
    [
      'className="absolute top-6 right-0 z-20 min-w-[120px] rounded-md border border-gray-200 bg-white shadow-lg"',
      'className="absolute top-6 right-0 z-20 min-w-[120px] rounded-md border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1a1a1a] shadow-lg"'
    ],
    // Dropdown items Year Level / Filter hover
    [
      'text-sm hover:bg-orange-50"',
      'text-sm hover:bg-orange-50 dark:hover:bg-white/5 dark:text-gray-200"'
    ],
    [
      'text-sm hover:bg-gray-100"',
      'text-sm hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-200"'
    ],
    [
      'text-[13px] hover:bg-gray-100"',
      'text-[13px] hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-200"'
    ],
    // Divider
    [
      'bg-[rgb(230,230,230)]"',
      'bg-[rgb(230,230,230)] dark:bg-white/10"'
    ],
    // Buttons (Add Subject, Search Toggle)
    [
      'font-semibold text-gray-700 transition-colors hover:bg-gray-100"',
      'font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"'
    ],
    // Search input
    [
      'text-[13px] font-semibold text-gray-700 outline-none hover:bg-gray-200"',
      'text-[13px] font-semibold text-gray-700 outline-none hover:bg-gray-200 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"'
    ],
    // List Headers (Program Groups)
    [
      'text-gray-700 uppercase"',
      'text-gray-700 uppercase dark:text-gray-400"'
    ],
    // Subject List Li item
    [
      '`group flex cursor-pointer items-center justify-between px-4 py-2 sm:py-1 ${selectedSubject?.subjectID === subject.subjectID ? "border-l-4 border-orange-500 bg-orange-50" : "hover:bg-gray-100"}`',
      '`group flex cursor-pointer items-center justify-between px-4 py-2 sm:py-1 ${selectedSubject?.subjectID === subject.subjectID ? "border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-500" : "hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-200"}`'
    ],
    [
      'bg-orange-50" : "hover:bg-gray-100"}',
      'bg-orange-50 dark:bg-orange-500/10 dark:text-orange-500" : "hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-200"}'
    ],
    // Kebab Menu red item
    [
      'text-sm text-red-600 hover:bg-gray-100"',
      'text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-red-400"'
    ]
  ];

  for (const [target, replacement] of replacements) {
    if (content.includes(target) && target !== replacement) {
      content = content.split(target).join(replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No applicable replacements found for: ${filePath}`);
  }
}

const files = [
  path.join(__dirname, 'src/components/subjectsProgramChair.jsx'),
  path.join(__dirname, 'src/components/subjectsFaculty.jsx')
];

files.forEach(applyDarkMode);
