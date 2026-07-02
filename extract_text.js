const fs = require('fs');
const path = require('path');

const xmlPath = path.join(__dirname, 'docx_extracted', 'word', 'document.xml');
if (!fs.existsSync(xmlPath)) {
    console.error("document.xml not found at", xmlPath);
    process.exit(1);
}

const xml = fs.readFileSync(xmlPath, 'utf8');

// We split by <w:p>
const paragraphs = xml.split(/<w:p\b[^>]*>/);
const output = [];

for (let i = 1; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    // Check style (heading)
    let headingLevel = null;
    const styleMatch = p.match(/<w:pStyle\s+[^>]*w:val="([^"]+)"/);
    if (styleMatch) {
        const val = styleMatch[1];
        // Capture common heading names or levels
        if (val.toLowerCase().includes('heading') || val.toLowerCase().includes('tieu đề') || val.toLowerCase().includes('tieude') || /^\d+$/.test(val)) {
            headingLevel = val;
        }
    }
    
    // Extract all text inside <w:t> tags
    const tMatches = p.match(/<w:t\b[^>]*>(.*?)<\/w:t>/g);
    let text = '';
    if (tMatches) {
        text = tMatches.map(t => {
            const m = t.match(/<w:t\b[^>]*>(.*?)<\/w:t>/);
            // Decode simple XML entities
            return m ? m[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'") : '';
        }).join('');
    }
    
    if (text.trim()) {
        if (headingLevel) {
            output.push(`[Style:${headingLevel}] ${text.trim()}`);
        } else {
            output.push(text.trim());
        }
    }
}

fs.writeFileSync('extracted_report.txt', output.join('\n\n'), 'utf8');
console.log(`Successfully extracted ${output.length} paragraphs/headings to extracted_report.txt`);
