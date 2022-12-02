const moduleName = "notes-with-anchors";
const noteLabelSeparator = "note-label-separator";
const includeEntryName = "include-entry-name";
const includePageName = "include-page-name";
const includeAnchorName = "include-anchor-name";

Hooks.once("init", () => {

    game.settings.register(moduleName, noteLabelSeparator, {
        name: "Note Label Separator",
        hint: "The text that sits between the names of each the journal entry, journal page, and anchor when the label of a note isn't manually defined.",
        scope: "client",
        config: true,
        default: " ",
        type: String,
        onChange: redrawNotes
    });

    game.settings.register(moduleName, includeEntryName, {
        name: "Include Journal Entry Name",
        hint: "If this box is checked, notes that refer to an anchor and do not have manually defined labels will include the name of the referenced journal entry in the default label.",
        scope: "client",
        config: true,
        default: true,
        type: Boolean,
        onChange: redrawNotes
    });

    game.settings.register(moduleName, includePageName, {
        name: "Include Journal Entry Page Name",
        hint: "If this box is checked, notes that refer to an anchor and do not have manually defined labels will include the name of the referenced journal entry page in the default label.",
        scope: "client",
        config: true,
        default: true,
        type: Boolean,
        onChange: redrawNotes
    });

    game.settings.register(moduleName, includeAnchorName, {
        name: "Include Anchor Name",
        hint: "If this box is checked, notes that refer to an anchor and do not have manually defined labels will include the name of the anchor in the default label.",
        scope: "client",
        config: true,
        default: true,
        type: Boolean,
        onChange: redrawNotes
    });

});


Hooks.once("libWrapper.Ready", () => {

    libWrapper.register(
        moduleName,
        "NoteConfig.prototype._getSubmitData",
        function (wrapped, ...args) {
            let data = wrapped();
            data[`flags.${moduleName}.anchor`] = data.anchor;
            delete data.anchor;
            return data;
        },
        "WRAPPER"
    );

    libWrapper.register(
        moduleName,
        "NotesLayer.prototype._onDropData",
        async function (wrapped, event, data) {
            if (data.anchor?.slug) {
                // Copied and modified because there doesn't seem to be a better way to insert anchor data.
                let entry;
                const coords = this._canvasCoordinatesFromDrop(event);
                if (!coords) return false;
                const noteData = { x: coords[0], y: coords[1] };

                // Modification to insert anchor data
                mergeObject(
                    noteData,
                    expandObject({ [`flags.${moduleName}.anchor`]: data.anchor.slug })
                );

                if (data.type === "JournalEntry") entry = await JournalEntry.implementation.fromDropData(data);
                if (data.type === "JournalEntryPage") {
                    const page = await JournalEntryPage.implementation.fromDropData(data);
                    entry = page.parent;
                    noteData.pageId = page.id;
                }
                if (entry?.compendium) {
                    const journalData = game.journal.fromCompendium(entry);
                    entry = await JournalEntry.implementation.create(journalData);
                }
                noteData.entryId = entry?.id;
                return this._createPreview(noteData, { top: event.clientY - 20, left: event.clientX + 40 });
            }
            return wrapped(event, data);
        },
        "MIXED"
    );

    libWrapper.register(
        moduleName,
        "NoteDocument.prototype.label",
        function (wrapped, ...args) {
            const names = [
                game.settings.get(moduleName, includeEntryName) ? this.entry?.name : null,
                game.settings.get(moduleName, includePageName) ? this.page?.name : null,
                game.settings.get(moduleName, includeAnchorName) ? this.page?.toc?.[this.flags?.[moduleName]?.anchor]?.text : null
            ];

            if (this.text || !this.page?.toc?.[this.flags?.[moduleName]?.anchor]?.text) {
                return wrapped();
            }

            return names
                .filter(n => n)
                .join(game.settings.get(moduleName, noteLabelSeparator));
        },
        "MIXED"
    );

});


Hooks.on("renderNoteConfig", (formApp, html, rerenderData) => {

    const entrySelect = $(formApp.form.elements.entryId);
    const pageSelect = $(formApp.form.elements.pageId);

    pageSelect.closest(".form-group").after(`
        <div class="form-group">
            <label>Anchor</label>
            <div class="form-fields">
                <select name="anchor">
                </select>
            </div>
        </div>
    `);

    updateAnchorList(formApp);
    updateTextLabelPlaceholder(formApp);

    const anchorSelect = $(formApp.form.elements.anchor);

    entrySelect.change((event) => {
        updateAnchorList(formApp);
        updateTextLabelPlaceholder(formApp);
    });
    pageSelect.change((event) => {
        updateAnchorList(formApp);
        updateTextLabelPlaceholder(formApp);
    });

    anchorSelect.change((event) => {
        updateTextLabelPlaceholder(formApp);
    });

    formApp.options.height = "auto";
    formApp.position.height = "auto";
    formApp.setPosition(formApp.position);
});

Hooks.on("activateNote", (note, options) => {
    const anchor = note.document.flags?.[moduleName]?.anchor;
    if (anchor) {
        options.anchor = anchor;
    }
});


function updateAnchorList(formApp) {
    const entryId = formApp.form.elements.entryId?.value;
    const pageId = formApp.form.elements.pageId?.value;

    const page = fromUuidSync(`JournalEntry.${entryId}.JournalEntryPage.${pageId}`);
    const toc = page ? Object.values(page.toc) : [];

    const options = toc.map((anchor) => {
        const isSelected = anchor?.slug === formApp.document.flags?.[moduleName]?.anchor;
        return `<option value="${anchor.slug}"${isSelected ? " selected" : ""}>${anchor.text}</option>`;
    })
    .join("");
    formApp.form.elements.anchor.innerHTML = `<option></option>${options}`;
}

function updateTextLabelPlaceholder(formApp) {
    const entryId = formApp.form.elements.entryId?.value;
    const pageId = formApp.form.elements.pageId?.value;
    const anchor = formApp.form.elements.anchor.value;

    const entry = fromUuidSync(`JournalEntry.${entryId}`);
    const page = entry?.pages?.get(pageId);
    const toc = page?.toc;

    const placeholder = [
        game.settings.get(moduleName, includeEntryName) ? entry?.name : null,
        game.settings.get(moduleName, includePageName) ? page?.name : null,
        game.settings.get(moduleName, includeAnchorName) ? toc?.[anchor]?.text : null
    ]
    .filter(n => n)
    .join(game.settings.get(moduleName, noteLabelSeparator));

    formApp.form.elements.text.placeholder = placeholder;

}

const redrawNotes = debounce(() => canvas.notes.draw(), 100);