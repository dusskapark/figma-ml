const isComponent = (raw) => {
    return 'id' in raw && 'mainComponent' in raw;
};

function extractComponent(raw: any, x: number, y: number) {
    const rect = raw.absoluteRenderBounds;

    return {
        id: raw.id,
        bbox: [rect.x - x, rect.y - y, rect.width, rect.height],
        label: raw.name,
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
