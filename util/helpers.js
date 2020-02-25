export function expDefault(path, mode = "sync"){

    const modules = {};
    const context = require.context(path, false, /\.js$/, mode);
    context.keys().forEach(file => {
        const name = fileName.replace(/^.+\/([^/]+)\.js$/, "$1");
        modules[name] = context(name).default
    });
    return modules
}