export interface GraphNode {
    id: string;
    text: string;

    group?: boolean;
    img?: string;
    data?: any;
    count?: string;
}

export interface GraphMenu {
    id: string;
    text: string;
    img: string;
}

export default class Graph {
    // Public members
    public name: string;
    public element: W2UI.W2Sidebar;

    public topContent: string;
    public bottomContent: string;

    public onClick: <T>(id: string, data: T) => void;
    public onDbleClick: <T>(id: string, data: T) => void;
    public onMenuClick: <T>(id: string, node: GraphNode) => void;

    /**
     * Constructor
     * @param name the graph name 
     */
    constructor (name: string) {
        this.name = name;
    }

    /**
     * Clear the graph
     */
    public clear (): void {
        const toRemove = [];

        this.element.nodes.forEach((n: any) => toRemove.push(n.id));
        this.element.remove.apply(this.element, toRemove);
        this.element.nodes = [];

        this.element.refresh();
    }

    /**
     * Adds the given node to the graph
     * @param node: the node to add into the graph
     * @param parent: the optional parent of the node
     */
    public add (node: GraphNode, parent?: string): void {
        this.element.add(<string>(parent || this.element), node);
    }

    /**
     * Adds a context menu item to the graph when the user
     * right clicks on the node
     * @param menu the menu to add
     */
    public addMenu (menu: GraphMenu): void {
        this.element.menu.push(menu);
    }

    /**
     * Selects the node which has the given id
     * @param id the id of the node to select
     */
    public setSelected (id: string): void {
        this.element.select(id);
    }

    /**
     * Returns the selected item
     */
    public getSelected (): GraphNode {
        return <GraphNode> this.element.get(this.element.selected);
    }

    /**
     * Builds the graph
     * @param parent the parent id
     */
    public build (parent: HTMLDivElement | string): void {
        this.element = (typeof parent === 'string' ? $('#' + parent) : $(parent)).w2sidebar({
            name: this.name,
            img: 'icon-container',
            keyboard: false,
            nodes: [],

            topHTML: this.topContent,
            bottomHTML: this.bottomContent,

            // On the user clicks on a node
            onClick: (event) => {
                if (this.onClick && event.node)
                    this.onClick(event.node.id, event.node.data);
            },
            // On the user double clicks on a node
            dblClick: (event) => {
                if (!this.onDbleClick)
                    return;
                
                const node = <GraphNode> this.element.get(event);
                if (node)
                    this.onDbleClick(event, node.data);
            },
            // On the user clicks on a context menu item
            onMenuClick: (event) => {
                if (this.onMenuClick) {
                    const node = <GraphNode> this.element.get(event.target);
                    this.onMenuClick(event.menuItem.id, node);
                }
            }
        });
    }
}