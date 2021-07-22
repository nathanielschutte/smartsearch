
const fs = require('fs');
const readline = require('readline');

class Node {
    value;
    nodes;
    ending;
    constructor(val, end) {
        this.value = val;
        this.ending = end;
        this.nodes = [];
    }

    toString() {
        const end = this.ending ? '!' : '';
        const plus = this.nodes.length > 0 ? ` + [${this.nodes}]` : '';
        return `${this.value}${end}${plus}`;
    }
}

class SearchTree {
    #tree;
    loaded;
    count;

    constructor(file) {
        this.loaded = false;
        this.count = 0;
        this.buildSearchTree(file).then(() => {
            this.loaded = true;
            console.log('SearchTree finished loading', this.count, 'words');
            //console.log('SearchTree finished loading ', this.toString());
        });
    }
    
    matchWordInTree(word) {
        return this.matchWordInTreeNode(this.#tree, word.toLowerCase());
    }

    matchWordInTreeNode(node, word) {
        if (word.length === 0) {
            return node.nodes.length === 0 || node.ending;
        }
        const char = word[0];
        let target = -1;
        for (let i = 0; i < node.nodes.length; i++) {
            if (node.nodes[i].value === char) {
                target = i;
                break;
            }
        }
        if (target === -1) {
            return false;
        }
        else {
            return this.matchWordInTreeNode(node.nodes[target], word.substring(1));
        }
    }
    
    suggestWordInTree(word) {
        if (word.length > 0) {
            return this.suggestWordInTreeNode(this.#tree, word.toLowerCase(), '');
        }
    }

    suggestWordInTreeNode(node, word, build) {
        
        // Reached end of word, branch out with suggestions
        if (word.length === 0) {
            if (node.nodes.length === 0 && node.ending) {
                return [build]; // end of tree, return this word
            }
            if (node.nodes.length === 0) {
                return [];
            }

            // Node is not a leaf in tree, compile all word extensions
            results = [];
            if (node.ending) {
                results = [build];
            }
            for (let i = 0; i < node.nodes.length; i++) {
                results = [...results, ...this.suggestWordInTreeNode(node.nodes[i], word, build + node.nodes[i].value)];
            }
            return results;
        }

        // Finding query word path
        const char = word[0];
        let target = -1;
        for (let i = 0; i < node.nodes.length; i++) {
            if (node.nodes[i].value === char) {
                target = i;
                break;
            }
        }
        // Tree ran out of matched letters, query word will have no suggestions
        if (target === -1) {
            return [];
        }
        // Keep checking query word
        else {
            return this.suggestWordInTreeNode(node.nodes[target], word.substring(1), build + char);
        }
    }
    
    deepSuggestWordInTree(word) {
        return [word];
    }

    toString() {
        return `${this.count} words -- ${this.#tree}`;
    }

    // Tree building
    async buildSearchTree(file) {
        const fstream = fs.createReadStream(file);
        const rl = readline.createInterface({
            input: fstream,
            crlfDelay: Infinity,
        });
        const head = new Node('#', false);
        for await (const line of rl) {
            //console.log(line);
            this.addWordToTree(head, line.trim().toLowerCase());
            this.count++;
        }
        this.#tree = head;
    }

    addWordToTree(tree, word) {
        if (word.length > 0) {
            const char = word[0];
            let target = -1;
            for (let i = 0; i < tree.nodes.length; i++) {
                if (tree.nodes[i].value === char) {
                    if (word.length === 1) {
                        tree.nodes[i].ending = true;
                    }
                    target = i;
                    break;
                }
            }
            if (target === -1) {
                tree.nodes.push(new Node(char, word.length === 1));
                target = tree.nodes.length - 1;
            }
            if (word.length > 1) {
                this.addWordToTree(tree.nodes[target], word.substring(1));
            }
        }
    }
}

module.exports = SearchTree;