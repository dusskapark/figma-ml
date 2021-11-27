export async function getPNGAssetsFromPluginMessage(
    pluginMessage: any
): Promise<{id: string; path: string; data: Uint8Array}[]> {
    let assets: any[] = [];
    let exports = pluginMessage.exportImages;
    exports.forEach((item) => {
        assets.push({
            id: item.id,
            path: item.path,
            data: item.imageData,
        });
    });
    return assets;
}

export function createAssetsPreview(assets: {id: string; path: string; data?: Uint8Array; base64?: string}[]) {
    const contentDiv = document.getElementById('content');
    const footerDiv = document.getElementById('footer');

    const assetsCount = assets.length;

    const selectAllCheckboxWrap = document.createElement('label');
    selectAllCheckboxWrap.className = 'selectAll__wrap';
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.className = 'checkbox';
    selectAllCheckbox.id = 'selectAll';
    selectAllCheckbox.checked = true;
    selectAllCheckboxWrap.appendChild(selectAllCheckbox);
    footerDiv.appendChild(selectAllCheckboxWrap);

    const selectAllLabel = document.createElement('div');
    selectAllLabel.className = 'type type--11-pos selectAll__label';
    const selectAllLabelText = document.createElement('label');
    selectAllLabelText.setAttribute('for', 'selectAll');
    selectAllLabelText.textContent = `${assetsCount} / ${assetsCount}`;

    selectAllLabel.appendChild(selectAllLabelText);
    footerDiv.appendChild(selectAllLabel);

    const exportButton = document.createElement('button');
    exportButton.className = 'button button--primary';
    exportButton.textContent = 'Next';
    footerDiv.appendChild(exportButton);

    let selectedCount = assetsCount;
    assets.forEach((item) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'export-item';

        contentDiv.appendChild(itemDiv);

        const checkboxWrap = document.createElement('label');
        checkboxWrap.className = 'export-item__checkbox';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = '_' + item.id;
        checkbox.className = 'checkbox';
        checkbox.checked = true;

        checkboxWrap.appendChild(checkbox);
        itemDiv.appendChild(checkboxWrap);

        const thumb = document.createElement('div');
        thumb.className = 'export-item__thumb';
        const image = document.createElement('img');
        if (item.data) {
            image.src = uint8ArrayToObjectURL(item.data);
        }
        if (item.base64) {
            image.src = item.base64;
        }

        thumb.appendChild(image);
        itemDiv.appendChild(thumb);

        const textWrap = document.createElement('div');
        textWrap.className = 'type type--11-pos export-item__text';
        const text = document.createElement('label');
        text.textContent = item.path;
        text.setAttribute('for', '_' + item.id);
        textWrap.appendChild(text);
        itemDiv.appendChild(textWrap);

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedCount++;
            } else {
                selectedCount--;
            }
            if (selectedCount === assetsCount || selectedCount === 0) {
                selectAllCheckbox.className = 'checkbox';
                if (selectedCount === 0) {
                    selectAllCheckbox.checked = false;
                } else {
                    selectAllCheckbox.checked = true;
                }
            } else {
                selectAllCheckbox.className = 'checkbox checkbox--mix';
                selectAllCheckbox.checked = true;
            }
            selectAllLabelText.textContent = `${selectedCount} / ${assetsCount}`;
        });

        image.onclick = () => {
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'showLayer',
                        id: item.id,
                    },
                },
                '*'
            );
        };
    });

    selectAllCheckbox.onchange = () => {
        for (let i = 0; i < contentDiv.children.length; i++) {
            const checkbox = contentDiv.children[i].firstChild.firstChild;
            (<HTMLInputElement>checkbox).checked = selectAllCheckbox.checked;
        }
        if (selectAllCheckbox.checked) {
            selectedCount = assetsCount;
        } else {
            selectedCount = 0;
        }
        selectAllCheckbox.className = 'checkbox';
        selectAllLabelText.textContent = `${selectedCount} / ${assetsCount}`;
    };
}

function uint8ArrayToObjectURL(data: Uint8Array): string {
    return URL.createObjectURL(new Blob([data], {type: 'image/png'}));
}
