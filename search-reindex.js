const fs = require('fs');
const matter = require('gray-matter');
const rmMd = require('remove-markdown');
const path = require('path');
const content_dir = 'content';
const out_file = 'static/search-index.json';



function get_files_list(dir) {
    return new Promise(async reslove => {
        let list = [];
        let files = await promisify(fs.readdir, dir);
        for (var i = 0; i < files.length; i++) {
            let file_path = `${dir}/${files[i]}`;
            let stats = await promisify(fs.lstat, file_path);
            if (stats.isDirectory())
                list = list.concat(await get_files_list(file_path));
            else
                list.push(file_path);
        }


        reslove(list);
    });


    function promisify(func, arg) {
        return new Promise((reslove, reject) => {
            func(arg, (error, result) => {
                if (error)
                    return reject(error);
                reslove(result);
            })
        });
    }
}

get_files_list(content_dir).then(list => {
    let index_list = [];
    list.forEach(file_path => {
        let data = {};
        let ext = path.extname(file_path);
        if (ext != '.md') return;

        let info = matter.read(file_path, {
            delims: '---',
            lang: 'yaml'
        });

        data = Object.assign(data, info.data);

        if (!data.uri) {
            data.uri = '/' + file_path.substring(0, file_path.lastIndexOf('.'));
            data.uri = data.uri.replace(content_dir + '/', '');
            data.uri = data.uri.replace(/_?index$/, '');
            data.uri = data.uri.replace(/([^\/])$/, '$1/');
        }

        data.content = rmMd(info.content);
        index_list.push(data);

    })

    fs.writeFileSync(out_file, JSON.stringify(index_list, null, '\t'));
    console.log(`indexed ${index_list.length} pages`);
});