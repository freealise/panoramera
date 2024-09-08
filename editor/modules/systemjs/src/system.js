import './features/script-load.js';
import './features/fetch-load.js';
import './features/resolve.js';
import './features/import-maps.js';
import './features/depcache.js';
import './features/worker-load.js';
import './extras/global.js';
import './extras/module-types.js';
import './features/registry.js';

        System.config({
            paths: {
                "babylonjs": "./modules/babylonjs/babylon.max.js",
                "babylonjs-gui": "./modules/babylonjs-gui/babylon.gui.min.js",
                "babylonjs-materials": "./modules/babylonjs-materials/babylonjs.materials.js",
                "babylonjs-loaders": "./modules/babylonjs-loaders/babylonjs.loaders.js",
                "babylonjs-serializers": "./modules/babylonjs-serializers/babylonjs.serializers.js",
                "babylonjs-procedural-textures": "./modules/babylonjs-procedural-textures/babylonjs.proceduralTextures.js",
                "babylonjs-post-process": "./modules/babylonjs-post-process/babylonjs.postProcess.js",
                "babylonjs-node-editor": "./modules/babylonjs-node-editor/babylon.nodeEditor.js",
                "cannon": "./modules/cannon/build/cannon.js",
                "spectorjs": "./modules/spectorjs/dist/spector.bundle.js",
                "dat-gui": "./modules/dat.gui/build/dat.gui.js",
                "raphael": "./modules/raphael/raphael.js",
                "socket.io-client": "./modules/socket.io-client/dist/socket.io.js",
                "earcut": "./modules/earcut/dist/earcut.min.js",
                "oimo": "./modules/babylonjs/Oimo.js",
                "jstree": "./modules/jstree/dist/jstree.js",
                "golden-layout": "./modules/golden-layout/dist/goldenlayout.js",
                "javascript-astar": "./modules/javascript-astar/astar.js",
                "typescript": "./modules/typescript/lib/typescript.js",
                "litegraph.js": "./modules/litegraph.js/build/litegraph.min.js",

                // Editor's modules paths
                "babylonjs-editor": "./dist/editor.js",
                "animation-editor": "./dist/animations-editor.js",
                "material-viewer": "./dist/material-viewer.js",
                "behavior-editor": "./dist/behavior-editor.js",
                "graph-editor": "./dist/graph-editor.js",
                "texture-viewer": "./dist/texture-viewer.js",
                "material-editor": "./dist/material-editor.js",
                "post-process-editor": "./dist/post-process-editor.js",
                "play-game": "./dist/play-game.js",
                "path-finder": "./dist/path-finder.js",
                "metadatas": "./dist/metadata-editor.js",
                "notes": "./dist/notes.js",
                "prefab-editor": "./dist/prefab-editor.js",
                "particles-creator": "../dist/particles-creator.js",
                "extensions/extensions.js": "./build/src/extensions/extensions.js",

                "post-processes": "./build/src/extensions/post-process/post-processes.js"
            },
            packages: {
                "./build/src/": {
                    defaultExtension: "js"
                },
                "./modules/babylonjs-loaders/": {
                    format: "cjs",
                    main: "babylonjs.loaders.min.js"
                }
            },
            map: {
                css: "./modules/systemjs-plugin-css/css.js"
            },
            meta: {
                "*.css": { loader: "css" },
                "cannon": { format: "global" },
                "javascript-astar": { format: "global" },
                "typescript": { format: "global", exports: "ts" }
            },
            pluginFirst: true
        });

        // Define modules
        System.set('jquery', System.newModule({ __useDefault: $ }));

        // Lock and import
        var loadingDiv = document.getElementById('LOADING-DIV');
        w2utils.lock(loadingDiv, 'Loading Editor...', true);

        System.import("babylonjs-editor").then(function (e) {
            // Unlock and remove loading div
            w2utils.unlock(loadingDiv);
            loadingDiv.remove();
            
            // Run editor
            var editor = window.editor = new e.default();
            editor.run();
        });
