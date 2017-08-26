'use strict';

exports.handlers = {
    newDoclet: function (e) {
        if (e.doclet && e.doclet.name) {
            if (e.doclet.name[0] === '_') {
                e.doclet.access = 'private';
            }
        }
/*        if (e.doclet.undocumented && e.doclet.kind == 'function') {
            console.log(e.doclet.longname)
        }*/
    }
};
