const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.html') || file.endsWith('.css')) results.push(file);
        }
    });
    return results;
}

const dir = 'e:\\TSS-SwabhavTechlabs-Training-Practice\\projects\\Capstone-Project\\onboardguard-frontend\\src';
const files = walk(dir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace uppercase class
    content = content.replace(/\buppercase\b/g, '');
    
    // Replace tracking classes
    content = content.replace(/\btracking-\[.*?\]\b/g, '');
    content = content.replace(/\btracking-widest\b/g, '');
    content = content.replace(/\btracking-tight\b/g, '');
    
    // Replace font sizes
    content = content.replace(/\btext-\[9px\]\b/g, 'text-sm');
    content = content.replace(/\btext-\[10px\]\b/g, 'text-sm');
    content = content.replace(/\btext-xs\b/g, 'text-sm');
    content = content.replace(/\btext-sm\b/g, 'text-base'); // Make all sm base
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
});
