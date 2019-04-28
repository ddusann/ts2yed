import GraphBuilder from './src/outputBuilder/Builder';
import ObjectBuilder from './src/objectStructure/Builder';
import Settings from './src/outputBuilder/Settings';
import UMLFile from './src/outputBuilder/UMLFile';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

const parseArguments = () => {
    return commandLineArgs([{
        name: 'alias',
        type: String,
        multiple: true
    }, {
        name: 'include',
        type: String,
        lazyMultiple: true
    }, {
        name: 'out',
        type: String
    }, {
        name: 'withPrivate',
        type: Boolean,
        defaultValue: false
    }, {
        name: 'help',
        type: Boolean,
        defaultValue: false
    }, {
        name: 'strict',
        type: Boolean,
        defaultValue: false
    }]);
};

const printHelp = () => {
    const sections = [{
        header: 'ts2yed',
        content: 'Parse typescript files and create an UML schema renderable by {bold yed} application.'
    }, {
        header: 'Options',
        optionList: [{
            name: 'alias',
            typeLabel: '{underline @alias=path}',
            description: 'Set an alias to be replaced with an absolute path.'
        }, {
            name: 'include',
            typeLabel: '{underline path}',
            description: 'Path to a file or directory, where typescript files should be parsed.'
        }, {
            name: 'out',
            typeLabel: '{underline path}',
            description: 'Path to the output (graphml) file.'
        }, {
            name: 'withPrivate',
            description: 'Put private members into the UML.'
        }, {
            name: 'help',
            description: 'Print this usage guide.'
        }]
    }];

    const usage = commandLineUsage(sections);
    console.log(usage);
};

const options = parseArguments();
const files = Array.isArray(options.include) ? options.include : (options.include ? [options.include] : []);
const aliases = Array.isArray(options.alias) ? options.alias : (options.alias ? [options.alias] : []);

if (options.help) {
    printHelp();
} else if (aliases.findIndex((alias: string) => alias.indexOf('=') === -1) !== -1) {
    console.log('One of the aliases has a wrong format. Use "@aliasName=aliasPath" format.');
    printHelp();
} else if (files.length === 0) {
    console.log('You have to specify files/directories you want to parse.');
    printHelp();
} else if (!options.out) {
    console.log('You have to specify path to the output file.');
    printHelp();
} else {
    const builder = new ObjectBuilder(files);
    aliases.forEach(alias => {
        const [aliasName, aliasPath] = alias.split('=');
        builder.addAlias(aliasName, aliasPath);
    });

    Settings.getSettings().setHidePrivateMembers(!options.withPrivate);

    builder.parse().then(folder => {
        const graphBuilder = new GraphBuilder(folder);
        return graphBuilder.getGraph();
    }).then(graph => {
        const umlFile = new UMLFile();
        umlFile.setGraph(graph);
        umlFile.generateNode().save(options.out);
    }).then(() => {
        console.log(`Output successfully saved into "${options.out}"`);
    }).catch(err => {
        console.error(`An error occured during parsing:`);
        console.error(err.message);
    });
}
