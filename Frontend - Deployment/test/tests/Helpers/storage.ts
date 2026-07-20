import fs from 'fs';

const CLASS_FILE = 'tests/data/classes.json';

export function saveClass(name: string) {
  let data = { classes: [] as string[] };

  if (fs.existsSync(CLASS_FILE)) {
    data = JSON.parse(fs.readFileSync(CLASS_FILE, 'utf8'));
  }

  data.classes.push(name);

  fs.writeFileSync(
    CLASS_FILE,
    JSON.stringify(data, null, 2)
  );
}

export function getClasses(): string[] {
  if (!fs.existsSync(CLASS_FILE)) {
    return [];
  }

  const data = JSON.parse(
    fs.readFileSync(CLASS_FILE, 'utf8')
  );

  return data.classes;
}

export function clearClasses() {
  fs.writeFileSync(
    CLASS_FILE,
    JSON.stringify({ classes: [] }, null, 2)
  );
}