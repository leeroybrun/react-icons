var fs = require('fs');
var cheerio = require('cheerio');
var camelcase = require('camelcase');
var capitalize = require('capitalize');
var components = {};
var types = {};
var _ = require('underscore');
var glob = require('glob');
var path = require('path');
var rootDir = path.join(__dirname, '..');
var attrs = ['xlink:href', 'clip-path', 'fill-opacity', 'fill'];
var cleanAtrributes = function($el, $) {
    _.each(attrs, function(attr) {
        $el.removeAttr(attr);
    });
    if($el.children().length === 0) {
        return false;
    }

    $el.children().each(function(index, el) {
        cleanAtrributes($(el), $);
    });
};

glob(path.join(rootDir, 'icons', '*', '*.svg'), function(err, icons) {
    icons.forEach(function(iconPath){
        iconPath = iconPath.replace(/\//g, path.sep);
        var id = path.basename(iconPath, '.svg');
        var svg = fs.readFileSync(iconPath, 'utf-8');
        $ = cheerio.load(svg,{
            xmlMode: true
        });
        var $svg = $('svg');
        cleanAtrributes($svg, $);
        var iconSvg = $svg.html();
        var viewBox = $svg.attr('viewBox');
        var folder = iconPath.replace(path.join(rootDir, 'icons') + path.sep, '').replace( path.sep + path.basename(iconPath), '');
        var type = capitalize(camelcase(folder));
        var name = type + capitalize(camelcase(id));
        var location = iconPath.replace(path.join(rootDir, 'icons'), '').replace('.svg', '.js');
        components[name] = location;
        if (!types[folder]) {
            types[folder] = {};
        }
        types[folder][name] = location;
        var component = `
let React = require('react');
let IconBase = require('react-icon-base');

export default class ${name} extends React.Component {
    render() {
        return (
            <IconBase viewBox="${viewBox}" {...this.props}>
                <g>${iconSvg}</g>
            </IconBase>
        );
    }
}
`

        fs.writeFileSync(path.join(rootDir, location), component, 'utf-8');
        console.log(path.join('.', location));
    });
    _.each(types, function(components, folder) {
        var iconsModule = _.map(components, function(loc, name){
            loc = loc.replace('.js', '');
            loc = loc.replace(path.sep+folder, '');
            loc = loc.replace('\\', '/');
            loc = "." + loc;
            return `export ${name} from '${loc}';`;
        }).join('\n') + '\n';
        fs.writeFileSync(path.join(rootDir, folder , 'index.js'), iconsModule, 'utf-8');
        console.log(path.join('.', folder, 'index.js'));
    });
    console.log("IconBase.js");
});
