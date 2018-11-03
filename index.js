const fs = require('fs');
const process = require('process');
const path = require('path');
const cheerio = require('cheerio');
const hljs = require('highlight.js');
const $ = cheerio.load(fs.readFileSync("./template/template.html",{encoding:'utf8'}),{decodeEntities:false});
const highlightCss = fs.readFileSync('./node_modules/highlight.js/styles/tomorrow-night-blue.css',{encoding:'utf8'});
$('head').append(`<style>${highlightCss}</style>`);
var md = require('markdown-it')({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return '<pre class="hljs"><code>' +
                   hljs.highlight(lang, str, true).value +
                   '</code></pre>';
          } catch (__) {}
        }
     
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
      }
});
var args = process.argv;
console.log(args);
if(args.length < 3){
    console.log("")
}
var srcPath = args[2];
var desPath = args[3] || path.join(srcPath,"out");
if(!fs.existsSync(desPath)){
    fs.mkdirSync(desPath);
}
function retrieveMarkDownFiles(srcPath,dirname) {
    var paths = fs.readdirSync(srcPath, { encoding: 'utf8' });
    paths.forEach(function (p) {
        var subPath = path.join(srcPath, p);
        var stat = fs.statSync(subPath);
        if (stat.isFile() ) {
            if(path.extname(subPath) === '.md'){
                var fileContent =  fs.readFileSync(subPath,{encoding:'utf8'});
                var renderedContent = md.render(fileContent);
                $('body').html(renderedContent);
                $('a').each(function(index, element){
                    var href = $(element).attr('href');
                    if(/^\s*(http\s*:|https\s*:|#|javascript\s*:|tel\s*:|mailto\s*:)/.test(href) === false){
                            if(/\.md/i.test(href)){
                                href = href.replace(/\.md/i,".html");
                                $(element).attr('href',href);
                            }
                    }
                });
               
                var htmlContent = $.html();
                if(htmlContent){
                    var outputPath = path.join(desPath, dirname||'', p.replace('.md','.html'));
                    fs.writeFileSync(outputPath, htmlContent, {encoding:'utf8'});
                }
            }else{
                try{
                    var fileFrom = subPath;
                    var fileTo = path.join(desPath, dirname || '',p);
                    fs.createReadStream(fileFrom).pipe(fs.createWriteStream(fileTo));
                }catch(err){
                    console.log(err.message);
                }
            }
           
        }
        if (stat.isDirectory()) {
            var outDir = path.join(dirname || '', p);
            var fullOutDir = path.join(desPath, outDir);
            if(!fs.existsSync(fullOutDir)){
                fs.mkdirSync(fullOutDir);
            }
            retrieveMarkDownFiles(subPath, outDir);
        }
    });
}
retrieveMarkDownFiles(srcPath);
