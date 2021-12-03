// console.log((<ChildrenMixin>layer).children);

// raw 객체로부터 copmonent를 추출하여 객체화
function extractComponent(instance) {
    return {
        id: instance.id,
        bbox: [instance.x, instance.y, instance.width, instance.height],
        label: instance.mainComponent.parent.name,
    };
}

export function ExtractComponents(raw) {
    const components = [];

    for (const instance of (<ChildrenMixin>raw).children) {
        if (instance.type === 'INSTANCE') {
            components.push(extractComponent(instance));
        }
    }

    return components;
}
