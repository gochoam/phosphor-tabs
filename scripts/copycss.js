var fs = require('fs-extra');
fs.copySync('src/', 'lib/', { filter: /\.css$/ });
fs.copySync('test/src/', 'test/build/', { filter: /\.css$/ });
