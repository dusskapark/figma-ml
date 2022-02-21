const isComponent = (raw: BaseNode) => {
    if ('id' in raw && 'mainComponent' in raw) {
        if (recursiveName(raw.mainComponent, 'COMPONENT_SET') !== undefined) {
            return true;
        } else return false;
    } else return false;
};

function recursiveName(node: BaseNode, nodeType: string) {
    if (node.parent == null) return;
    if (node.type == nodeType) {
        const label = toAndroidResourceName(node.name);
        return label;
    }
    return recursiveName(node.parent, nodeType);
}

function extractComponent(raw: any, x: number, y: number) {
    const rect = raw.absoluteRenderBounds;
    const name = recursiveName(raw.mainComponent, 'COMPONENT_SET');

    return {
        id: raw.id,
        bbox: [rect.x - x, rect.y - y, rect.width, rect.height],
        label: name,
    };
}

export const ExtractComponents = (raw) => {
    let components: any[] = [];
    let instances: any[] = [];

    instances = instances.concat((<ChildrenMixin>raw).findAll((child) => child.type === 'INSTANCE'));

    instances.forEach((instance) => {
        if (isComponent(instance)) {
            instance.absoluteRenderBounds !== null ? components.push(extractComponent(instance, raw.x, raw.y)) : null;
        }
    });

    return components;
};

export function toAndroidResourceName(name: string): string {
    name = name.substr(name.lastIndexOf('/') + 1);
    // Latin to ascii
    const latinToAsciiMapping = {
        ae: 'ä|æ|ǽ',
        oe: 'ö|œ',
        ue: 'ü',
        Ae: 'Ä',
        Ue: 'Ü',
        Oe: 'Ö',
        A: 'À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ',
        a: 'à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª',
        C: 'Ç|Ć|Ĉ|Ċ|Č',
        c: 'ç|ć|ĉ|ċ|č',
        D: 'Ð|Ď|Đ',
        d: 'ð|ď|đ',
        E: 'È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě',
        e: 'è|é|ê|ë|ē|ĕ|ė|ę|ě',
        G: 'Ĝ|Ğ|Ġ|Ģ',
        g: 'ĝ|ğ|ġ|ģ',
        H: 'Ĥ|Ħ',
        h: 'ĥ|ħ',
        I: 'Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ',
        i: 'ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı',
        J: 'Ĵ',
        j: 'ĵ',
        K: 'Ķ',
        k: 'ķ',
        L: 'Ĺ|Ļ|Ľ|Ŀ|Ł',
        l: 'ĺ|ļ|ľ|ŀ|ł',
        N: 'Ñ|Ń|Ņ|Ň',
        n: 'ñ|ń|ņ|ň|ŉ',
        O: 'Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ',
        o: 'ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º',
        R: 'Ŕ|Ŗ|Ř',
        r: 'ŕ|ŗ|ř',
        S: 'Ś|Ŝ|Ş|Š',
        s: 'ś|ŝ|ş|š|ſ',
        T: 'Ţ|Ť|Ŧ',
        t: 'ţ|ť|ŧ',
        U: 'Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ',
        u: 'ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ',
        Y: 'Ý|Ÿ|Ŷ',
        y: 'ý|ÿ|ŷ',
        W: 'Ŵ',
        w: 'ŵ',
        Z: 'Ź|Ż|Ž',
        z: 'ź|ż|ž',
        AE: 'Æ|Ǽ',
        ss: 'ß',
        IJ: 'Ĳ',
        ij: 'ĳ',
        OE: 'Œ',
        f: 'ƒ',
    };
    for (let i in latinToAsciiMapping) {
        let regexp = new RegExp(latinToAsciiMapping[i], 'g');
        name = name.replace(regexp, i);
    }
    // Remove no ascii character
    name = name.replace(/[^\u0020-\u007E]/g, '');
    // Remove not support character
    name = name.replace(/[\u0021-\u002B\u003A-\u0040\u005B-\u005E\u0060\u007B-\u007E]/g, '');
    // Remove Unix hidden file
    name = name.replace(/^\./, '');
    // Remove digit
    name = name.replace(/^\d+/, '');
    // Replace , - . to _
    name = name.replace(/[\u002C-\u002E\u005F]/g, '_');
    name = name.trim();
    // Replace space to _
    name = name.replace(/\s+/g, '_');
    name = name.toLowerCase();
    return name === '' ? 'untitled' : name;
}
