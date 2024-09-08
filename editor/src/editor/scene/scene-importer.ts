import {
    Tags,
    SceneLoader,
    MultiMaterial,
    Tools as BabylonTools,
    FilesInputStore,
} from 'babylonjs';

import Editor from '../editor';

import Tools from '../tools/tools';
import Request from '../tools/request';

import Storage from '../storage/storage';

import Window from '../gui/window';
import Picker from '../gui/picker';

import ProjectExporter from '../project/project-exporter';
import { ProjectRoot } from '../typings/project';

export default class SceneImporter {
    /**
     * Checks if the user opened a file using the OS file editor. If yes, load the project
     * @param editor the editor reference
     */
    public static async CheckOpenedFile (editor: Editor): Promise<boolean> {
        // Get path
        const path = await Request.Get<string>('/openedFile');
        if (!path)
            return false;

        // Parse project content
        const content = await Tools.LoadFile<string>(path);
        if (content === '')
            return false;
        
        const project = <ProjectRoot> JSON.parse(content);
        return await this.LoadProjectFromFile(editor, path, project);
    }

    /**
     * Loads the given project by loading all needed files
     * @param editor the editor reference
     * @param path the absolute path of the file
     * @param project the project previously parsed/read, etc.
     * @param fullLoad sets if the loader should load newly added files in the scene folder
     */
    public static async LoadProjectFromFile (editor: Editor, path: string, project: ProjectRoot, fullLoad: boolean = true): Promise<boolean> {
        // Load files
        const promises: Promise<void>[] = [];
        const files: File[] = [];
        const folder = path.replace(Tools.GetFilename(path), '');

        const failedToLoadList: string[] = [];
        const newlyAddedList: string[] = [];

        const storage = await Storage.GetStorage(editor);

        // Manage backward compatibility for file list
        if (!project.filesList) {
            const filesList = await storage.getFiles(folder);
            project.filesList = [];
            for (const v of filesList) {
                if (v.folder)
                    continue;

                project.filesList.push(v.name);
            }
        }

        // Full load, reset files list to load newly added files?
        if (fullLoad) {
            const filesList = await storage.getFiles(folder);
            const scene = filesList.find(v => v.name.toLowerCase() === 'scene');

            if (scene) {
                const sceneFiles = await storage.getFiles(folder + 'scene');
                const lastFilesList = project.filesList;

                project.filesList = sceneFiles.filter(v => !v.folder).map(v => {
                    const path = 'scene/' + v.name;
                    const existingIndex = lastFilesList.find(f => f.toLowerCase() === path.toLowerCase());
                    if (!existingIndex)
                        newlyAddedList.push(path);

                    return path;
                });
            }
        }

        // Add the .editorproject
        project.filesList.push(Tools.GetFilename(path));

        // Load all files
        for (const f of project.filesList) {
            promises.push(new Promise<void>(async (resolve) => {
                const ext = Tools.GetFileExtension(f);
                if (ext === 'babylon' || ext === 'glb' || ext === 'gltf') {
                    FilesInputStore.FilesToLoad = { };
                }

                const buffer = await Tools.LoadFile<ArrayBuffer>(folder + f, true);
                if (!buffer) {
                    failedToLoadList.push(f);
                    return resolve();
                }

                const array = new Uint8Array(buffer);
                files.push(Tools.CreateFile(array, Tools.GetFilename(f)));

                resolve();
            }));
        }

        editor.layout.lockPanel('main', 'Loading project files...', true);
        await Promise.all(promises);

        // Setup and load
        editor._showReloadDialog = false;
        editor.filesInput.loadFiles({
            target: {
                files: files
            }
        });

        // Configure exporter
        ProjectExporter.ProjectPath = folder;

        // Notify failed to load?
        if (failedToLoadList.length > 0) {
            Window.CreateAlert('<h3>Failed to load files:</h3></br>' + failedToLoadList.join('</br>'));
        } else if (newlyAddedList.length > 0) {
            Window.CreateAlert('<h3>Loaded new files:</h3></br>' + newlyAddedList.join('</br>'));
        }

        return true;
    }

    /**
     * Import meshes from
     * @param editor the editor reference
     */
    public static async ImportMeshesFromFile (editor: Editor): Promise<void> {
        Tools.OpenFileDialog(async files => {
            let sceneFile: File = null;
            const extensions = ['babylon', 'gltf', 'glb'];

            // Configure files
            for (const f of files) {
                const name = f.name.toLowerCase();

                if (extensions.indexOf(Tools.GetFileExtension(f.name)) !== -1)
                    sceneFile = f;
                
                if (!FilesInputStore.FilesToLoad[name])
                    FilesInputStore.FilesToLoad[name] = f;
            };

            // Check
            if (!sceneFile)
                return Window.CreateAlert('No scene file where found. Available formats: .babylon, .gltf, .glb', 'Information');

            // Load external plugin?
            if (Tools.GetFileExtension(sceneFile.name) !== 'babylon') {
                editor.layout.lockPanel('main', 'Importing Loaders...', true);
                await Tools.ImportScript('babylonjs-loaders');
                editor.layout.unlockPanel('main');
            }
            
            // Read file
            try {
                const assetContainer = await SceneLoader.LoadAssetContainerAsync('file:', sceneFile.name, editor.core.scene);

                // Create picker
                const picker = new Picker('ImportMeshesFrom');
                picker.addItems(assetContainer.meshes);
                picker.open(items => {
                    // Import meshes
                    const names = items.map(i => i.name);
                    assetContainer.meshes.forEach(m => {
                        if (names.indexOf(m.name) === -1 || editor.core.scene.getMeshByID(m.id))
                            return;

                        // Add mesh
                        editor.core.scene.addMesh(m, true);

                        // Tags
                        [m].concat(m.getChildMeshes()).forEach(c => {
                            Tags.AddTagsTo(c, 'added');

                            if (c.material) {
                                Tags.AddTagsTo(c.material, 'added');

                                if (c.material instanceof MultiMaterial)
                                    c.material.subMaterials.forEach(m => Tags.AddTagsTo(m, 'added'));
                            }

                            // Id and name
                            const id = c.id;
                            const meshes = editor.core.scene.meshes.filter(m => m.id === id);
                            if (meshes.length > 1)
                                c.id += BabylonTools.RandomId();

                            // Misc.
                            c.metadata = c.metadata || { };
                            c.metadata.baseConfiguration = {
                                isPickable: c.isPickable
                            };
                            c.isPickable = true;
                        });
                    });

                    // Re-fill graph
                    editor.graph.clear();
                    editor.graph.fill();
                });
            } catch (e) {
                Window.CreateAlert(e.message, 'Error');
            }
        });
    }
}
